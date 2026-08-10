import { describe, it, expect, vi, beforeEach } from "vitest";
import { addStaticAssetsCachingHeaders } from "./index.js";
import type { FastifyReply } from "fastify";

vi.mock(import("../../getEnvironment/index.js"), () => ({
  getEnvironment: vi.fn(),
}));

describe("addStaticAssetsCachingHeaders", () => {
  const mockHeader = vi.fn();
  const mockReply = {
    header: mockHeader,
  } as unknown as FastifyReply;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when environment is not local", () => {
    beforeEach(async () => {
      const { getEnvironment } = await import("../../getEnvironment/index.js");
      vi.mocked(getEnvironment).mockReturnValue("production");
    });

    it("should set short cache headers with default allUrlsAreImmutable=false", () => {
      addStaticAssetsCachingHeaders(mockReply);

      expect(mockHeader).toHaveBeenCalledExactlyOnceWith(
        "cache-control",
        "public, max-age=300",
      );
    });

    it("should set immutable cache headers when allUrlsAreImmutable=true", () => {
      addStaticAssetsCachingHeaders(mockReply, true);

      expect(mockHeader).toHaveBeenCalledExactlyOnceWith(
        "cache-control",
        "public, max-age=86400, immutable",
      );
    });

    it("should set short cache headers when allUrlsAreImmutable=false", () => {
      addStaticAssetsCachingHeaders(mockReply, false);

      expect(mockHeader).toHaveBeenCalledExactlyOnceWith(
        "cache-control",
        "public, max-age=300",
      );
    });
  });

  describe("when environment is local", () => {
    beforeEach(async () => {
      const { getEnvironment } = await import("../../getEnvironment/index.js");
      vi.mocked(getEnvironment).mockReturnValue("local");
    });

    it("should not set headers with default allUrlsAreImmutable=false", () => {
      addStaticAssetsCachingHeaders(mockReply);

      expect(mockHeader).not.toHaveBeenCalled();
    });

    it("should not set headers when allUrlsAreImmutable=true", () => {
      addStaticAssetsCachingHeaders(mockReply, true);

      expect(mockHeader).not.toHaveBeenCalled();
    });

    it("should not set headers when allUrlsAreImmutable=false", () => {
      addStaticAssetsCachingHeaders(mockReply, false);

      expect(mockHeader).not.toHaveBeenCalled();
    });
  });
});
