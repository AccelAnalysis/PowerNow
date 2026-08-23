export function getBearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : authorization.trim();
}

export function isConfiguredAdminAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const supplied =
    getBearerToken(request) ||
    request.headers.get("x-admin-token")?.trim() ||
    "";
  return supplied.length > 0 && supplied === expected;
}

export function requireAdminWhenConfigured(request: Request): void {
  if (process.env.ADMIN_TOKEN && !isConfiguredAdminAuthorized(request)) {
    throw new Error("ADMIN_UNAUTHORIZED");
  }
}

export function resolveGitHubWriteToken(request: Request): string {
  requireAdminWhenConfigured(request);
  const requestToken = request.headers.get("x-github-token")?.trim() ?? "";
  const token = process.env.GITHUB_TOKEN?.trim() || requestToken;
  if (!token) {
    throw new Error("GITHUB_TOKEN_REQUIRED");
  }
  return token;
}

export function resolveStripeAdminKey(request: Request): string {
  const suppliedKey = request.headers.get("x-stripe-key")?.trim() ?? "";

  if (process.env.ADMIN_TOKEN) {
    requireAdminWhenConfigured(request);
    const key = process.env.STRIPE_SECRET_KEY?.trim() || suppliedKey;
    if (!key) throw new Error("STRIPE_KEY_REQUIRED");
    return key;
  }

  // Without a separate ADMIN_TOKEN, never expose a server-held Stripe key
  // through an unauthenticated endpoint. A key supplied for this request is
  // treated as the credential and is not stored.
  if (!suppliedKey) {
    throw new Error("STRIPE_KEY_REQUIRED");
  }
  return suppliedKey;
}
