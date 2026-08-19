import { resolveApiBaseUrl } from '@/api/apiBaseUrl';
import { getAuthToken } from '@/api/authClient';

const baseUrl = resolveApiBaseUrl();

export function isEstablishmentsApiEnabled() {
    return Boolean(baseUrl);
}

function headers(extra = {}) {
    const apiKey = import.meta.env.VITE_API_KEY || '';
    const authToken = getAuthToken();

    return {
        Accept: 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...extra
    };
}

async function request(method, path, body) {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: headers({ 'Content-Type': 'application/json' }),
        body: body !== undefined ? JSON.stringify(body) : undefined
    });

    let payload = null;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok) {
        const message = payload?.message || `Erro na API (${response.status})`;
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return payload?.data ?? null;
}

export const establishmentsApi = {
    list: () => request('GET', '/establishments'),
    detail: (id) => request('GET', `/establishments/${encodeURIComponent(id)}`),
    create: (payload) => request('POST', '/establishments', payload),
    update: (id, patch) => request('PATCH', `/establishments/${encodeURIComponent(id)}`, patch),
    remove: (id) => request('DELETE', `/establishments/${encodeURIComponent(id)}`),

    listComments: (id) => request('GET', `/establishments/${encodeURIComponent(id)}/comments`),
    addComment: (id, comment) => request('POST', `/establishments/${encodeURIComponent(id)}/comments`, { comment }),

    listPhases: () => request('GET', '/establishments/phases'),
    createPhase: (title) => request('POST', '/establishments/phases', { title }),
    updatePhase: (id, patch) => request('PATCH', `/establishments/phases/${encodeURIComponent(id)}`, patch),
    deletePhase: (id) => request('DELETE', `/establishments/phases/${encodeURIComponent(id)}`),

    createUnit: (establishmentId, name) => request('POST', `/establishments/${encodeURIComponent(establishmentId)}/units`, { name }),
    updateUnit: (unitId, name) => request('PUT', `/establishments/units/${encodeURIComponent(unitId)}`, { name }),
    deleteUnit: (unitId) => request('DELETE', `/establishments/units/${encodeURIComponent(unitId)}`),

    createConvenio: (establishmentId, name) => request('POST', `/establishments/${encodeURIComponent(establishmentId)}/convenios`, { name }),
    updateConvenio: (convenioId, name) => request('PUT', `/establishments/convenios/${encodeURIComponent(convenioId)}`, { name }),
    deleteConvenio: (convenioId) => request('DELETE', `/establishments/convenios/${encodeURIComponent(convenioId)}`),

    updateCell: (establishmentId, convenioId, unitId, patch) =>
        request('PUT', `/establishments/${encodeURIComponent(establishmentId)}/cells/${encodeURIComponent(convenioId)}/${encodeURIComponent(unitId)}`, patch),

    listAppointments: (start, end) => request('GET', `/establishments/appointments?start=${start}&end=${end}`),
    listAppointmentsForEstablishment: (establishmentId) => request('GET', `/establishments/${encodeURIComponent(establishmentId)}/appointments`),
    createAppointment: (establishmentId, payload) => request('POST', `/establishments/${encodeURIComponent(establishmentId)}/appointments`, payload),
    updateAppointment: (establishmentId, appointmentId, payload) =>
        request('PUT', `/establishments/${encodeURIComponent(establishmentId)}/appointments/${encodeURIComponent(appointmentId)}`, payload),
    deleteAppointment: (establishmentId, appointmentId) =>
        request('DELETE', `/establishments/${encodeURIComponent(establishmentId)}/appointments/${encodeURIComponent(appointmentId)}`),

    async import(file) {
        const response = await fetch(`${baseUrl}/establishments/import`, {
            method: 'POST',
            headers: headers(),
            body: (() => {
                const form = new FormData();
                form.append('file', file);
                return form;
            })()
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }

        if (!response.ok) {
            throw new Error(payload?.message || `Erro na importação (${response.status})`);
        }

        return payload?.data ?? null;
    }
};
