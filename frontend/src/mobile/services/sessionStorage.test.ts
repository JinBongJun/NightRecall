import { beforeEach, describe, expect, it, vi } from "vitest";

const secureStoreMocks = vi.hoisted(() => ({
  deleteItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}));

vi.mock("expo-secure-store", () => ({
  deleteItemAsync: secureStoreMocks.deleteItemAsync,
  getItemAsync: secureStoreMocks.getItemAsync,
  setItemAsync: secureStoreMocks.setItemAsync,
}));

import { loadSession } from "./sessionStorage";

describe("sessionStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when there is no stored session", async () => {
    secureStoreMocks.getItemAsync.mockResolvedValue(null);

    await expect(loadSession()).resolves.toBeNull();
  });

  it("deletes corrupted session payloads and returns null", async () => {
    secureStoreMocks.getItemAsync.mockResolvedValue("{not-json");

    await expect(loadSession()).resolves.toBeNull();
    expect(secureStoreMocks.deleteItemAsync).toHaveBeenCalledWith("nightrecall.session");
  });
});
