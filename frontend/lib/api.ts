const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
).replace(/\/+$/, "");

export function apiUrl(path: string): string {
  return `${apiBaseUrl}/${path.replace(/^\/+/, "")}`;
}
