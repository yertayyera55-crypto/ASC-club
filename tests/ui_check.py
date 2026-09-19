from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SHOT_DIR = ROOT / "test-results"
SHOT_DIR.mkdir(exist_ok=True)


def assert_text(page, text: str):
    locator = page.get_by_text(text, exact=False).first
    locator.wait_for(state="visible", timeout=10_000)
    assert locator.is_visible(), f"Missing visible text: {text}"


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    console_errors: list[str] = []

    desktop = browser.new_page(viewport={"width": 1440, "height": 1050}, device_scale_factor=1)
    desktop.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    desktop.goto("http://localhost:3000", wait_until="networkidle")
    assert_text(desktop, "Good to see you")
    assert_text(desktop, "Arduino Workshop")
    assert desktop.locator(".hero-art-desktop").is_visible()
    assert not desktop.locator(".hero-art-mobile").is_visible()
    assert desktop.locator("[data-nextjs-dialog]").count() == 0
    desktop.screenshot(path=str(SHOT_DIR / "home-desktop.png"), full_page=True)

    desktop.locator(".desktop-nav button", has_text="Events").click()
    assert_text(desktop, "Computer Vision Lab")
    join = desktop.locator(".event-row").filter(has_text="Computer Vision Lab").get_by_role("button", name="Join")
    join.click()
    assert desktop.locator(".event-row").filter(has_text="Computer Vision Lab").get_by_role("button", name="Going").is_visible()

    desktop.locator(".desktop-nav button", has_text="Members").click()
    desktop.get_by_label("Search members").fill("Computer Vision")
    assert_text(desktop, "Dias Kim")
    assert_text(desktop, "Ethan Wong")
    desktop.screenshot(path=str(SHOT_DIR / "members-desktop.png"), full_page=True)

    desktop.locator(".desktop-nav button", has_text="Profile").click()
    edit_button = desktop.get_by_role("button", name="Edit profile")
    edit_button.hover()
    assert edit_button.is_visible()
    assert edit_button.evaluate("el => getComputedStyle(el).color !== getComputedStyle(el).backgroundColor")
    edit_button.click()
    bio = desktop.get_by_label("Short bio")
    original_bio = bio.input_value()
    bio.fill(original_bio + " ")
    desktop.get_by_role("button", name="Save changes").click()
    assert_text(desktop, "Profile updated")

    desktop.locator(".desktop-nav button", has_text="Admin").click()
    assert_text(desktop, "Member database")
    assert desktop.locator("table tbody tr").count() > 0

    desktop.locator(".role-switch button", has_text="member").click()
    assert_text(desktop, "Good to see you")
    assert desktop.locator(".desktop-nav button", has_text="Admin").count() == 0
    desktop.locator(".desktop-nav button", has_text="Members").click()
    desktop.locator(".member-row").first.click()
    assert desktop.locator(".private-block").count() == 0
    desktop.get_by_role("button", name="Close").click()

    mobile = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    mobile.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    mobile.goto("http://localhost:3000", wait_until="networkidle")
    assert_text(mobile, "Good to see you")
    assert mobile.locator(".mobile-nav").is_visible()
    hero_image = mobile.locator(".hero-art-mobile")
    assert hero_image.is_visible()
    assert not mobile.locator(".hero-art-desktop").is_visible()
    assert hero_image.get_attribute("draggable") == "false"
    assert hero_image.evaluate("el => !CSS.supports('-webkit-touch-callout', 'none') || getComputedStyle(el).webkitTouchCallout === 'none'")
    assert hero_image.evaluate("el => getComputedStyle(el).pointerEvents") == "none"
    mobile.screenshot(path=str(SHOT_DIR / "home-mobile.png"), full_page=True)
    mobile.locator(".mobile-nav button", has_text="Members").click()
    assert_text(mobile, "Club Directory")
    mobile.locator(".member-row").first.click()
    assert mobile.locator(".member-drawer").is_visible()
    mobile.screenshot(path=str(SHOT_DIR / "member-mobile.png"), full_page=True)

    assert not console_errors, "Console errors: " + " | ".join(console_errors)
    print("PASS: desktop/mobile render, navigation, RSVP, member search, role preview, privacy, profile save, admin table")
    browser.close()
