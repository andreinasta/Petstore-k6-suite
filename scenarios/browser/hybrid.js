import { browser } from "k6/browser";
import { check, sleep } from "k6";
import { crudPets } from "../../tests/pets.test.js";
import { registerUser } from "../../helpers/auth.js";
import { petThresholds } from "../../config/thresholds.js";
import { generateReport } from "../../helpers/report.js";
import { del } from "../../utils/request.js";

export const options = {
  scenarios: {
    // API scenario — hammers the backend
    api_load: {
      executor: "ramping-vus",
      stages: [
        { duration: "10s", target: 10 },
        { duration: "40s", target: 10 },
        { duration: "10s", target: 0 },
      ],
      exec: "apiTest",
    },
    // Browser scenario — measures frontend under that pressure
    browser_monitor: {
      executor: "constant-vus",
      vus: 2,
      duration: "1m",
      exec: "browserTest",
      options: {
        browser: {
          type: "chromium",
        },
      },
    },
  },
  thresholds: {
    ...petThresholds,
    browser_web_vital_lcp: ["p(75) < 2500"],
    browser_web_vital_fcp: ["p(75) < 1800"],
    browser_web_vital_cls: ["p(75) < 0.1"],
    browser_web_vital_ttfb: ["p(75) < 800"],
  },
};

export function setup() {
  const { token, userId } = registerUser();
  if (!token) throw new Error("Setup failed: user registration did not return a token");
  return { token, userId };
}

// API test — reuses existing CRUD pets flow
export function apiTest(data) {
  crudPets(data.token);
}

export function teardown(data) {
  del(`/v1/users/${data.userId}`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
}

// Browser test — login + checkout flow
export async function browserTest() {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    // Login
    await page.goto("https://www.saucedemo.com/");
    await page.locator('[data-test="username"]').fill("standard_user");
    await page.locator('[data-test="password"]').fill("secret_sauce");
    await Promise.all([
      page.waitForNavigation(),
      page.locator('[data-test="login-button"]').click(),
    ]);
    const title = await page.locator('[data-test="title"]').textContent();
    check(page, {
      "Products title is shown after login": () => title === "Products",
    });

    // Add to Cart
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('[data-test="shopping-cart-link"]').click();

    // Checkout
    await page.locator('[data-test="checkout"]').click();
    await page.locator('[data-test="firstName"]').fill("FirstNameTest");
    await page.locator('[data-test="lastName"]').fill("LastNameTest");
    await page.locator('[data-test="postalCode"]').fill("000121");
    await page.locator('[data-test="continue"]').click();
    await page.locator('[data-test="finish"]').click();
    const checkoutMsg = await page
      .locator('[data-test="complete-header"]')
      .textContent();
    check(page, {
      "Checkout confirmation message is displayed": () =>
        checkoutMsg === "Thank you for your order!",
    });
    await page.locator('[data-test="back-to-products"]').click();
  } finally {
    await context.close();
  }
  sleep(1);
}

export function handleSummary(data) {
  return generateReport(data, "browser-hybrid");
}
