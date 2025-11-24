export function redirectIfNotOn(loginPath: string): void {
  if (window.location.pathname !== loginPath) {
    window.location.href = loginPath;
  }
}
