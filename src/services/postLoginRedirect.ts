export function isSafePostLoginRedirect(path: unknown): path is string {
  if (typeof path !== "string" || path.length === 0) return false;
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/\\")
  ) {
    return false;
  }
  const lowered = path.toLowerCase();
  if (lowered.startsWith("/login") || lowered.startsWith("/auth/")) {
    return false;
  }
  return !lowered.startsWith("/oauth2") && !lowered.startsWith("/saml2");
}
