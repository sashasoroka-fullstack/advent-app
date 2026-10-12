import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, resolveApiMediaUrl } from "./client";

vi.mock("./authToken", () => ({
  getApiAuthHeaders: () => ({ Authorization: "Bearer test-token" }),
}));

describe("api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("leaves absolute media URLs unchanged", () => {
    expect(resolveApiMediaUrl("https://cdn.example/map.svg")).toBe(
      "https://cdn.example/map.svg",
    );
    expect(resolveApiMediaUrl("")).toBe("");
  });

  it("prefixes relative media paths with the API base URL", () => {
    expect(resolveApiMediaUrl("/media/abc/file")).toBe(
      "http://localhost:3001/media/abc/file",
    );
  });

  it("parses a successful JSON response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => JSON.stringify({ id: 1 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest<{ id: number }>("/quest/active")).resolves.toEqual({
      id: 1,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/quest/active",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });

  it("throws ApiError with the server message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 403,
        ok: false,
        text: async () => JSON.stringify({ message: "Privileged role required" }),
      }),
    );

    const error = await apiRequest("/media").catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 403,
      message: "Privileged role required",
    });
  });
});
