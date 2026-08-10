import type { FastifyRequest, FastifyReply } from "fastify";
import type { PathsMap } from "../paths.js";
import { paths } from "../paths.js";

const findAnalytics = (pathsMap: PathsMap, pathname: string) =>
  Object.values(pathsMap).find(
    (path) => path.path === pathname && path.analytics,
  )?.analytics;

export const setAnalyticsForPath = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const url = new URL(request.url, "http://localhost");

  const analytics = findAnalytics(paths, url.pathname);
  if (analytics) {
    reply.analytics = analytics;
  }
};
