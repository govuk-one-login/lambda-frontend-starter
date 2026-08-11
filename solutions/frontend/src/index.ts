import { removeTrailingSlash } from "./utils/fastify/removeTrailingSlash/index.js";
import { addDefaultCaching } from "./utils/fastify/addDefaultCaching/index.js";
import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import { render } from "./utils/fastify/render/index.js";
import fastifyFormBody from "@fastify/formbody";
import fastifyHelmet from "@fastify/helmet";
import fastifySession from "@fastify/session";
import en from "./translations/en.json" with { type: "json" };
import cy from "./translations/cy.json" with { type: "json" };
import { getSessionOptions } from "./utils/session/index.js";
import fastifyStatic from "@fastify/static";
import * as path from "node:path";
import { Lang } from "./utils/constants.js";
import staticHash from "./utils/static-hash.json" with { type: "json" };
import staticHashGovUkFrontend from "./utils/static-hash-govuk-frontend.json" with { type: "json" };
import staticHashGovUkFrontendAssets from "./utils/static-hash-govuk-frontend-assets.json" with { type: "json" };
import staticHashGovUkOneLoginFrontendDeviceIntelligence from "./utils/static-hash-govuk-one-login-frontend-device-intelligence.json" with { type: "json" };
import staticHashGovUkOneLoginFrontendAnalytics from "./utils/static-hash-govuk-one-login-frontend-analytics.json" with { type: "json" };
import { csrfProtection } from "./utils/csrfProtection/index.js";
import { addStaticAssetsCachingHeaders } from "./utils/fastify/addStaticAssetsCachingHeaders/index.js";
import i18next from "i18next";
import {
  plugin as i18nextMiddlewarePlugin,
  handle as i18nextMiddlewareHandle,
} from "i18next-http-middleware";
import { getCurrentUrl } from "./utils/fastify/getCurrentUrl/index.js";
import { configureI18n } from "./utils/configureI18n/index.js";
import {
  frontendUiTranslationCy,
  frontendUiTranslationEn,
} from "@govuk-one-login/frontend-ui";
import { getEnvironment } from "./utils/getEnvironment/index.js";
import { FastifyPowertoolsLogger } from "./utils/fastify/powertoolsLogger/index.js";
import { resolveEnvVarToBool } from "./utils/resolveEnvVarToBool/index.js";
import { setAnalyticsForPath } from "./utils/setAnalyticsForPath/index.js";
import { FastifyLogController } from "./utils/fastify/logController/index.js";
import assert from "node:assert";
import { getHelmetConfig } from "./utils/fastify/getHelmetConfig/index.js";
import { routes } from "./routes.js";

await configureI18n({
  [Lang.English]: {
    ...en,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    FECTranslations: frontendUiTranslationEn,
  },
  [Lang.Welsh]: {
    ...cy,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    FECTranslations: frontendUiTranslationCy,
  },
});

export const initFrontend = async function () {
  const fastify = Fastify.default({
    trustProxy: true, // Required as HTTPS is terminated before the Lambda
    loggerInstance: new FastifyPowertoolsLogger(),
    logController: new FastifyLogController(),
  });

  fastify.addHook("onRequest", removeTrailingSlash);
  fastify.addHook("onSend", (_request, reply) => addDefaultCaching(reply));

  fastify.register(fastifyCookie);
  fastify.register(i18nextMiddlewarePlugin, { i18next });
  // @ts-expect-error
  fastify.addHook("onRequest", i18nextMiddlewareHandle(i18next));

  fastify.addHook("onRequest", async (request, reply) => {
    assert.ok(process.env["AUTH_FRONTEND_URL"]);
    assert.ok(process.env["ANALYTICS_COOKIE_DOMAIN"]);
    assert.ok(process.env["GA4_CONTAINER_ID"]);

    reply.globals = {
      ...reply.globals,
      staticHash: staticHash.hash,
      assetsHash: staticHashGovUkFrontendAssets.hash,
      publicScriptsHash:
        staticHashGovUkFrontend.hash +
        staticHashGovUkOneLoginFrontendAnalytics.hash,
      fingerprintHash: staticHashGovUkOneLoginFrontendDeviceIntelligence.hash,
      currentUrl: getCurrentUrl(request),
      lng: request.i18n.language,
      authFrontEndUrl: process.env["AUTH_FRONTEND_URL"],
      analyticsCookieDomain: process.env["ANALYTICS_COOKIE_DOMAIN"],
      ga4ContainerId: process.env["GA4_CONTAINER_ID"],
      analyticsEnabled: resolveEnvVarToBool("ANALYTICS_ENABLED"),
      env: getEnvironment(),
    };
  });
  fastify.addHook("onRequest", setAnalyticsForPath);
  fastify.decorateReply("render", render);

  fastify.setNotFoundHandler(async function (request, reply) {
    const onNotFound = (await import("./handlers/onNotFound/index.js"))
      .onNotFound;
    return onNotFound.bind(this)(request, reply);
  });

  fastify.setErrorHandler(async function (error, request, reply) {
    const onError = (await import("./handlers/onError/index.js")).onError;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return onError.bind(this)(error, request, reply);
  });

  fastify.register(fastifyStatic, {
    root: path.join(
      import.meta.dirname,
      "/node_modules/@govuk-one-login/frontend-device-intelligence/build/esm",
    ),
    prefix: "/fingerprint",
    decorateReply: false,
    cacheControl: false,
    setHeaders: (res) => {
      addStaticAssetsCachingHeaders(res, true);
    },
  });

  fastify.register(fastifyStatic, {
    root: path.join(import.meta.dirname, "static"),
    prefix: "/static",
    decorateReply: false,
    cacheControl: false,
    setHeaders: (res) => {
      addStaticAssetsCachingHeaders(res, true);
    },
  });

  fastify.register(fastifyStatic, {
    root: path.join(
      import.meta.dirname,
      "/node_modules/govuk-frontend/dist/govuk/assets",
    ),
    prefix: "/assets",
    decorateReply: false,
    cacheControl: false,
    setHeaders: (res) => {
      addStaticAssetsCachingHeaders(res);
    },
  });

  fastify.register(fastifyStatic, {
    root: [
      path.join(
        import.meta.dirname,
        "/node_modules/@govuk-one-login/frontend-analytics/lib",
      ),
      path.join(import.meta.dirname, "/node_modules/govuk-frontend/dist/govuk"),
    ],
    prefix: "/public/scripts",
    decorateReply: false,
    cacheControl: false,
    setHeaders: (res) => {
      addStaticAssetsCachingHeaders(res);
    },
  });

  fastify.register(fastifyFormBody);
  fastify.register(fastifyHelmet, getHelmetConfig());
  fastify.register(fastifySession, await getSessionOptions());
  fastify.register(csrfProtection);
  fastify.register(routes);

  return fastify;
};
