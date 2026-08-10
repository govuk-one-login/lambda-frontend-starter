import type { APIGatewayProxyEvent } from "aws-lambda";
import { parseCookie } from "cookie";
import { lngCookieName } from "../configureI18n/index.js";

export const getPropsFromAPIGatewayEvent = (event: APIGatewayProxyEvent) => {
  const cookies = parseCookie(event.headers["cookie"] ?? "");

  return {
    userLanguage: event.headers["user-language"] ?? cookies[lngCookieName],
    sourceIp:
      event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ??
      event.requestContext.identity.sourceIp,
    txmaAuditEncoded: event.headers["txma-audit-encoded"],
  };
};
