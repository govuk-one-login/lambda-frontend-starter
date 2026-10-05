import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { FastifyReply, FastifyRequest } from "fastify";
import { onError } from "./index.js";

// @ts-expect-error
vi.mock(import("../../utils/isFastifyError/index.js"), () => ({
  isFastifyError: vi.fn(),
}));

import { isFastifyError } from "../../utils/isFastifyError/index.js";

const mockIsFastifyError = vi.mocked(isFastifyError);

const makeRequest = () =>
  ({
    log: {
      error: vi.fn(),
      warn: vi.fn(),
    },
  }) as unknown as FastifyRequest;

const makeReply = () =>
  ({
    statusCode: 200,
    render: vi.fn().mockResolvedValue(undefined),
  }) as unknown as FastifyReply;

describe("onError handler", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("non-Fastify errors", () => {
    beforeEach(() => {
      mockIsFastifyError.mockReturnValue(false);
    });

    it("sets status code to 500", async () => {
      const request = makeRequest();
      const reply = makeReply();
      await onError(new Error("boom"), request, reply);

      expect(reply.statusCode).toBe(500);
    });

    it("logs with error level", async () => {
      const request = makeRequest();
      const reply = makeReply();
      const error = new Error("boom");
      await onError(error, request, reply);

      expect(request.log.error).toHaveBeenCalledExactlyOnceWith(
        error,
        "ERROR_CAUGHT_BY_GLOBAL_ERROR_HANDLER",
      );
      expect(request.log.warn).not.toHaveBeenCalled();
    });

    it("renders the error template", async () => {
      const request = makeRequest();
      const reply = makeReply();
      await onError(new Error("boom"), request, reply);

      expect(reply.render).toHaveBeenCalledExactlyOnceWith(
        "handlers/onError/index.njk",
      );
    });
  });

  describe("cSRF Fastify errors", () => {
    beforeEach(() => {
      mockIsFastifyError.mockReturnValue(true);
    });

    it("sets status code to 403", async () => {
      const request = makeRequest();
      const reply = makeReply();
      await onError({ code: "FST_CSRF_INVALID_TOKEN" }, request, reply);

      expect(reply.statusCode).toBe(403);
    });

    it("logs with warn level", async () => {
      const request = makeRequest();
      const reply = makeReply();
      const error = { code: "FST_CSRF_INVALID_TOKEN" } as never;
      await onError(error, request, reply);

      expect(request.log.warn).toHaveBeenCalledExactlyOnceWith(
        error,
        "ERROR_CAUGHT_BY_GLOBAL_ERROR_HANDLER",
      );
      expect(request.log.error).not.toHaveBeenCalled();
    });
  });

  describe("fST_ERR_CTP_EMPTY_JSON_BODY Fastify error", () => {
    beforeEach(() => {
      mockIsFastifyError.mockReturnValue(true);
    });

    it("sets status code to 400", async () => {
      const request = makeRequest();
      const reply = makeReply();
      await onError({ code: "FST_ERR_CTP_EMPTY_JSON_BODY" }, request, reply);

      expect(reply.statusCode).toBe(400);
    });

    it("logs with warn level", async () => {
      const request = makeRequest();
      const reply = makeReply();
      const error = { code: "FST_ERR_CTP_EMPTY_JSON_BODY" } as never;
      await onError(error, request, reply);

      expect(request.log.warn).toHaveBeenCalledExactlyOnceWith(
        error,
        "ERROR_CAUGHT_BY_GLOBAL_ERROR_HANDLER",
      );
      expect(request.log.error).not.toHaveBeenCalled();
    });
  });
});
