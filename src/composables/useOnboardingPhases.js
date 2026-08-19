import { ref } from 'vue';
import { establishmentsApi, isEstablishmentsApiEnabled } from '@/api/establishmentsClient';

const phases = ref([]);
const isHydrated = ref(false);
let loadPromise = null;

function ensureLoaded() {
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        if (!isEstablishmentsApiEnabled()) {
            isHydrated.value = true;
            return;
        }

        try {
            phases.value = await establishmentsApi.listPhases();
        } catch {
            loadPromise = null; // permite tentar de novo na próxima chamada, em vez de travar vazio pra sempre
        } finally {
            isHydrated.value = true;
        }
    })();

    return loadPromise;
}

async function addPhase(title = 'Nova fase') {
    const phase = await establishmentsApi.createPhase(title.trim() || 'Nova fase');
    phases.value.push(phase);
    return phase;
}

async function renamePhase(phaseId, title) {
    const phase = phases.value.find((p) => p.id === phaseId);
    if (!phase) return;
    const previous = phase.title;
    phase.title = title.trim() || phase.title;
    try {
        await establishmentsApi.updatePhase(phaseId, { title: phase.title });
    } catch (error) {
        phase.title = previous;
        throw error;
    }
}

async function removePhase(phaseId) {
    if (phases.value.length <= 1) return false;
    const index = phases.value.findIndex((p) => p.id === phaseId);
    if (index === -1) return false;

    await establishmentsApi.deletePhase(phaseId);
    phases.value.splice(index, 1);
    return true;
}

async function movePhase(phaseId, direction) {
    const index = phases.value.findIndex((p) => p.id === phaseId);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= phases.value.length) return;

    const [phase] = phases.value.splice(index, 1);
    phases.value.splice(target, 0, phase);

    await Promise.all(
        phases.value.map((p, i) => {
            p.orderIndex = i;
            return establishmentsApi.updatePhase(p.id, { orderIndex: i });
        })
    );
}

export function useOnboardingPhases() {
    const ready = ensureLoaded();

    return {
        ready,
        phases,
        isHydrated,
        addPhase,
        renamePhase,
        removePhase,
        movePhase
    };
}
