/**
 * Authenticates incoming cron job requests using a shared secret.
 *
 * Set `CRON_SECRET` (and optionally `CRON_SECRET_PREVIOUS` during key
 * rotation) in your server environment variables.  Requests must supply the
 * secret as a Bearer token:
 *
 *   Authorization: Bearer <your-cron-secret>
 *
 * Returns `null` when the token is valid, or a `Response` with the
 * appropriate error status so the server handler can return early.
 */
export async function authenticateCronRequest(request: Request): Promise<Response | null> {
  const currentSecret = process.env["CRON_SECRET"];
  const previousSecret = process.env["CRON_SECRET_PREVIOUS"];

  if (!currentSecret) {
    return new Response("Server configuration error: CRON_SECRET is not set.", { status: 500 });
  }

  const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "");
  const token = match?.[1];

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { createHash, timingSafeEqual } = await import("node:crypto");

  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  const providedDigest = digest(token);
  const currentMatches = timingSafeEqual(providedDigest, digest(currentSecret));
  const previousMatches = timingSafeEqual(providedDigest, digest(previousSecret ?? currentSecret));

  if (!currentMatches && !previousMatches) {
    return new Response("Unauthorized", { status: 401 });
  }

  return null;
}
