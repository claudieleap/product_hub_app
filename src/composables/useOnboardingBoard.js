import { computed, reactive, watch } from 'vue';
import {
    DEFAULT_MODE,
    DEFAULT_STATUS,
    ONBOARDING_OPERATIONS,
    ONBOARDING_STORAGE_KEY,
    cellKey
} from '@/config/onboardingConfig';
import { createOnboardingSeed } from '@/data/onboardingSeed';

/**
 * Store singleton (local-first) do board de Onboarding.
 *
 * Persiste em localStorage. A forma dos dados foi desenhada para, no futuro,
 * sincronizar com a API (getState/syncState) sem mudar os componentes.
 */

const state = reactive({
    phases: [],
    cards: [],
    hydrated: false
});

function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultOps() {
    return ONBOARDING_OPERATIONS.reduce((acc, op) => {
        acc[op.id] = { status: DEFAULT_STATUS, descricao: '' };
        return acc;
    }, {});
}

function defaultCell() {
    return {
        ativo: false,
        modo: DEFAULT_MODE,
        portalLogin: '',
        portalSenha: '',
        detalhe: '',
        ops: defaultOps()
    };
}

function normalizeCard(card) {
    return {
        id: card.id ?? uid('onb'),
        phaseId: card.phaseId ?? 'backlog',
        order: Number.isFinite(card.order) ? card.order : 0,
        name: card.name ?? 'Nova clínica',
        kind: card.kind ?? 'clinica',
        projects: Array.isArray(card.projects) ? [...card.projects] : [],
        notes: card.notes ?? '',
        units: Array.isArray(card.units) ? card.units.map((u) => ({ ...u })) : [],
        convenios: Array.isArray(card.convenios) ? card.convenios.map((c) => ({ ...c })) : [],
        cells: card.cells && typeof card.cells === 'object' ? { ...card.cells } : {},
        createdAt: card.createdAt ?? new Date().toISOString()
    };
}

function hydrate() {
    if (state.hydrated) return;

    let loaded = null;
    try {
        const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (raw) loaded = JSON.parse(raw);
    } catch (error) {
        console.warn('[onboarding] falha ao ler estado local; usando seed.', error);
    }

    const source = loaded && Array.isArray(loaded.phases) && loaded.phases.length
        ? loaded
        : createOnboardingSeed();

    state.phases = source.phases.map((phase) => ({ ...phase }));
    state.cards = (source.cards ?? []).map(normalizeCard);
    state.hydrated = true;
}

let persistTimer = null;
function persist() {
    if (typeof window === 'undefined') return;
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
        try {
            localStorage.setItem(
                ONBOARDING_STORAGE_KEY,
                JSON.stringify({ phases: state.phases, cards: state.cards })
            );
        } catch (error) {
            console.warn('[onboarding] falha ao persistir estado local.', error);
        }
    }, 200);
}

hydrate();
watch(
    () => [state.phases, state.cards],
    persist,
    { deep: true }
);

/* ---------- fases (colunas) ---------- */

function addPhase(title = 'Nova fase') {
    const phase = { id: uid('phase'), title: title.trim() || 'Nova fase', hint: '' };
    state.phases.push(phase);
    return phase;
}

function renamePhase(phaseId, title) {
    const phase = state.phases.find((p) => p.id === phaseId);
    if (phase) phase.title = title.trim() || phase.title;
}

function removePhase(phaseId) {
    if (state.phases.length <= 1) return false;
    const index = state.phases.findIndex((p) => p.id === phaseId);
    if (index === -1) return false;

    // Move cards da fase removida para a fase anterior (ou a primeira).
    const fallback = state.phases[index - 1]?.id ?? state.phases.find((p) => p.id !== phaseId)?.id;
    state.cards.forEach((card) => {
        if (card.phaseId === phaseId) card.phaseId = fallback;
    });
    state.phases.splice(index, 1);
    return true;
}

function movePhase(phaseId, direction) {
    const index = state.phases.findIndex((p) => p.id === phaseId);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= state.phases.length) return;
    const [phase] = state.phases.splice(index, 1);
    state.phases.splice(target, 0, phase);
}

/* ---------- cards (clínicas/hospitais) ---------- */

function cardsByPhase(phaseId) {
    return state.cards
        .filter((card) => card.phaseId === phaseId)
        .sort((a, b) => a.order - b.order);
}

function countByPhase(phaseId) {
    return state.cards.filter((card) => card.phaseId === phaseId).length;
}

function getCard(cardId) {
    return state.cards.find((card) => card.id === cardId) ?? null;
}

function addCard({ phaseId, name = 'Nova clínica', kind = 'clinica' } = {}) {
    const targetPhase = phaseId ?? state.phases[0]?.id ?? 'backlog';
    const order = countByPhase(targetPhase);
    const card = normalizeCard({
        id: uid('onb'),
        phaseId: targetPhase,
        order,
        name,
        kind,
        createdAt: new Date().toISOString()
    });
    state.cards.push(card);
    return card;
}

