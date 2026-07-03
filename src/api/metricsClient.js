import { resolveApiBaseUrl } from '@/api/apiBaseUrl';

const baseUrl = resolveApiBaseUrl();

export function isMetricsApiEnabled() {
    return Boolean(baseUrl);
}

function headers() {
    const apiKey = import.meta.env.VITE_API_KEY || '';

    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {})
    };
}

async function request(method, path, body) {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: headers(),
        body: body !== undefined ? JSON.stringify(body) : undefined
    });

    let payload = null;

    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok) {
        const message = payload?.message || `Erro na API de métricas (${response.status})`;
        throw new Error(message);
    }

    return payload?.data ?? null;
}

export function fetchMetricsCatalog() {
    return request('GET', '/metrics');
}

export function createMetricGroup(input) {
    return request('POST', '/metrics/groups', input);
}

export function updateMetricGroup(id, input) {
    return request('PUT', `/metrics/groups/${encodeURIComponent(id)}`, input);
}

export function deleteMetricGroup(id) {
    return request('DELETE', `/metrics/groups/${encodeURIComponent(id)}`);
}

export function createMetric(input) {
    return request('POST', '/metrics', input);
}

export function updateMetric(id, input) {
    return request('PUT', `/metrics/${encodeURIComponent(id)}`, input);
}

export function deleteMetric(id) {
    return request('DELETE', `/metrics/${encodeURIComponent(id)}`);
}
