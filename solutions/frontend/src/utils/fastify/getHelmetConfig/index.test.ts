import { afterEach, describe, expect, it } from "vitest";
import { getHelmetConfig } from "./index.js";

describe("getHelmetConfig", () => {
  afterEach(() => {
    delete process.env["ENVIRONMENT"];
  });

  it("enables CSP nonces", () => {
    expect(getHelmetConfig().enableCSPNonces).toBe(true);
  });

  it("sets the expected CSP directives", () => {
    const directives = getHelmetConfig().contentSecurityPolicy as {
      directives: Record<string, unknown>;
    };

    expect(directives.directives["defaultSrc"]).toStrictEqual(["'self'"]);
    expect(directives.directives["scriptSrc"]).toStrictEqual([
      "'self'",
      "https://*.googletagmanager.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
    ]);
    expect(directives.directives["imgSrc"]).toStrictEqual([
      "'self'",
      "data:",
      "https://*.googletagmanager.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
      "https://*.g.doubleclick.net",
    ]);
    expect(directives.directives["objectSrc"]).toStrictEqual(["'none'"]);
    expect(directives.directives["connectSrc"]).toStrictEqual([
      "'self'",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
      "https://*.g.doubleclick.net",
    ]);
    expect(directives.directives["formAction"]).toStrictEqual(["'self'"]);
  });

  it("sets upgradeInsecureRequests to null in local environment", () => {
    delete process.env["ENVIRONMENT"];
    const directives = getHelmetConfig().contentSecurityPolicy as {
      directives: Record<string, unknown>;
    };

    expect(directives.directives["upgradeInsecureRequests"]).toBeNull();
  });

  it("does not set upgradeInsecureRequests in non-local environment", () => {
    process.env["ENVIRONMENT"] = "production";
    const directives = getHelmetConfig().contentSecurityPolicy as {
      directives: Record<string, unknown>;
    };

    expect(directives.directives).not.toHaveProperty("upgradeInsecureRequests");
  });

  it("disables DNS prefetch", () => {
    expect(getHelmetConfig().dnsPrefetchControl).toStrictEqual({
      allow: false,
    });
  });

  it("sets frameguard to deny", () => {
    expect(getHelmetConfig().frameguard).toStrictEqual({ action: "deny" });
  });

  it("sets HSTS with correct values", () => {
    expect(getHelmetConfig().hsts).toStrictEqual({
      maxAge: 31536000,
      preload: true,
      includeSubDomains: true,
    });
  });

  it("disables referrer policy", () => {
    expect(getHelmetConfig().referrerPolicy).toBe(false);
  });

  it("sets permitted cross domain policies to none", () => {
    expect(getHelmetConfig().permittedCrossDomainPolicies).toStrictEqual({
      permittedPolicies: "none",
    });
  });
});
