import type { FastifyHelmetOptions } from "@fastify/helmet";
import { getEnvironment } from "../../getEnvironment/index.js";

export const getHelmetConfig = (): FastifyHelmetOptions => {
  return {
    enableCSPNonces: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://*.googletagmanager.com",
          "https://*.google-analytics.com",
          "https://*.analytics.google.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://*.googletagmanager.com",
          "https://*.google-analytics.com",
          "https://*.analytics.google.com",
          "https://*.g.doubleclick.net",
        ],
        objectSrc: ["'none'"],
        connectSrc: [
          "'self'",
          "https://*.google-analytics.com",
          "https://*.analytics.google.com",
          "https://*.g.doubleclick.net",
        ],
        /*
          CHANGEME - if your application has forms which submit to
          external URLs (e.g. RP callback URLs) either directly
          or via a redirect chain then change this to:
          formAction: null
        */
        formAction: ["'self'"],
        ...(getEnvironment() === "local"
          ? {
              upgradeInsecureRequests: null,
            }
          : {}),
      },
    },
    dnsPrefetchControl: {
      allow: false,
    },
    frameguard: {
      action: "deny",
    },
    hsts: {
      maxAge: 31536000,
      preload: true,
      includeSubDomains: true,
    },
    referrerPolicy: false,
    permittedCrossDomainPolicies: {
      permittedPolicies: "none",
    },
  };
};
