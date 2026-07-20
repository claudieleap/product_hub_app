/**
 * Configuração do módulo de Onboarding de clínicas/hospitais.
 *
 * Um board (kanban) com fases (colunas). Cada card é uma clínica ou hospital
 * em processo de implantação e carrega uma matriz Convênios × Unidades.
 * Cada célula tem: ativo/inativo, portal/fora (login+senha ou detalhe) e
 * três operações (Faturamento, DP, DC) com status semáforo + descrição.
 */

export const ONBOARDING_STORAGE_KEY = 'product-hub-onboarding-v1';
export const ONBOARDING_PATH = '/onboarding';

export function onboardingPath() {
    return ONBOARDING_PATH;
}

/** Tipo de estabelecimento. */
export const ONBOARDING_KINDS = [
    { id: 'clinica', label: 'Clínica', icon: 'pi pi-heart' },
    { id: 'hospital', label: 'Hospital', icon: 'pi pi-building' }
];

/** Fases padrão do board — o usuário pode renomear, reordenar e criar novas. */
export const DEFAULT_ONBOARDING_PHASES = [
    { id: 'backlog', title: 'Backlog', hint: 'A implantar' },
    { id: 'onboarding', title: 'Onboarding', hint: 'Em implantação' },
    { id: 'golive', title: 'Go live', hint: 'Ongoing' }
];

/** As três operações fixas de cada célula da matriz. */
export const ONBOARDING_OPERATIONS = [
    { id: 'fat', short: 'FAT', label: 'Faturamento' },
    { id: 'dp', short: 'DP', label: 'DP' },
    { id: 'dc', short: 'DC', label: 'DC' }
];

/** Semáforo de status de cada operação. */
export const ONBOARDING_STATUSES = [
    { id: 'pendente', label: 'Pendente', tone: 'red' },
    { id: 'parcial', label: 'Fazendo / parcial', tone: 'amber' },
    { id: 'feito', label: 'Feito', tone: 'green' }
];

export const DEFAULT_STATUS = 'pendente';

/** Como a conciliação/operação é feita naquela célula. */
export const ONBOARDING_MODES = [
    { id: 'portal', label: 'Portal', icon: 'pi pi-globe' },
    { id: 'fora', label: 'Fora', icon: 'pi pi-external-link' }
];

export const DEFAULT_MODE = 'portal';

export function getStatusMeta(id) {
    return ONBOARDING_STATUSES.find((status) => status.id === id) ?? ONBOARDING_STATUSES[0];
}

export function getOperationMeta(id) {
    return ONBOARDING_OPERATIONS.find((op) => op.id === id) ?? ONBOARDING_OPERATIONS[0];
}

export function getKindMeta(id) {
    return ONBOARDING_KINDS.find((kind) => kind.id === id) ?? ONBOARDING_KINDS[0];
}

/** Chave estável de uma célula (convênio × unidade). */
export function cellKey(convenioId, unitId) {
    return `${convenioId}::${unitId}`;
}
