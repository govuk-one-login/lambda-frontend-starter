import type { FastifyInstance } from "fastify";

type NotFoundHandler = Parameters<FastifyInstance["setNotFoundHandler"]>[1];

export const onNotFound = async (
  _request: Parameters<NotFoundHandler>[0],
  reply: Parameters<NotFoundHandler>[1],
): Promise<ReturnType<NotFoundHandler>> => {
  reply.statusCode = 404;
  await reply.render("handlers/onNotFound/index.njk");
  return reply;
};
