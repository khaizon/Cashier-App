"""The till must keep selling with the backend unreachable.

Playwright's ``context.set_offline`` is used for the network-level cases; the
duplicate-protection test goes further and drops the *response* after letting the
request reach the server, which is the failure mode that a naive retry turns into
a double sale.
"""

from __future__ import annotations

import re
import time

from playwright.sync_api import BrowserContext, Page, expect

from conftest import API_URL, login


def ring_up(page: Page, item_name: str, times: int = 1) -> None:
    """Build a cart and press record, without asserting on the outcome."""
    card = page.locator(".itemCard", has=page.locator(".name", has_text=item_name)).first
    for _ in range(times):
        card.click()
    page.locator('.resultContainer button:has-text("RECORD")').click()
    modal = page.locator(".confirmRecordContainer")
    expect(modal).to_be_visible()
    modal.get_by_role("button", name="record!").click()


def queued_sales(page: Page) -> list[dict]:
    return page.evaluate("() => JSON.parse(localStorage.getItem('cashier.salesQueue') || '[]')")


def refs_via_api(page: Page, token: str, limit: int = 100) -> list[str]:
    response = page.request.get(
        f"{API_URL}/api/sales?limit={limit}", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.ok, response.text
    return [sale["order_ref"] for sale in response.json()]


def token_of(page: Page) -> str:
    token = page.evaluate("() => localStorage.getItem('cashier.token')")
    assert token, "expected a stored session token"
    return token


def wait_for_ref_count(page: Page, token: str, expected: int, timeout_ms: int = 30_000) -> list[str]:
    """Poll the API until it holds `expected` sales, then return the refs.

    Polling rather than sleeping: the request becomes durable on the server
    before the browser abandons it, so the exact moment is not knowable.
    """
    deadline = time.monotonic() + timeout_ms / 1000
    refs = refs_via_api(page, token)
    while len(refs) < expected and time.monotonic() < deadline:
        page.wait_for_timeout(250)
        refs = refs_via_api(page, token)
    return refs


def test_a_sale_can_be_rung_up_offline(context: BrowserContext, page: Page):
    login(page)
    expect(page.locator(".itemCard").first).to_be_visible()

    context.set_offline(True)

    ring_up(page, "Espresso", times=2)

    # The dialog reports the sale as saved on the device, not as an error.
    expect(page.locator(".confirmRecordQueued")).to_be_visible(timeout=10_000)
    expect(page.locator(".confirmRecordQueued")).to_contain_text("saved offline")

    queue = queued_sales(page)
    assert len(queue) == 1, queue
    assert queue[0]["total_cents"] == 600
    assert queue[0]["items"][0]["quantity"] == 2
    # Priced by the device from the catalogue it was showing.
    assert queue[0]["items"][0]["price_cents"] == 300


def test_the_queue_and_cart_survive_a_reload_offline(context: BrowserContext, page: Page):
    login(page)
    expect(page.locator(".itemCard").first).to_be_visible()

    context.set_offline(True)
    ring_up(page, "Espresso", times=1)
    expect(page.locator(".confirmRecordQueued")).to_be_visible(timeout=10_000)

    # A new cart item, deliberately left un-recorded.
    page.locator(".modal").click(position={"x": 4, "y": 4})
    page.locator(".itemCard", has=page.locator(".name", has_text="Green Tea")).first.click()
    expect(page.locator(".cashierStateTable")).to_contain_text("Green Tea")

    page.reload()

    # The app shell comes from the service worker, and both the queued sale and
    # the half-rung-up cart are still there.
    expect(page.locator(".itemSelector")).to_be_visible(timeout=15_000)
    expect(page.locator(".cashierStateTable")).to_contain_text("Green Tea")
    assert len(queued_sales(page)) == 1


def test_queued_sales_sync_when_the_connection_returns(context: BrowserContext, page: Page):
    login(page)
    expect(page.locator(".itemCard").first).to_be_visible()
    token = token_of(page)
    before = refs_via_api(page, token)

    context.set_offline(True)
    ring_up(page, "Long Black", times=1)
    expect(page.locator(".confirmRecordQueued")).to_be_visible(timeout=10_000)
    assert len(queued_sales(page)) == 1

    context.set_offline(False)

    # The syncer polls; the queue drains and the sale lands exactly once.
    page.wait_for_function("() => JSON.parse(localStorage.getItem('cashier.salesQueue') || '[]').length === 0", timeout=30_000)

    after = refs_via_api(page, token)
    new_refs = [ref for ref in after if ref not in before]
    assert len(new_refs) == 1, f"expected exactly one new sale, got {new_refs}"


def test_a_lost_response_does_not_double_sell(context: BrowserContext, page: Page):
    """The regression that protects the money.

    The request reaches the server and is recorded, but the response never gets
    back to the browser. The till queues the sale under the same idempotency key
    it sent, so the sync is recognised as a duplicate rather than a second sale.
    """
    login(page)
    expect(page.locator(".itemCard").first).to_be_visible()
    token = token_of(page)
    before = refs_via_api(page, token)

    bodies: list[str] = []

    def lose_the_response(route):
        # Forward so the server records it, then destroy the response before the
        # browser sees it. `route.fetch()` is synchronous in the Python client,
        # so the abort must follow it in the same call.
        bodies.append(route.request.post_data or "")
        route.fetch()
        route.abort()

    # Anchored to a path boundary: a bare `/api/sales$` also matches
    # `/api/auth/token`, since that string ends in "sales".
    #
    # This route also covers `/api/sales/sync`, so while it is installed nothing
    # the syncer tries can succeed. That is deliberate: it keeps the entry
    # visible long enough to inspect it instead of racing the drain.
    record_route = re.compile(r"/api/sales(?:/sync)?(?:\?.*)?$")

    # A pure abort first, with no request reaching the server, so the sale is
    # genuinely unrecorded and the till has to queue it.
    page.route(record_route, lambda route: route.abort())
    ring_up(page, "Flat White", times=1)
    expect(page.locator(".confirmRecordQueued")).to_be_visible(timeout=20_000)

    queue = queued_sales(page)
    assert len(queue) == 1, queue
    client_ref = queue[0]["client_ref"]
    assert client_ref, "the queued sale must carry an idempotency key"

    page.unroute(record_route)

    # The syncer keeps retrying that same key. Swap in a handler that lets each
    # attempt reach the server but still hides the first response, so the replay
    # path — not just the initial queueing — is what gets exercised.
    seen: list[str] = []

    def lose_the_first_response(route):
        seen.append(route.request.post_data or "")
        if len(seen) == 1:
            route.fetch()
            route.abort()
        else:
            route.continue_()

    page.route(record_route, lose_the_first_response)

    # Exactly one sale, and the queue drains.
    final = wait_for_ref_count(page, token, len(before) + 1)
    page.wait_for_function(
        "() => JSON.parse(localStorage.getItem('cashier.salesQueue') || '[]').length === 0", timeout=30_000
    )

    assert len(final) == len(before) + 1, f"the sale was duplicated: {before} -> {final}"
    assert queued_sales(page) == []
    assert all(client_ref in body for body in seen if body), "every attempt must reuse the same key"


def test_a_sale_queued_offline_syncs_exactly_once(context: BrowserContext, page: Page):
    """The same guarantee when the backend is unreachable for the whole sale."""
    login(page)
    expect(page.locator(".itemCard").first).to_be_visible()
    token = token_of(page)
    before = refs_via_api(page, token)

    context.set_offline(True)
    ring_up(page, "Green Tea", times=1)
    expect(page.locator(".confirmRecordQueued")).to_be_visible(timeout=15_000)
    assert len(queued_sales(page)) == 1

    context.set_offline(False)
    page.wait_for_function(
        "() => JSON.parse(localStorage.getItem('cashier.salesQueue') || '[]').length === 0", timeout=30_000
    )

    final = wait_for_ref_count(page, token, len(before) + 1)
    assert len(final) == len(before) + 1, f"the queued sale was recorded twice: {before} -> {final}"


def test_pending_drawer_lists_queued_sales(context: BrowserContext, page: Page):
    login(page)
    expect(page.locator(".itemCard").first).to_be_visible()

    context.set_offline(True)
    ring_up(page, "Green Tea", times=1)
    expect(page.locator(".confirmRecordQueued")).to_be_visible(timeout=10_000)
    # The dialog stays open on success and its backdrop swallows clicks.
    page.locator(".modal").click(position={"x": 4, "y": 4})

    page.locator(".appSyncChip").click()

    drawer = page.get_by_role("dialog", name="Sales saved on this device")
    expect(drawer).to_be_visible()
    expect(drawer).to_contain_text("Green Tea")
    expect(drawer.get_by_role("button", name="sync now")).to_be_visible()


def test_offline_pages_that_need_the_server_are_disabled(context: BrowserContext, page: Page):
    login(page)
    expect(page.locator(".itemCard").first).to_be_visible()

    context.set_offline(True)

    # The syncer polls, so wait for it to notice rather than guessing a delay.
    page.wait_for_function(
        "() => document.querySelector('.appSyncChip')?.textContent?.includes('offline')", timeout=45_000
    )
    expect(page.get_by_role("button", name="catalog cms")).to_be_disabled()
    expect(page.get_by_role("button", name="sales")).to_be_disabled()
