import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("web API request context", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("aborts a stalled session request at the deterministic client deadline", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const requestSignal = init?.signal;
      return new Promise((_resolve, reject) => {
        requestSignal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { api } = await import("./api.js");

    const sessionRequest = api.session({ timeoutMs: 25 });
    const rejection = expect(sessionRequest).rejects.toThrow("Doculyra took too long to respond.");
    await vi.advanceTimersByTimeAsync(25);
    await rejection;

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/auth/session");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: "same-origin" });
  });

  it("clears the deadline after a successful anonymous session response", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async (): Promise<Response> => new Response(JSON.stringify({ authenticated: false, onboardingComplete: false }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { api } = await import("./api.js");

    await expect(api.session({ timeoutMs: 25 })).resolves.toEqual({ authenticated: false, onboardingComplete: false });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reuses one in-flight session request when startup is retried concurrently", async () => {
    let resolveSession: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn((): Promise<Response> => new Promise((resolve) => { resolveSession = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    const { api } = await import("./api.js");

    const first = api.session();
    const retry = api.session();
    expect(fetchMock).toHaveBeenCalledOnce();
    resolveSession?.(new Response(JSON.stringify({ authenticated: false, onboardingComplete: false }), { status: 200 }));

    await expect(Promise.all([first, retry])).resolves.toEqual([
      { authenticated: false, onboardingComplete: false },
      { authenticated: false, onboardingComplete: false },
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("binds CSRF, workspace, purpose and idempotency headers", async () => {
    const calls: Array<{ path: string; init?: RequestInit }> = [];
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const path = String(input);
      calls.push({ path, ...(init ? { init } : {}) });
      if (path.endsWith("/auth/register")) {
        return new Response(JSON.stringify({
          authenticated: true,
          onboardingComplete: false,
          account: { id: "id_a", displayName: "Synthetic Owner", email: "owner@example.test" },
        }), { status: 201, headers: { "X-CSRF-Token": "csrf-a" } });
      }
      if (path.endsWith("/workspace")) {
        return new Response(JSON.stringify({ id: "wrk_a", name: "Synthetic household", type: "FAMILY" }), { status: 200, headers: { "X-CSRF-Token": "csrf-b" } });
      }
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { api } = await import("./api.js");

    await api.register({ displayName: "Synthetic Owner", email: "owner@example.test", password: "synthetic-password" });
    await api.configureWorkspace({ name: "Synthetic household", type: "FAMILY" });
    await api.dashboard();
    const file = new File(["synthetic"], "synthetic.txt", { type: "text/plain" });
    await api.upload(file, ["subject_a"], "FILE", true, "capture-operation-0001");
    await api.upload(file, ["subject_a"], "FILE", true, "capture-operation-0001");
    await api.upload(file, ["subject_a"], "FILE", true, "capture-operation-0002");

    const registrationHeaders = new Headers(calls[0]!.init?.headers);
    expect(registrationHeaders.get("X-CSRF-Token")).toBeNull();
    expect(registrationHeaders.get("X-Workspace-Id")).toBeNull();
    expect(registrationHeaders.get("Idempotency-Key")).toBeTruthy();

    const creationHeaders = new Headers(calls[1]!.init?.headers);
    expect(creationHeaders.get("X-CSRF-Token")).toBe("csrf-a");
    expect(creationHeaders.get("X-Workspace-Id")).toBeNull();
    expect(creationHeaders.get("X-Purpose-Id")).toBe("PUR-P1-001");
    expect(creationHeaders.get("Idempotency-Key")).toBeTruthy();

    const dashboardHeaders = new Headers(calls[2]!.init?.headers);
    expect(dashboardHeaders.get("X-Workspace-Id")).toBe("wrk_a");
    expect(dashboardHeaders.get("X-Purpose-Id")).toBe("PUR-P1-001");
    expect(dashboardHeaders.get("X-Correlation-Id")).toBeTruthy();
    const uploadKeys = calls.slice(3).map((call) => new Headers(call.init?.headers).get("Idempotency-Key"));
    expect(uploadKeys).toEqual(["capture-operation-0001", "capture-operation-0001", "capture-operation-0002"]);
  });
});
