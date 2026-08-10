import { expect, it, describe, vi, beforeEach, afterEach } from "vitest";
import { configureI18n } from "./index.js";
import i18next from "i18next";
import { LanguageDetector } from "i18next-http-middleware";
import { getEnvironment } from "../getEnvironment/index.js";
import { Lang } from "../constants.js";

const ORIGINAL_ENV = { ...process.env };

vi.mock(import("../getEnvironment/index.js"), () => ({
  getEnvironment: vi.fn(),
}));

// @ts-expect-error
vi.mock(import("i18next"), () => {
  const mockI18next = {
    use: vi.fn().mockReturnThis(),
    init: vi.fn(),
  };
  mockI18next.use.mockReturnValue(mockI18next);
  return { default: mockI18next };
});

vi.mock(import("i18next-http-middleware"), () => ({
  LanguageDetector: vi.fn(),
}));

describe("configureI18n", () => {
  const mockTranslations = {
    [Lang.English]: { hello: "Hello" },
    [Lang.Welsh]: { hello: "Helo" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(i18next.use).mockReturnValue(i18next);

    process.env = { ...ORIGINAL_ENV };
    process.env["ROOT_DOMAIN_WITH_ENV"] = "account.gov.uk";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes i18next with correct configuration for local environment", async () => {
    vi.mocked(getEnvironment).mockReturnValue("local");

    await configureI18n(mockTranslations);

    expect(i18next.use).toHaveBeenCalledExactlyOnceWith(LanguageDetector);
    expect(i18next.init).toHaveBeenCalledExactlyOnceWith({
      fallbackLng: [Lang.English],
      supportedLngs: [Lang.English, Lang.Welsh],
      resources: {
        [Lang.English]: {
          translation: {
            hello: "Hello",
          },
        },
        [Lang.Welsh]: {
          translation: {
            hello: "Helo",
          },
        },
      },
      detection: {
        lookupCookie: "lng",
        lookupQuerystring: "lng",
        order: ["querystring", "cookie"],
        ignoreCase: true,
        caches: ["cookie"],
        cookieSecure: false,
        cookieDomain: "account.gov.uk",
        cookieSameSite: "none",
      },
    });
  });

  it("initializes i18next with secure cookies for non-local environment", async () => {
    vi.mocked(getEnvironment).mockReturnValue("production");

    await configureI18n(mockTranslations);

    expect(i18next.init).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        detection: expect.objectContaining({
          cookieSecure: true,
          cookieDomain: "account.gov.uk",
        }),
      }),
    );
  });
});
