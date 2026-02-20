
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local server
        print("Navigating to http://localhost:8000...")
        page.goto("http://localhost:8000")

        # Wait for page load
        time.sleep(2)

        # Close welcome modal if it appears
        try:
            if page.is_visible("#welcomeModal"):
                print("Closing welcome modal...")
                page.click("#welcomeGuestBtn")
                time.sleep(1)
        except Exception as e:
            print(f"Note: Welcome modal handling: {e}")

        # Close getting started modal if it appears
        try:
            if page.is_visible("#gettingStartedModal"):
                print("Closing getting started modal...")
                page.click("#closeHelpBtn")
                time.sleep(1)
        except Exception as e:
            print(f"Note: Getting started modal handling: {e}")

        # Open Theme Picker (Ctrl+T)
        print("Opening Theme Picker...")
        page.keyboard.press("Control+t")
        time.sleep(1)

        # Scroll down to find the diagnostic widget
        # page.mouse.wheel(0, 500)
        # Or locate the button

        diagnostic_btn = page.locator("#runApiTestBtn")
        if diagnostic_btn.is_visible():
            print("Diagnostic widget found!")

            # Take screenshot of the widget in initial state
            page.screenshot(path="verification/diagnostic_widget_initial.png")
            print("Saved verification/diagnostic_widget_initial.png")

            # Click the test button
            print("Running diagnostic test...")
            diagnostic_btn.click()

            # Wait for test to complete (it might fail due to no backend, but UI should update)
            # Since we are running against python http.server, the /api calls will 404
            # But we want to verify the UI updates correctly showing the failure.
            time.sleep(2)

            # Take screenshot of the widget in result state
            page.screenshot(path="verification/diagnostic_widget_result.png")
            print("Saved verification/diagnostic_widget_result.png")

            # Expand details
            print("Expanding details...")
            page.click("#toggleRequest")
            page.click("#toggleResponse")
            time.sleep(1)

            page.screenshot(path="verification/diagnostic_widget_details.png")
            print("Saved verification/diagnostic_widget_details.png")

        else:
            print("Diagnostic widget NOT found!")
            page.screenshot(path="verification/diagnostic_widget_missing.png")

        browser.close()

if __name__ == "__main__":
    run()
