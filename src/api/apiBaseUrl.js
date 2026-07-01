/**
 * Garante que a base da API sempre inclua /api/v1.
 * Em producao, VITE_API_BASE_URL as vezes vem como .../api (sem /v1).
 */
export function resolveApiBaseUrl(raw = import.meta.env.VITE_API_BASE_URL) {
    const fallback = '/api/v1';
    const base = (raw || fallback).replace(/\/$/, '');

    if (!base) return fallback;
    if (/\/api\/v\d+$/.test(base)) return base;
    if (base.endsWith('/api')) return `${base}/v1`;

    return base;
}
