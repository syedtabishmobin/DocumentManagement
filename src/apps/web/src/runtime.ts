export function isLocalRuntime() {
  if (typeof window === "undefined") return true;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}
