import { computed, reactive, watch } from 'vue';
import {
    DEFAULT_MODE,
    DEFAULT_STATUS,
    ONBOARDING_OPERATIONS,
    cellKey
} from '@/config/onboardingConfig';
import { establishmentsApi } from '@/api/establishmentsClient';
import { useEstablishments } from '@/composables/useEstablishments';
import { useOnboardingPhases } from '@/composables/useOnboardingPhases';

/**
 * Store singleton do board de Onboarding — API-first (backend compartilhado
 * com o Pipeline comercial via useEstablishments, mesmo registro de
 * "estabelecimento" visto por dois ângulos).
 *
 * Os diálogos (OnboardingCardDialog/OnboardingCellDialog) editam os campos
 * direto por v-model (sem passar por um setter) — pra não precisar reescrever
 * esses componentes, um watcher com debounce sincroniza qualquer mudança pro
 * backend automaticamente (mesmo espírito do debounce que existia pro
 * localStorage antes).
 */

const state = reactive({
    cards: [],
    hydrated: false
});

const sharedEstablishments = useEstablishments();
const onboardingPhases = useOnboardingPhases();

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
        conciliado: false,
        ops: defaultOps()
    };
}

/** Todas as 3 operações concluídas (feito)? Então está pronta pra conciliar. */
export function isCellAllDone(cell) {
    return ONBOARDING_OPERATIONS.every((op) => cell?.ops?.[op.id]?.status === 'feito');
}

function cellFromApi(apiCell) {
    const ops = apiCell.ops && Object.keys(apiCell.ops).length ? apiCell.ops : defaultOps();
    return {
        ativo: Boolean(apiCell.ativo),
        modo: apiCell.modo || DEFAULT_MODE,
        portalLogin: apiCell.portalLogin || '',
        portalSenha: apiCell.portalSenha || '',
        detalhe: apiCell.detalhe || '',
        conciliado: Boolean(apiCell.conciliado),
        ops
    };
}

function cardFromEstablishment(establishment, detail) {
    return {
        id: establishment.id,
        phaseId: establishment.onboardingPhaseId ?? onboardingPhases.phases.value[0]?.id ?? 'backlog',
        order: Number.isFinite(establishment.onboardingOrderIndex) ? establishment.onboardingOrderIndex : 0,
        name: establishment.fantasia ?? 'Novo estabelecimento',
        kind: establishment.kind ?? 'clinica',
        projects: Array.isArray(establishment.projects) ? [...establishment.projects] : [],
        responsavelId: establishment.onboardingResponsavelId ?? null,
        notes: establishment.observacao ?? '',
        nextAppointment: establishment.nextAppointment ?? null,
        units: (detail?.units ?? []).map((u) => ({ ...u })),
        convenios: (detail?.convenios ?? []).map((c) => ({ ...c })),
        cells: Object.fromEntries(
            (detail?.cells ?? []).map((c) => [cellKey(c.convenioId, c.unitId), cellFromApi(c)])
        ),
        createdAt: establishment.createdAt ?? new Date().toISOString()
    };
}

let hydratePromise = null;
function hydrate() {
    if (hydratePromise) return hydratePromise;

    hydratePromise = (async () => {
        await Promise.all([sharedEstablishments.ready, onboardingPhases.ready]);

        const onboardingItems = sharedEstablishments.establishments.value.filter((e) => e.onboardingPhaseId);
        const details = await Promise.all(
            onboardingItems.map((e) => establishmentsApi.detail(e.id).catch(() => null))
        );

        state.cards = onboardingItems.map((establishment, index) => cardFromEstablishment(establishment, details[index]));
        state.cards.forEach(watchCard);
        state.hydrated = true;
    })();

    return hydratePromise;
}

hydrate();

/** Reflete campos "de cartão" no registro compartilhado (visível no Pipeline também). */
function syncSharedFields(card) {
    const shared = sharedEstablishments.getEstablishment(card.id);
    if (!shared) return;
    shared.fantasia = card.name;
    shared.kind = card.kind;
    shared.projects = [...card.projects];
    shared.onboardingResponsavelId = card.responsavelId;
    shared.observacao = card.notes;
    shared.onboardingPhaseId = card.phaseId;
    shared.onboardingOrderIndex = card.order;
}

