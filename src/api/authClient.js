const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

let authToken = null;

/** Chamado pelo store de auth p/ manter o header Authorization em dia. */
export function setAuthToken(token) {
    authToken = token || null;
}

async function request(method, path, body) {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });

    let payload = null;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok) {
        const error = new Error(payload?.message || `Erro (${response.status})`);
        error.status = response.status;
        error.fields = payload?.errors || null;
        throw error;
    }

    return payload?.data ?? null;
}

export const authApi = {
    login: (login, password) => request('POST', '/auth/login', { login, password }),
    me: () => request('GET', '/auth/me'),
    logout: () => request('POST', '/auth/logout'),
    changePassword: (password, passwordConfirmation) =>
        request('POST', '/auth/change-password', {
            password,
            password_confirmation: passwordConfirmation
        }),
    // Admin
    listUsers: () => request('GET', '/auth/users'),
    createUser: (payload) => request('POST', '/auth/users', payload),
    resetPassword: (id) => request('POST', `/auth/users/${id}/reset-password`),
    updateRole: (id, role) => request('PUT', `/auth/users/${id}/role`, { role }),
    deleteUser: (id) => request('DELETE', `/auth/users/${id}`)
};
