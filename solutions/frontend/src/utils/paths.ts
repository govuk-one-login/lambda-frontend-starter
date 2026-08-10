import type { FastifyReply } from "fastify";
import { analyticsDefaults } from "./constants.js";

export type PathsMap = Record<
  string,
  { path: `/${string}`; analytics?: FastifyReply["analytics"] }
>;

export const paths = {
  // CHANGEME remove this example path
  examplePage: {
    path: "/",
    analytics: {
      ...analyticsDefaults,
      contentId: "example-content-id",
    },
  },
} as const satisfies PathsMap;