async function persistCard(card) {
    syncSharedFields(card);
    await establishmentsApi.update(card.id, {
        fantasia: card.name,
        kind: card.kind,
        projects: card.projects,
        onboardingResponsavelId: card.responsavelId,
        observacao: card.notes,
        onboardingPhaseId: card.phaseId,
        onboardingOrderIndex: card.order
    });
}

async function persistCells(card) {
    await Promise.all(
        Object.entries(card.cells).map(([key, cell]) => {
            const [convenioId, unitId] = key.split('::');
            return establishmentsApi.updateCell(card.id, convenioId, unitId, cell);
        })
    );
}

/** Um debounce por cartão — evita re-sincronizar o board inteiro a cada edição. */
const syncTimers = new Map();
function schedulePersistCard(card) {
    clearTimeout(syncTimers.get(card.id));
    syncTimers.set(card.id, setTimeout(() => {
        syncTimers.delete(card.id);
        persistCard(card).catch((error) => console.warn('[onboarding] falha ao sincronizar cartão.', error));
        persistCells(card).catch((error) => console.warn('[onboarding] falha ao sincronizar matriz.', error));
    }, 500));
}

const watchedCardIds = new Set();
/**
 * Os diálogos editam campos direto por v-model (sem passar por um setter), então cada
 * cartão ganha seu próprio watcher — só ele é re-sincronizado quando muda, não o board
 * inteiro (evita uma rajada de requisições a cada edição de um único cartão).
 */
function watchCard(card) {
    if (watchedCardIds.has(card.id)) return;
    watchedCardIds.add(card.id);
    watch(() => card, () => schedulePersistCard(card), { deep: true });
}

/* ---------- fases (colunas) ---------- */

async function addPhase(title = 'Nova fase') {
    return onboardingPhases.addPhase(title);
}

async function renamePhase(phaseId, title) {
    return onboardingPhases.renamePhase(phaseId, title);
}

async function removePhase(phaseId) {
    const phases = onboardingPhases.phases.value;
    if (phases.length <= 1) return false;
    const index = phases.findIndex((p) => p.id === phaseId);
    if (index === -1) return false;

    const fallback = phases[index - 1]?.id ?? phases.find((p) => p.id !== phaseId)?.id;
    state.cards.forEach((card) => {
        if (card.phaseId === phaseId) card.phaseId = fallback;
    });

    return onboardingPhases.removePhase(phaseId);
}

async function movePhase(phaseId, direction) {
    return onboardingPhases.movePhase(phaseId, direction);
}

/* ---------- cards (estabelecimentos) ---------- */

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

function addCard({ phaseId, name = 'Novo estabelecimento', kind = 'clinica' } = {}) {
    const targetPhase = phaseId ?? onboardingPhases.phases.value[0]?.id ?? 'backlog';
    const order = countByPhase(targetPhase);

    const card = {
        id: uid('onb'),
        phaseId: targetPhase,
        order,
        name,
        kind,
        projects: [],
        responsavelId: null,
        notes: '',
        units: [],
        convenios: [],
        cells: {},
        createdAt: new Date().toISOString()
    };

    state.cards.push(card);
    watchCard(card);

    establishmentsApi
        .create({ id: card.id, razaoSocial: name, fantasia: name, kind, onboardingPhaseId: targetPhase, onboardingOrderIndex: order })
        .then((created) => {
            sharedEstablishments.establishments.value.push({ ...created, especialidades: [], projects: created.projects ?? [] });
        })
        .catch((error) => console.warn('[onboarding] falha ao criar estabelecimento.', error));

    return card;
}

/**
 * Promove um estabelecimento que já existe (ex.: veio do Pipeline comercial) pro
 * board de Onboarding. Diferente de addCard: não cria um registro novo, só marca
 * a fase no backend e — como o board só hidrata uma vez — adiciona o card local
 * na hora, sem precisar recarregar a página pra ele aparecer.
 */
