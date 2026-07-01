const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function isRoadmapApiEnabled() {
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
        const message = payload?.message || `Erro na API do roadmap (${response.status})`;
        throw new Error(message);
    }

    return payload?.data ?? null;
}

function prefixForType(type) {
    return `/roadmap/${type}`;
}

export function createRoadmapApi(type) {
    const prefix = prefixForType(type);

    return {
        getState: () => request('GET', `${prefix}/state`),

        importState: (state) => request('POST', `${prefix}/import`, state),

        syncState: (state) => request('POST', `${prefix}/sync`, state),

        createItem: (item) => request('POST', `${prefix}/items`, item),

        updateItem: (id, patch) => request('PUT', `${prefix}/items/${encodeURIComponent(id)}`, patch),

        deleteItem: (id) => request('DELETE', `${prefix}/items/${encodeURIComponent(id)}`),

        deleteItemsByProduct: (productId) =>
            request('DELETE', `${prefix}/products/${encodeURIComponent(productId)}/items`),

        createProduct: (product) => request('POST', `${prefix}/products`, product),

        updateProduct: (id, patch) => request('PUT', `${prefix}/products/${encodeURIComponent(id)}`, patch),

        deleteProduct: (id) => request('DELETE', `${prefix}/products/${encodeURIComponent(id)}`)
    };
}

const apiCache = new Map();

export function getRoadmapApi(type) {
    if (!apiCache.has(type)) {
        apiCache.set(type, createRoadmapApi(type));
    }

    return apiCache.get(type);
}
