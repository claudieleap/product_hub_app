const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
});

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
});

function toDate(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatBrazilianDateTime(value) {
    const date = toDate(value);
    if (!date) return '—';
    return DATE_TIME_FORMATTER.format(date).replace(',', ' às');
}

export function formatBrazilianDate(value) {
    const date = toDate(value);
    if (!date) return '—';
    return DATE_FORMATTER.format(date);
}

/** Máscara dd/mm/aaaa enquanto o usuário digita. */
export function maskBrazilianDateInput(value = '') {
    const digits = String(value).replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Converte dd/mm/aaaa em chave ISO (aaaa-mm-dd) para comparação. */
export function parseBrazilianDateToIsoKey(value) {
    const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }

    const pad = (n) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}`;
}

/** Converte chave ISO (aaaa-mm-dd) para exibição dd/mm/aaaa. */
export function isoKeyToBrazilianDate(isoKey) {
    if (!isoKey || !/^\d{4}-\d{2}-\d{2}$/.test(isoKey)) return '';
    const [year, month, day] = isoKey.split('-');
    return `${day}/${month}/${year}`;
}

/** Converte chave ISO (aaaa-mm-dd) em Date local (sem fuso). */
export function isoKeyToDate(isoKey) {
    if (!isoKey || !/^\d{4}-\d{2}-\d{2}$/.test(isoKey)) return null;

    const [year, month, day] = isoKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }

    return date;
}

/** Converte Date local em chave ISO (aaaa-mm-dd). */
export function dateToIsoKey(date) {
    if (!date || Number.isNaN(date.getTime())) return '';

    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Data de entrega no fuso de São Paulo, como chave ISO para filtros. */
export function deliveryDateIsoKey(value) {
    const date = toDate(value);
    if (!date) return '';

    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}
