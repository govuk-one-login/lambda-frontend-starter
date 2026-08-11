import type { Mock } from "vitest";
import { expect, it, describe, vi, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { routes } from "./routes.js";
import { paths } from "./utils/paths.js";

const mockRobotsHandler = vi.fn();
const mockExampleGetHandler = vi.fn();
const mockExamplePostHandler = vi.fn();

vi.mock(import("./handlers/robots.txt/index.js"), () => ({
  handler: mockRobotsHandler,
}));
vi.mock(import("./handlers/examplePage/index.js"), () => ({
  getHandler: mockExampleGetHandler,
  postHandler: mockExamplePostHandler,
}));

describe("routes plugin", () => {
  let mockFastify: FastifyInstance;
  let mockGet: Mock;
  let mockPost: Mock;
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet = vi.fn();
    mockPost = vi.fn();
    mockRequest = {};
    mockReply = {};

    mockFastify = {
      get: mockGet,
      post: mockPost,
    } as unknown as FastifyInstance;
  });

  it("registers GET /healthcheck", () => {
    routes(mockFastify);

    expect(mockGet).toHaveBeenCalledWith("/healthcheck", expect.any(Function));
  });

  it("gET /healthcheck sends 'ok'", async () => {
    routes(mockFastify);

    const handler = mockGet.mock.calls.find(
      (call) => call[0] === "/healthcheck",
    )?.[1];
    mockReply = { send: vi.fn().mockResolvedValue(undefined) };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await handler(mockRequest, mockReply);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockReply.send).toHaveBeenCalledWith("ok");
  });

  it("registers GET /robots.txt", () => {
    routes(mockFastify);

    expect(mockGet).toHaveBeenCalledWith("/robots.txt", expect.any(Function));
  });

  it("gET /robots.txt delegates to robots.txt handler", async () => {
    routes(mockFastify);

    const handler = mockGet.mock.calls.find(
      (call) => call[0] === "/robots.txt",
    )?.[1];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await handler(mockRequest, mockReply);

    expect(mockRobotsHandler).toHaveBeenCalledWith(mockRequest, mockReply);
  });

  it("registers GET route for examplePage", () => {
    routes(mockFastify);

    expect(mockGet).toHaveBeenCalledWith(
      paths.examplePage.path,
      expect.any(Function),
    );
  });

  it("registers POST route for examplePage", () => {
    routes(mockFastify);

    expect(mockPost).toHaveBeenCalledWith(
      paths.examplePage.path,
      expect.any(Function),
    );
  });

  it("gET examplePage delegates to getHandler", async () => {
    routes(mockFastify);

    const handler = mockGet.mock.calls.find(
      (call) => call[0] === paths.examplePage.path,
    )?.[1];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await handler(mockRequest, mockReply);

    expect(mockExampleGetHandler).toHaveBeenCalledWith(mockRequest, mockReply);
  });

  it("pOST examplePage delegates to postHandler", async () => {
    routes(mockFastify);

    const handler = mockPost.mock.calls.find(
      (call) => call[0] === paths.examplePage.path,
    )?.[1];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await handler(mockRequest, mockReply);

    expect(mockExamplePostHandler).toHaveBeenCalledWith(mockRequest, mockReply);
  });
});
