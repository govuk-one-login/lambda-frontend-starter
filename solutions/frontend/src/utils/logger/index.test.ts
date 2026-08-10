import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";

// @ts-expect-error
vi.mock(import("@aws-lambda-powertools/logger"), () => ({
  Logger: function MockLogger() {
    return {
      addContext: vi.fn(),
      appendKeys: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      resetKeys: vi.fn(),
    };
  },
}));

vi.mock(import("../getPropsFromAPIGatewayEvent/index.js"), () => ({
  getPropsFromAPIGatewayEvent: vi.fn().mockReturnValue({
    userLanguage: "fr",
    sourceIp: "192.168.1.1",
  }),
}));

import { loggerAPIGatewayProxyHandlerWrapper, logger } from "./index.js";

describe("loggerAPIGatewayProxyHandlerWrapper", () => {
  const mockHandler = vi.fn();
  const mockEvent = {
    headers: {
      referer: "https://example.com",
    },
    httpMethod: "GET",
    path: "/test-path",
    requestContext: {
      identity: {
        sourceIp: "10.0.0.1",
      },
    },
  } as unknown as APIGatewayProxyEvent;
  const mockContext = {} as Context;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHandler.mockResolvedValue({ statusCode: 200, body: "success" });
  });

  it("enriches logs with request context and calls handler", async () => {
    const wrappedHandler = loggerAPIGatewayProxyHandlerWrapper(mockHandler);

    const result = await wrappedHandler(mockEvent, mockContext);

    expect(logger.addContext).toHaveBeenCalledWith(mockContext);
    expect(logger.appendKeys).toHaveBeenCalledWith({
      userLanguage: "fr",
      sourceIp: "192.168.1.1",
      method: "GET",
      path: "/test-path",
      referer: "https://example.com",
    });
    expect(logger.info).toHaveBeenCalledWith("Request");
    expect(mockHandler).toHaveBeenCalledWith(mockEvent, mockContext);
    expect(logger.info).toHaveBeenCalledWith("Response", { statusCode: 200 });
    expect(logger.resetKeys).toHaveBeenCalledWith();
    expect(result).toStrictEqual({ statusCode: 200, body: "success" });
  });

  it("logs error and returns 500 when handler throws", async () => {
    const error = new Error("handler error");
    mockHandler.mockRejectedValue(error);
    const wrappedHandler = loggerAPIGatewayProxyHandlerWrapper(mockHandler);

    const result = await wrappedHandler(mockEvent, mockContext);

    expect(logger.error).toHaveBeenCalledWith("An error occurred", { error });
    expect(logger.resetKeys).toHaveBeenCalledWith();
    expect(result).toStrictEqual({ statusCode: 500, body: "" });
  });
});