async function sendExistingToOnboarding(establishmentId, phaseId) {
    const targetPhase = phaseId ?? onboardingPhases.phases.value[0]?.id ?? 'backlog';
    const order = countByPhase(targetPhase);

    await sharedEstablishments.updateFields(establishmentId, {
        onboardingPhaseId: targetPhase,
        onboardingOrderIndex: order
    });

    if (getCard(establishmentId)) return;

    const establishment = sharedEstablishments.getEstablishment(establishmentId);
    if (!establishment) return;

    const detail = await establishmentsApi.detail(establishmentId).catch(() => null);
    const card = cardFromEstablishment(establishment, detail);
    state.cards.push(card);
    watchCard(card);
}

function updateCard(cardId, patch = {}) {
    const card = getCard(cardId);
    if (!card) return;
    if (patch.name !== undefined) card.name = patch.name;
    if (patch.kind !== undefined) card.kind = patch.kind;
    if (patch.projects !== undefined) card.projects = [...patch.projects];
    if (patch.responsavelId !== undefined) card.responsavelId = patch.responsavelId;
    if (patch.notes !== undefined) card.notes = patch.notes;

    persistCard(card).catch((error) => console.warn('[onboarding] falha ao salvar cartão.', error));
}

function toggleCardProject(cardId, projectId) {
    const card = getCard(cardId);
    if (!card) return;
    if (card.projects.includes(projectId)) {
        card.projects = card.projects.filter((id) => id !== projectId);
    } else {
        card.projects = [...card.projects, projectId];
    }

    persistCard(card).catch((error) => console.warn('[onboarding] falha ao salvar cartão.', error));
}

function removeCard(cardId) {
    const index = state.cards.findIndex((card) => card.id === cardId);
    if (index === -1) return;
    state.cards.splice(index, 1);

    sharedEstablishments
        .removeEstablishment(cardId)
        .catch((error) => console.warn('[onboarding] falha ao excluir estabelecimento.', error));
}

function moveCardToPhase(cardId, phaseId) {
    const card = getCard(cardId);
    if (!card || card.phaseId === phaseId) return false;
    card.phaseId = phaseId;
    card.order = countByPhase(phaseId);

    persistCard(card).catch((error) => console.warn('[onboarding] falha ao mover cartão.', error));

    return true;
}

/* ---------- unidades ---------- */

function addUnit(cardId, name) {
    const card = getCard(cardId);
    if (!card) return null;
    const unit = { id: uid('un'), name: name?.trim() || `Unidade ${card.units.length + 1}` };
    card.units.push(unit);

    establishmentsApi
        .createUnit(cardId, unit.name)
        .then((created) => {
            unit.id = created.id;
        })
        .catch((error) => console.warn('[onboarding] falha ao criar unidade.', error));

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
    Object.keys(card.cells).forEach((key) => {
        if (key.endsWith(`::${unitId}`)) delete card.cells[key];
    });

    establishmentsApi.deleteUnit(unitId).catch((error) => console.warn('[onboarding] falha ao excluir unidade.', error));
}

/* ---------- convênios ---------- */

function addConvenio(cardId, name) {
    const card = getCard(cardId);
    if (!card) return null;
    const convenio = { id: uid('cv'), name: name?.trim() || `Convênio ${card.convenios.length + 1}` };
    card.convenios.push(convenio);

    establishmentsApi
        .createConvenio(cardId, convenio.name)
        .then((created) => {
            convenio.id = created.id;
        })
        .catch((error) => console.warn('[onboarding] falha ao criar convênio.', error));

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

    establishmentsApi.deleteConvenio(convenioId).catch((error) => console.warn('[onboarding] falha ao excluir convênio.', error));
}

/* ---------- células (convênio × unidade) ---------- */

function readCell(card, convenioId, unitId) {
    return card?.cells?.[cellKey(convenioId, unitId)] ?? defaultCell();
}

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
    if (!isCellAllDone(cell)) cell.conciliado = false;
}

function setConciliado(cardId, convenioId, unitId, value) {
    const cell = ensureCell(cardId, convenioId, unitId);
    if (!cell) return;
    cell.conciliado = value ? isCellAllDone(cell) : false;
}

/* ---------- resumo p/ o tile da matriz ---------- */

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
        phases: onboardingPhases.phases,
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
        sendExistingToOnboarding,
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
        setConciliado,
        cardProgress
    };
}
