"""End-to-end checkout flow: log in, pick items, record the sale, see the receipt."""

from __future__ import annotations

import re

import pytest
from playwright.sync_api import Page, expect

from conftest import BASE_URL, E2E_PASSWORD, E2E_USERNAME, login


def test_login_page_is_shown_to_anonymous_visitors(page: Page):
    page.goto(BASE_URL)

    expect(page.locator("#loginCard")).to_be_visible()
    expect(page.get_by_placeholder("username")).to_be_visible()
    expect(page.get_by_placeholder("password")).to_be_visible()
    expect(page.locator(".itemSelector")).to_have_count(0)


def test_wrong_password_shows_an_error_and_does_not_log_in(page: Page):
    login(page, password="definitely-wrong")

    expect(page.locator(".loginError")).to_contain_text("Incorrect username or password")
    expect(page.locator("#loginCard")).to_be_visible()


def test_catalog_loads_after_login(page: Page):
    login(page)

    expect(page.locator(".itemSelector")).to_be_visible()
    expect(page.locator("#loginCard")).to_have_count(0)
    expect(page.locator(".categoryTitle").first).to_contain_text("Coffee")
    expect(page.locator(".itemCard").first).to_be_visible()


def test_full_checkout_records_a_sale(page: Page, console_errors: list[str]):
    login(page)

    # Two Espressos at $3.00.
    espresso = page.locator(".itemCard", has=page.locator(".name", has_text="Espresso")).first
    espresso.click()
    espresso.click()

    cart = page.locator(".cashierStateTable")
    expect(cart).to_contain_text("Espresso")
    expect(cart).to_contain_text("$6.00")

    page.locator('.resultContainer button:has-text("RECORD")').click()

    modal = page.locator(".confirmRecordContainer")
    expect(modal).to_be_visible()
    expect(modal).to_contain_text("$6.00")

    modal.get_by_role("button", name="record!").click()

    expect(modal.locator(".confirmRecordSuccess")).to_contain_text("recorded as", timeout=10_000)
    order_ref = modal.locator(".confirmRecordSuccess").inner_text()
    assert re.search(r"recorded as [A-Z0-9]{6}", order_ref), order_ref

    assert console_errors == [], console_errors


def test_session_survives_a_page_reload(page: Page):
    login(page)
    expect(page.locator(".itemSelector")).to_be_visible()

    page.reload()

    expect(page.locator(".itemSelector")).to_be_visible()
    expect(page.locator("#loginCard")).to_have_count(0)


def test_expired_or_tampered_token_is_rejected(page: Page):
    page.goto(BASE_URL)
    page.evaluate("localStorage.setItem('cashier.token', 'not-a-real-jwt')")
    page.reload()

    expect(page.locator("#loginCard")).to_be_visible()
    assert page.evaluate("localStorage.getItem('cashier.token')") is None


@pytest.mark.parametrize("path", ["/Cashier-App/"])
def test_no_uncaught_errors_on_load(page: Page, console_errors: list[str], path: str):
    page.goto(BASE_URL + path.lstrip("/"))
    page.wait_for_load_state("networkidle")

    assert console_errors == [], console_errors


def test_credentials_are_actually_used(page: Page):
    """Guard against the login form silently sending empty credentials."""
    login(page, username=E2E_USERNAME, password=E2E_PASSWORD)

    expect(page.locator(".itemSelector")).to_be_visible()
    assert page.evaluate("localStorage.getItem('cashier.token')") is not None
