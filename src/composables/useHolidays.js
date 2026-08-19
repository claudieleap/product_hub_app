import { ref } from 'vue';

/** Feriados nacionais por ano (BrasilAPI, pública, sem chave), cacheados em memória. */
const cache = new Map();

export function useHolidays() {
    const holidaysByDate = ref({});
    const loading = ref(false);

    async function loadYear(year) {
        if (cache.has(year)) {
            Object.assign(holidaysByDate.value, cache.get(year));
            return;
        }

        loading.value = true;
        try {
            const response = await fetch(`https://brasilapi.com.br/api/v1/feriados/v1/${year}`);
            if (!response.ok) return;
            const data = await response.json();
            const map = Object.fromEntries(data.map((h) => [h.date, h.name]));
            cache.set(year, map);
            Object.assign(holidaysByDate.value, map);
        } catch {
            // feriados são um extra visual — falha silenciosa não deve travar o calendário
        } finally {
            loading.value = false;
        }
    }

    return { holidaysByDate, loading, loadYear };
}
