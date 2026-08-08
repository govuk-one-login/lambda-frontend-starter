import type { FastifyReply } from "fastify";
import { getEnvironment } from "../../getEnvironment/index.js";

export const addStaticAssetsCachingHeaders = (
  reply: FastifyReply,
  allUrlsAreImmutable = false,
) => {
  if (getEnvironment() !== "local") {
    reply.header(
      "cache-control",
      allUrlsAreImmutable
        ? "public, max-age=86400, immutable"
        : "public, max-age=300",
    );
  }
};
