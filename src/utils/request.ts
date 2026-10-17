/** Combine command cancellation with a per-request timeout; works without AbortSignal.any. */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  signal?: AbortSignal,
  timeout = 12000,
) {
  const controller = new AbortController();
  const cancel = () => controller.abort(signal?.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(
    () => controller.abort(new Error("请求超时，请检查网络后重试")),
    timeout,
  );
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    // Read the body under the same timeout, including slow or stalled responses.
    const body = await response.text();
    return { ok: response.ok, status: response.status, body };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}
