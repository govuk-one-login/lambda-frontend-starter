import type { Mock } from "vitest";
import { expect, it, describe, vi, afterEach, beforeEach } from "vitest";
import { onError } from "./index.js";
import type { FastifyRequest, FastifyReply } from "fastify";

describe("onError handler", () => {
  let mockLog: {
    error: Mock;
    warn: Mock;
  };
  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;

  beforeEach(() => {
    mockLog = {
      error: vi.fn(),
      warn: vi.fn(),
    };
    mockRequest = {
      log: mockLog,
    } as unknown as FastifyRequest;

    mockReply = {
      statusCode: 200,
      render: vi.fn(),
    } as unknown as FastifyReply;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("logs the error with correct message", async () => {
    const testError = new Error("Test error");

    await onError(testError, mockRequest, mockReply);

    expect(mockLog.error).toHaveBeenCalledExactlyOnceWith(
      testError,
      "ERROR_CAUGHT_BY_GLOBAL_ERROR_HANDLER",
    );
  });

  it("sets status code to 500", async () => {
    const testError = new Error("Test error");

    await onError(testError, mockRequest, mockReply);

    expect(mockReply.statusCode).toBe(500);
  });

  it("renders the default error template", async () => {
    const testError = new Error("Test error");

    await onError(testError, mockRequest, mockReply);

    expect(mockReply.render).toHaveBeenCalledExactlyOnceWith(
      "handlers/onError/index.njk",
    );
  });

  describe("when a CSRF error occurs", () => {
    const csrfError = Object.assign(new Error("CSRF error"), {
      code: "FST_CSRF_INVALID_TOKEN",
    });

    it("logs the error as a warning", async () => {
      await onError(csrfError, mockRequest, mockReply);

      expect(mockLog.warn).toHaveBeenCalledExactlyOnceWith(
        csrfError,
        "ERROR_CAUGHT_BY_GLOBAL_ERROR_HANDLER",
      );
      expect(mockLog.error).not.toHaveBeenCalled();
    });

    it("sets status code to 403", async () => {
      await onError(csrfError, mockRequest, mockReply);

      expect(mockReply.statusCode).toBe(403);
    });

    it("renders the error template", async () => {
      await onError(csrfError, mockRequest, mockReply);

      expect(mockReply.render).toHaveBeenCalledExactlyOnceWith(
        "handlers/onError/index.njk",
      );
    });
  });
});
