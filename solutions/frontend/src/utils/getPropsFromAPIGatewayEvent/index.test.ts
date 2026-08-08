import { describe, it, expect } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";
import { getPropsFromAPIGatewayEvent } from "./index.js";

describe("getPropsFromAPIGatewayEvent", () => {
  const createMockEvent = (
    headers: Record<string, string> = {},
    sourceIp = "127.0.0.1",
  ): APIGatewayProxyEvent =>
    ({
      headers,
      requestContext: {
        identity: {
          sourceIp,
        },
      },
    }) as APIGatewayProxyEvent;

  it("extracts values from headers when available", () => {
    const event = createMockEvent({
      "user-language": "en",
      "x-forwarded-for": "192.168.1.1",
      "txma-audit-encoded": "encoded-txma-data",
    });

    expect(getPropsFromAPIGatewayEvent(event)).toStrictEqual({
      userLanguage: "en",
      sourceIp: "192.168.1.1",
      txmaAuditEncoded: "encoded-txma-data",
    });
  });

  it("falls back to lng cookie for userLanguage when header not available", () => {
    const event = createMockEvent({ cookie: "lng=fr" });

    expect(getPropsFromAPIGatewayEvent(event)).toStrictEqual({
      userLanguage: "fr",
      sourceIp: "127.0.0.1",
      txmaAuditEncoded: undefined,
    });
  });

  it("prioritizes user-language header over lng cookie", () => {
    const event = createMockEvent({
      "user-language": "en",
      cookie: "lng=fr",
    });

    expect(getPropsFromAPIGatewayEvent(event)).toStrictEqual({
      userLanguage: "en",
      sourceIp: "127.0.0.1",
      txmaAuditEncoded: undefined,
    });
  });

  it("extracts the first IP from x-forwarded-for when multiple IPs are present", () => {
    const event = createMockEvent({
      "x-forwarded-for": "192.168.1.1, 10.0.0.1, 172.16.0.1",
    });

    expect(getPropsFromAPIGatewayEvent(event)).toStrictEqual({
      userLanguage: undefined,
      sourceIp: "192.168.1.1",
      txmaAuditEncoded: undefined,
    });
  });

  it("falls back to requestContext sourceIp when x-forwarded-for not available", () => {
    const event = createMockEvent({}, "10.0.0.1");

    expect(getPropsFromAPIGatewayEvent(event)).toStrictEqual({
      userLanguage: undefined,
      sourceIp: "10.0.0.1",
      txmaAuditEncoded: undefined,
    });
  });

  it("handles missing cookie header gracefully", () => {
    const event = createMockEvent({});

    expect(getPropsFromAPIGatewayEvent(event)).toStrictEqual({
      userLanguage: undefined,
      sourceIp: "127.0.0.1",
      txmaAuditEncoded: undefined,
    });
  });
});
