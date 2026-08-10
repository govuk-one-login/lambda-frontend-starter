import { beforeEach, describe, expect, it, vi } from "vitest";
import { setAnalyticsForPath } from "./index.js";
import type { FastifyRequest, FastifyReply } from "fastify";

// @ts-expect-error
vi.mock(import("../paths.js"), () => ({
  paths: {
    pageWithAnalytics: {
      path: "/page-with-analytics",
      analytics: { taxonomyLevel1: "accounts", contentId: "content-123" },
    },
    pageWithoutAnalytics: {
      path: "/page-without-analytics",
    },
  },
}));

describe("setAnalyticsForPath", () => {
  let reply: Partial<FastifyReply>;

  beforeEach(() => {
    reply = {};
  });

  it("should set analytics on reply when path has analytics defined", async () => {
    const request = { url: "/page-with-analytics" };

    await setAnalyticsForPath(request as FastifyRequest, reply as FastifyReply);

    expect(reply.analytics).toStrictEqual({
      taxonomyLevel1: "accounts",
      contentId: "content-123",
    });
  });

  it("should match path ignoring query parameters", async () => {
    const request = { url: "/page-with-analytics?foo=bar" };

    await setAnalyticsForPath(request as FastifyRequest, reply as FastifyReply);

    expect(reply.analytics).toStrictEqual({
      taxonomyLevel1: "accounts",
      contentId: "content-123",
    });
  });

  it("should not set analytics on reply when path has no analytics defined", async () => {
    const request = { url: "/page-without-analytics" };

    await setAnalyticsForPath(request as FastifyRequest, reply as FastifyReply);

    expect(reply.analytics).toBeUndefined();
  });

  it("should not set analytics on reply when path does not match any known path", async () => {
    const request = { url: "/unknown-path" };

    await setAnalyticsForPath(request as FastifyRequest, reply as FastifyReply);

    expect(reply.analytics).toBeUndefined();
  });
});