function updateCard(cardId, patch = {}) {
    const card = getCard(cardId);
    if (!card) return;
    if (patch.name !== undefined) card.name = patch.name;
    if (patch.kind !== undefined) card.kind = patch.kind;
    if (patch.projects !== undefined) card.projects = [...patch.projects];
    if (patch.notes !== undefined) card.notes = patch.notes;
}

function toggleCardProject(cardId, projectId) {
    const card = getCard(cardId);
    if (!card) return;
    if (card.projects.includes(projectId)) {
        card.projects = card.projects.filter((id) => id !== projectId);
    } else {
        card.projects = [...card.projects, projectId];
    }
}

function removeCard(cardId) {
    const index = state.cards.findIndex((card) => card.id === cardId);
    if (index !== -1) state.cards.splice(index, 1);
}

function moveCardToPhase(cardId, phaseId) {
    const card = getCard(cardId);
    if (!card || card.phaseId === phaseId) return false;
    card.phaseId = phaseId;
    card.order = countByPhase(phaseId);
    return true;
}

/* ---------- unidades ---------- */

function addUnit(cardId, name) {
    const card = getCard(cardId);
    if (!card) return null;
    const unit = { id: uid('un'), name: name?.trim() || `Unidade ${card.units.length + 1}` };
    card.units.push(unit);
    return unit;
}

function renameUnit(cardId, unitId, name) {
    const unit = getCard(cardId)?.units.find((u) => u.id === unitId);
    if (unit) unit.name = name.trim() || unit.name;
}

function removeUnit(cardId, unitId) {
    const card = getCard(cardId);
    if (!card) return;
    card.units = card.units.filter((u) => u.id !== unitId);
    // Limpa células órfãs desta unidade.
    Object.keys(card.cells).forEach((key) => {
        if (key.endsWith(`::${unitId}`)) delete card.cells[key];
    });
}

/* ---------- convênios ---------- */

function addConvenio(cardId, name) {
    const card = getCard(cardId);
    if (!card) return null;
    const convenio = { id: uid('cv'), name: name?.trim() || `Convênio ${card.convenios.length + 1}` };
    card.convenios.push(convenio);
    return convenio;
}

function renameConvenio(cardId, convenioId, name) {
    const convenio = getCard(cardId)?.convenios.find((c) => c.id === convenioId);
    if (convenio) convenio.name = name.trim() || convenio.name;
}

function removeConvenio(cardId, convenioId) {
    const card = getCard(cardId);
    if (!card) return;
    card.convenios = card.convenios.filter((c) => c.id !== convenioId);
    Object.keys(card.cells).forEach((key) => {
        if (key.startsWith(`${convenioId}::`)) delete card.cells[key];
    });
}

/* ---------- células (convênio × unidade) ---------- */

/** Leitura: devolve a célula persistida ou um default (não materializa). */
function readCell(card, convenioId, unitId) {
    return card?.cells?.[cellKey(convenioId, unitId)] ?? defaultCell();
}

/** Garante que a célula exista no card e devolve a referência reativa. */
function ensureCell(cardId, convenioId, unitId) {
    const card = getCard(cardId);
    if (!card) return null;
    const key = cellKey(convenioId, unitId);
    if (!card.cells[key]) card.cells[key] = defaultCell();
    return card.cells[key];
}

function updateCell(cardId, convenioId, unitId, patch = {}) {
    const cell = ensureCell(cardId, convenioId, unitId);
    if (!cell) return;
    Object.assign(cell, patch);
}

function setOperation(cardId, convenioId, unitId, opId, patch = {}) {
    const cell = ensureCell(cardId, convenioId, unitId);
    if (!cell) return;
    cell.ops[opId] = { ...cell.ops[opId], ...patch };
}

/* ---------- resumo p/ o tile da matriz ---------- */

/** Progresso geral de um card: % de operações "feito" entre células ativas. */
function cardProgress(card) {
    let total = 0;
    let done = 0;
    card.units.forEach((unit) => {
        card.convenios.forEach((convenio) => {
            const cell = readCell(card, convenio.id, unit.id);
            if (!cell.ativo) return;
            ONBOARDING_OPERATIONS.forEach((op) => {
                total += 1;
                if (cell.ops?.[op.id]?.status === 'feito') done += 1;
            });
        });
    });
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function useOnboardingBoard() {
    return {
        state,
        phases: computed(() => state.phases),
        cards: computed(() => state.cards),
        hydrated: computed(() => state.hydrated),
        // fases
        addPhase,
        renamePhase,
        removePhase,
        movePhase,
        // cards
        cardsByPhase,
        countByPhase,
        getCard,
        addCard,
        updateCard,
        toggleCardProject,
        removeCard,
        moveCardToPhase,
        // unidades
        addUnit,
        renameUnit,
        removeUnit,
        // convênios
        addConvenio,
        renameConvenio,
        removeConvenio,
        // células
        readCell,
        ensureCell,
        updateCell,
        setOperation,
        cardProgress
    };
}
