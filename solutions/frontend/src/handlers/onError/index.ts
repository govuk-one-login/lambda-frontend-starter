import type { FastifyInstance } from "fastify";
import { isFastifyError } from "../../utils/isFastifyError/index.js";

type ErrorHandler = Parameters<FastifyInstance["setErrorHandler"]>[0];

export const onError = async (
  error: Parameters<ErrorHandler>[0],
  request: Parameters<ErrorHandler>[1],
  reply: Parameters<ErrorHandler>[2],
): Promise<ReturnType<ErrorHandler>> => {
  const msg = "ERROR_CAUGHT_BY_GLOBAL_ERROR_HANDLER";

  let logger = request.log.error;
  let statusCode = 500;

  if (isFastifyError(error) && error.code.startsWith("FST_CSRF_")) {
    logger = request.log.warn;
    statusCode = 403;
  }

  logger(error, msg);
  reply.statusCode = statusCode;
  await reply.render("handlers/onError/index.njk");
  return reply;
};
