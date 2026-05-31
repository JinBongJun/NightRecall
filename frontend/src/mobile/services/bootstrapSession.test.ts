import { describe, expect, it, vi } from "vitest";

import { bootstrapSession } from "./bootstrapSession";

describe("bootstrapSession", () => {
  it("finishes bootstrap when no persisted session exists", async () => {
    const finishBootstrap = vi.fn();
    const setPlan = vi.fn();

    await bootstrapSession({
      restoreSession: vi.fn().mockResolvedValue(null),
      fetchPlan: vi.fn(),
      setPlan,
      finishBootstrap,
    });

    expect(setPlan).not.toHaveBeenCalled();
    expect(finishBootstrap).toHaveBeenCalledTimes(1);
  });

  it("loads entitlements after restoring a session", async () => {
    const finishBootstrap = vi.fn();
    const setPlan = vi.fn();

    await bootstrapSession({
      restoreSession: vi.fn().mockResolvedValue({
        userId: "user-1",
        timezone: "Asia/Seoul",
        authMode: "signed_in",
        accessToken: "access",
        refreshToken: "refresh",
        provider: "google",
      }),
      fetchPlan: vi.fn().mockResolvedValue({ plan: "plus" }),
      setPlan,
      finishBootstrap,
    });

    expect(setPlan).toHaveBeenCalledWith("plus");
    expect(finishBootstrap).toHaveBeenCalledTimes(1);
  });

  it("runs beforeReady before finishing bootstrap", async () => {
    const finishBootstrap = vi.fn();
    const beforeReady = vi.fn().mockResolvedValue(undefined);
    const callOrder: string[] = [];

    beforeReady.mockImplementation(async () => {
      callOrder.push("beforeReady");
    });
    finishBootstrap.mockImplementation(() => {
      callOrder.push("finishBootstrap");
    });

    await bootstrapSession({
      restoreSession: vi.fn().mockResolvedValue({
        userId: "user-1",
        timezone: "Asia/Seoul",
        authMode: "signed_in",
        accessToken: "access",
        refreshToken: "refresh",
        provider: "google",
      }),
      fetchPlan: vi.fn().mockResolvedValue({ plan: "free" }),
      setPlan: vi.fn(),
      finishBootstrap,
      beforeReady,
    });

    expect(beforeReady).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(["beforeReady", "finishBootstrap"]);
  });

  it("still finishes bootstrap when entitlements fail", async () => {
    const finishBootstrap = vi.fn();
    const setPlan = vi.fn();

    await bootstrapSession({
      restoreSession: vi.fn().mockResolvedValue({
        userId: "user-1",
        timezone: "Asia/Seoul",
        authMode: "signed_in",
        accessToken: "access",
        refreshToken: "refresh",
        provider: "google",
      }),
      fetchPlan: vi.fn().mockRejectedValue(new Error("boom")),
      setPlan,
      finishBootstrap,
    });

    expect(setPlan).not.toHaveBeenCalled();
    expect(finishBootstrap).toHaveBeenCalledTimes(1);
  });
});
