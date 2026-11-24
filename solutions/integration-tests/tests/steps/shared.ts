import { AxeBuilder } from "@axe-core/playwright";
import { bdd } from "./fixtures.js";
import { expect } from "@playwright/test";
import assert from "node:assert";

const { Then, Given } = bdd;

export const pageNameToPath: Record<string, string> = {
  "Non-existent page": "/non-existent-page",
  Healthcheck: "/healthcheck",
};

Then("the page meets our accessibility standards", async ({ page }) => {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(["wcag22aa"])
    .analyze();
  // eslint-disable-next-line playwright/no-networkidle
  await page.waitForLoadState("networkidle");
  expect(accessibilityScanResults.violations).toEqual([]);
});

Given("I go to the {string} page", async ({ page }, pageName: string) => {
  assert.ok(pageNameToPath[pageName]);
  await page.goto(pageNameToPath[pageName]);
});

Then("the page looks as expected", async ({ page }) => {
  // eslint-disable-next-line playwright/no-networkidle
  await page.waitForLoadState("networkidle");
  expect(
    await page.screenshot({
      fullPage: true,
      quality: 50,
      type: "jpeg",
      mask: [page.locator("[data-test-mask]")],
    }),
  ).toMatchSnapshot({
    maxDiffPixelRatio: 0.01,
  });
});

Then("the {string} cookie has been set", async ({ page }, cookieName) => {
  // eslint-disable-next-line playwright/no-networkidle
  await page.waitForLoadState("networkidle");
  const cookies = await page.context().cookies();
  const expectedCookie = cookies.find((cookie) => cookie.name === cookieName);
  expect(expectedCookie).toBeDefined();
});

Then(
  "the {string} cookie is set to {string}",
  async ({ page }, cookieName: string, cookieValue: string) => {
    // eslint-disable-next-line playwright/no-networkidle
    await page.waitForLoadState("networkidle");
    const cookies = await page.context().cookies();
    const cookie = cookies.find((c) => c.name === cookieName);
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe(cookieValue);
  },
);

Then(
  "there is a {string} query string parameter set to {string}",
  async ({ page }, paramName: string, expectedValue: string) => {
    // eslint-disable-next-line playwright/no-networkidle
    await page.waitForLoadState("networkidle");
    const currentUrl = new URL(page.url());
    const paramValue = currentUrl.searchParams.get(paramName);
    expect(paramValue).toBe(expectedValue);
  },
);
