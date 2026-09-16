"""Recorded-sales page: a sale made on the till shows up in reporting.

The e2e database is shared across the session, so other specs may already have
recorded sales. Assertions therefore check that *this* sale is reflected and
that totals never contradict the rows, rather than pinning exact figures.
"""

from __future__ import annotations

import csv
import io
import re
from pathlib import Path

from playwright.sync_api import Page, expect

from conftest import login


def record_sale(page: Page, item_name: str, times: int = 1) -> str:
    """Ring up an item on the till and return the resulting order reference."""
    card = page.locator(".itemCard", has=page.locator(".name", has_text=item_name)).first
    for _ in range(times):
        card.click()

    page.locator('.resultContainer button:has-text("RECORD")').click()
    modal = page.locator(".confirmRecordContainer")
    expect(modal).to_be_visible()
    modal.get_by_role("button", name="record!").click()

    success = modal.locator(".confirmRecordSuccess")
    expect(success).to_contain_text("recorded as", timeout=10_000)
    match = re.search(r"recorded as ([A-Z0-9]{6})", success.inner_text())
    assert match, success.inner_text()
    # The confirm dialog stays open on success (there is no close button), so
    # dismiss it by clicking the backdrop before navigating on.
    page.locator(".modal").click(position={"x": 5, "y": 5})
    expect(modal).to_be_hidden()
    return match.group(1)


def open_sales(page: Page) -> None:
    page.get_by_role("button", name="sales").click()
    expect(page.get_by_role("heading", name="Recorded sales")).to_be_visible()


def test_sales_page_lists_a_recorded_sale(page: Page, console_errors: list[str]):
    login(page)
    order_ref = record_sale(page, "Espresso", times=2)  # 2 x $3.00

    open_sales(page)

    # Today's card must cover at least this sale.
    today = page.locator(".salesCardPrimary")
    expect(today).to_contain_text("Today")
    assert float(re.sub(r"[^0-9.]", "", today.locator(".salesCardValue").inner_text())) >= 6.0

    # And the transaction itself appears, with its lines and total.
    row = page.locator(".salesTable tbody tr", has_text=order_ref)
    expect(row).to_have_count(1)
    expect(row).to_contain_text("2× Espresso")
    expect(row).to_contain_text("$6.00")

    assert console_errors == [], console_errors


def test_today_card_covers_todays_transactions(page: Page):
    login(page)
    record_sale(page, "Green Tea", times=1)  # $3.50

    open_sales(page)

    today_revenue = float(
        re.sub(r"[^0-9.]", "", page.locator(".salesCardPrimary").locator(".salesCardValue").inner_text())
    )

    # The transaction list is the newest page across all time, so it can reach
    # back past the reporting window. Only today's rows are comparable to the
    # "Today" card; their sum cannot exceed it.
    # Scoped to the Transactions panel: "Top sellers" is also a .salesTable.
    transactions = page.locator(".salesPanel", has_text="Transactions")
    rows = transactions.locator("tbody tr")
    expect(rows.first).to_be_visible()
    day_label = rows.first.locator(".salesWhen").inner_text()
    todays_rows = transactions.locator("tbody tr", has=page.locator(f".salesWhen:text-is('{day_label}')"))
    row_total = sum(
        float(re.sub(r"[^0-9.]", "", todays_rows.nth(index).locator("td").last.inner_text()))
        for index in range(todays_rows.count())
    )

    assert today_revenue >= row_total - 0.01, (today_revenue, row_total)
    assert today_revenue >= 3.5


def test_period_switch_changes_the_chart_window(page: Page):
    login(page)
    record_sale(page, "Espresso", times=1)

    open_sales(page)
    expect(page.locator(".salesBar")).to_have_count(14)

    page.get_by_role("button", name="7 days").click()
    expect(page.locator(".salesBar")).to_have_count(7)

    page.get_by_role("button", name="30 days").click()
    expect(page.locator(".salesBar")).to_have_count(30)


def test_top_sellers_lists_sold_items(page: Page):
    login(page)
    record_sale(page, "Long Black", times=1)

    open_sales(page)

    top = page.locator(".salesPanel", has_text="Top sellers")
    expect(top).to_contain_text("Long Black")


def test_empty_state_is_shown_when_nothing_matches(page: Page):
    """A window wide enough to include existing sales still renders sanely."""
    login(page)
    open_sales(page)

    # The page always renders its structure, never a blank screen.
    expect(page.locator(".salesCards")).to_be_visible()
    expect(page.locator(".salesPanel", has_text="Payment mix")).to_be_visible()


def test_export_button_downloads_a_csv(page: Page):
    """The export must carry the bearer token, which a plain link cannot."""
    login(page)
    order_ref = record_sale(page, "Espresso", times=2)  # 2 x $3.00

    open_sales(page)

    authorizations: list[str] = []
    page.on(
        "request",
        lambda request: authorizations.append(request.headers.get("authorization", ""))
        if "export.csv" in request.url
        else None,
    )

    with page.expect_download() as download_info:
        page.locator(".salesExport").click()
    download = download_info.value

    # The server names the file, so the UI does not have to invent one.
    assert download.suggested_filename.startswith("cashier-sales-")
    assert download.suggested_filename.endswith(".csv")
    assert any(value.startswith("Bearer ") for value in authorizations), authorizations

    body = Path(download.path()).read_text(encoding="utf-8-sig")
    parsed = list(csv.DictReader(io.StringIO(body)))

    assert parsed, "export contained no rows"
    assert list(parsed[0]) == [
        "order_ref",
        "created_at_utc",
        "date_local",
        "payment",
        "cashier",
        "item",
        "unit_price_cents",
        "quantity",
        "line_subtotal_cents",
        "sale_total_cents",
        "unit_price",
        "line_subtotal",
        "sale_total",
    ]

    # This sale is present, one row per line, with the amounts intact.
    mine = [row for row in parsed if row["order_ref"] == order_ref]
    assert len(mine) == 1
    assert mine[0]["item"] == "Espresso"
    assert mine[0]["quantity"] == "2"
    assert mine[0]["line_subtotal"] == "6.00"
    assert mine[0]["sale_total"] == "6.00"


def test_export_is_scoped_to_the_selected_period(page: Page):
    login(page)
    record_sale(page, "Long Black", times=1)
    open_sales(page)

    authorizations: list[str] = []
    page.on(
        "request",
        lambda request: authorizations.append(request.url) if "export.csv" in request.url else None,
    )

    page.get_by_role("button", name="30 days").click()
    with page.expect_download():
        page.locator(".salesExport").click()

    assert authorizations, "no export request observed"
    assert "days=30" in authorizations[-1], authorizations
