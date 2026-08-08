import { describe, it, expect, vi } from "vitest";
import type { FastifyReply, FastifyRequest } from "fastify";
import { getHandler, postHandler } from "./index.js";

const makeMockReply = () => ({
  render: vi.fn().mockResolvedValue(undefined),
});

const mockRequest = (body?: unknown, sessionBestPet?: string) => ({
  body,
  session: { bestPet: sessionBestPet } as { bestPet?: string },
  i18n: { t: vi.fn((key: string) => key) },
});

describe("getHandler", () => {
  it("renders with no session value when session is empty", async () => {
    const mockReply = makeMockReply();
    await getHandler(
      mockRequest() as unknown as FastifyRequest,
      mockReply as unknown as FastifyReply,
    );

    expect(mockReply.render).toHaveBeenCalledExactlyOnceWith(
      "handlers/examplePage/index.njk",
      { bestPet: undefined },
    );
  });

  it("renders with session bestPet when set", async () => {
    const mockReply = makeMockReply();
    await getHandler(
      mockRequest(undefined, "dogs") as unknown as FastifyRequest,
      mockReply as unknown as FastifyReply,
    );

    expect(mockReply.render).toHaveBeenCalledExactlyOnceWith(
      "handlers/examplePage/index.njk",
      { bestPet: "dogs" },
    );
  });
});

describe("postHandler", () => {
  it("clears session and renders on reset", async () => {
    const mockReply = makeMockReply();
    const request = mockRequest({ reset: "1" }, "dogs");
    await postHandler(
      request as unknown as FastifyRequest,
      mockReply as unknown as FastifyReply,
    );

    expect(request.session.bestPet).toBeUndefined();
    expect(mockReply.render).toHaveBeenCalledExactlyOnceWith(
      "handlers/examplePage/index.njk",
      { bestPet: undefined },
    );
  });

  it("saves bestPet to session and renders on valid submission", async () => {
    const mockReply = makeMockReply();
    const request = mockRequest({ bestPet: "dogs" });
    await postHandler(
      request as unknown as FastifyRequest,
      mockReply as unknown as FastifyReply,
    );

    expect(request.session.bestPet).toBe("dogs");
    expect(mockReply.render).toHaveBeenCalledExactlyOnceWith(
      "handlers/examplePage/index.njk",
      { bestPet: "dogs" },
    );
  });

  it("renders with errors when no choice is made", async () => {
    const mockReply = makeMockReply();
    await postHandler(
      mockRequest({}) as unknown as FastifyRequest,
      mockReply as unknown as FastifyReply,
    );

    expect(mockReply.render).toHaveBeenCalledExactlyOnceWith(
      "handlers/examplePage/index.njk",
      {
        bestPet: undefined,
        errors: {
          bestPet: {
            href: "#bestPet",
            text: "examplePage.bestPetNoChoiceErrorMessage",
          },
        },
        errorList: [
          { href: "#bestPet", text: "examplePage.bestPetNoChoiceErrorMessage" },
        ],
      },
    );
  });

  it("renders with errors when wrong choice is made", async () => {
    const mockReply = makeMockReply();
    await postHandler(
      mockRequest({ bestPet: "cats" }) as unknown as FastifyRequest,
      mockReply as unknown as FastifyReply,
    );

    expect(mockReply.render).toHaveBeenCalledExactlyOnceWith(
      "handlers/examplePage/index.njk",
      {
        bestPet: undefined,
        errors: {
          bestPet: {
            href: "#bestPet",
            text: "examplePage.bestPetWrongChoiceErrorMessage",
          },
        },
        errorList: [
          {
            href: "#bestPet",
            text: "examplePage.bestPetWrongChoiceErrorMessage",
          },
        ],
      },
    );
  });

  it("uses i18n for error messages", async () => {
    const mockReply = makeMockReply();
    const request = mockRequest({ bestPet: "cats" });
    await postHandler(
      request as unknown as FastifyRequest,
      mockReply as unknown as FastifyReply,
    );

    expect(request.i18n.t).toHaveBeenCalledWith(
      "examplePage.bestPetWrongChoiceErrorMessage",
    );
    expect(request.i18n.t).toHaveBeenCalledWith(
      "examplePage.bestPetNoChoiceErrorMessage",
    );
  });
});
