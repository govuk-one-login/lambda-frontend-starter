import type { FastifyInstance } from "fastify";

type ErrorHandler = Parameters<FastifyInstance["setErrorHandler"]>[0];

export const onError = async (
  error: Parameters<ErrorHandler>[0],
  request: Parameters<ErrorHandler>[1],
  reply: Parameters<ErrorHandler>[2],
): Promise<ReturnType<ErrorHandler>> => {
  const msg = "ERROR_CAUGHT_BY_GLOBAL_ERROR_HANDLER";
  request.log.error(error, msg);
  reply.statusCode = 500;
  await reply.render("handlers/onError/index.njk");
  return reply;
};
