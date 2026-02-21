const ABSOLUTE_PROTOCOL = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

function normalizeBase(base: string): string {
  if (!base || base === "/") {
    return "";
  }

  const trimmed = base.replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

const BASE_URL = normalizeBase(import.meta.env.BASE_URL ?? "");

function isExternalOrAnchor(path: string): boolean {
  return ABSOLUTE_PROTOCOL.test(path) || path.startsWith("//") || path.startsWith("#");
}

export function withBasePath(path: string): string {
  if (!path || path === "/") {
    return BASE_URL ? `${BASE_URL}/` : "/";
  }

  if (isExternalOrAnchor(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
}

export function withBase(path: string): string {
  if (!path) {
    return BASE_URL ? `${BASE_URL}/` : "/";
  }

  if (isExternalOrAnchor(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath === "/") {
    return BASE_URL ? `${BASE_URL}/` : "/";
  }

  return `${BASE_URL}${normalizedPath}`;
}
