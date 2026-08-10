import type { FastifyReply, FastifyRequest } from "fastify";
import * as v from "valibot";
import {
  checkValueForFormErrors,
  getFormErrorsList,
} from "../../utils/formErrorsHelpers/index.js";

const render = async (
  request: FastifyRequest,
  reply: FastifyReply,
  options?: object,
) => {
  await reply.render("handlers/examplePage/index.njk", {
    ...options,
    bestPet: request.session.bestPet,
  });
};

export async function getHandler(request: FastifyRequest, reply: FastifyReply) {
  await render(request, reply);
  return reply;
}

export async function postHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const resetSchema = v.object({
    reset: v.literal("1"),
  });
  const reset = v.safeParse(resetSchema, request.body).success;

  if (reset) {
    delete request.session.bestPet;
    await render(request, reply);
    return reply;
  }

  const bodySchema = v.object(
    {
      bestPet: v.literal(
        "dogs",
        request.i18n.t("examplePage.bestPetWrongChoiceErrorMessage"),
      ),
    },
    request.i18n.t("examplePage.bestPetNoChoiceErrorMessage"),
  );
  const bodyValidation = checkValueForFormErrors(request.body, bodySchema);

  if (!bodyValidation.success) {
    await render(request, reply, {
      errors: bodyValidation.formErrors,
      errorList: getFormErrorsList(bodyValidation.formErrors),
    });
    return reply;
  }

  request.session.bestPet = bodyValidation.parsedValue.bestPet;
  await render(request, reply);
  return reply;
}
