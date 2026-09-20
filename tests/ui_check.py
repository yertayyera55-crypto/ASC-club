from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SHOT_DIR = ROOT / "test-results"
SHOT_DIR.mkdir(exist_ok=True)


def verify_login(page, screenshot_name: str):
    page.goto("http://localhost:3000", wait_until="networkidle")
    headline = page.locator(".auth-copy h1")
    assert headline.is_visible()
    assert "Build." in headline.text_content()
    assert page.get_by_role("button", name="Continue with Google").is_visible()
    assert page.get_by_text("New members can complete an application", exact=False).is_visible()
    assert page.get_by_text("Good to see you", exact=False).count() == 0
    assert page.get_by_text("Arduino Workshop", exact=False).count() == 0
    assert page.locator(".demo-toolbar").count() == 0
    assert page.locator("[data-nextjs-dialog]").count() == 0
    page.screenshot(path=str(SHOT_DIR / screenshot_name), full_page=True)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    console_errors: list[str] = []

    desktop = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)
    desktop.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    verify_login(desktop, "auth-desktop.png")

    mobile = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    mobile.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    verify_login(mobile, "auth-mobile.png")
    auth_art = mobile.locator(".auth-art img")
    assert auth_art.get_attribute("draggable") == "false"
    assert auth_art.evaluate("el => getComputedStyle(el).pointerEvents") == "none"

    assert not console_errors, "Console errors: " + " | ".join(console_errors)
    print("PASS: protected portal shows responsive Google sign-in with no mock member data")
    browser.close()
