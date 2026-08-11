import type { FastifyInstance } from "fastify";
import { paths } from "./utils/paths.js";

export const routes = function (fastify: FastifyInstance) {
  fastify.get("/healthcheck", async function (_request, reply) {
    await reply.send("ok");
    return reply;
  });

  fastify.get("/robots.txt", async function (request, reply) {
    return (await import("./handlers/robots.txt/index.js")).handler(
      request,
      reply,
    );
  });

  // CHANGEME remove this example route and associated files in solutions/frontend/src/handlers/examplePage/
  fastify.get(paths.examplePage.path, async function (request, reply) {
    return (await import("./handlers/examplePage/index.js")).getHandler(
      request,
      reply,
    );
  });

  // CHANGEME remove this example route and associated files in solutions/frontend/src/handlers/examplePage/
  fastify.post(paths.examplePage.path, async function (request, reply) {
    return (await import("./handlers/examplePage/index.js")).postHandler(
      request,
      reply,
    );
  });
};
