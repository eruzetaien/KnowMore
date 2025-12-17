export function redirectIfNotOn(path: string): void {
  if (window.location.pathname !== path) {
    window.location.href = path;
  }
}
