/**
 * Configuração do módulo de Onboarding de clínicas/hospitais.
 *
 * Um board (kanban) com fases (colunas). Cada card é uma clínica ou hospital
 * em processo de implantação e carrega uma matriz Convênios × Unidades.
 * Cada célula tem: ativo/inativo, portal/fora (login+senha ou detalhe) e
 * três operações (Faturamento, DP, DC) com status semáforo + descrição.
 */

export const ONBOARDING_STORAGE_KEY = 'product-hub-onboarding-v3';
export const ONBOARDING_PATH = '/onboarding';

export function onboardingPath() {
    return ONBOARDING_PATH;
}

/** Tipo de estabelecimento. */
export const ONBOARDING_KINDS = [
    { id: 'clinica', label: 'Clínica', icon: 'pi pi-heart' },
    { id: 'hospital', label: 'Hospital', icon: 'pi pi-building' }
];

/** Projeto ao qual a clínica pertence — pode ser SaaS, BPO ou os dois. */
export const ONBOARDING_PROJECTS = [
    { id: 'saas', label: 'SaaS', tone: 'moat', icon: 'pi pi-cloud' },
    { id: 'bpo', label: 'BPO', tone: 'teal', icon: 'pi pi-briefcase' }
];

export function getProjectMeta(id) {
    return ONBOARDING_PROJECTS.find((project) => project.id === id) ?? ONBOARDING_PROJECTS[0];
}

/**
 * Time e responsáveis. Cada pessoa tem um avatar "carinha" desenhado por
 * features (ver OnboardingAvatar.vue) — nada de imagem externa (CSP/offline).
 * bg: fundo do avatar (tom do projeto). skin/hair: cores. flags de estilo.
 */
const SAAS_BG = '#ece7fb';
const BPO_BG = '#d9f2ee';

export const ONBOARDING_PEOPLE = [
    // BPO
    { id: 'mike', name: 'Mike', project: 'bpo', avatar: { bg: BPO_BG, skin: '#e0b088', hair: '#2b2b2b', hairStyle: 'short', chubby: true } },
    { id: 'diego', name: 'Diego', project: 'bpo', avatar: { bg: BPO_BG, skin: '#d29b6e', hair: '#4a3222', hairStyle: 'short' } },
    { id: 'carlinhos', name: 'Carlinhos', project: 'bpo', avatar: { bg: BPO_BG, skin: '#c68a5b', hair: '#2b2b2b', hairStyle: 'buzz' } },
    { id: 'matheus', name: 'Matheus', project: 'bpo', avatar: { bg: BPO_BG, skin: '#f0c8a0', hair: '#6b4a2f', hairStyle: 'short' } },
    // SaaS
    { id: 'pedro', name: 'Pedro', project: 'saas', avatar: { bg: SAAS_BG, skin: '#f0c8a0', hair: '#4a3222', hairStyle: 'short', chubby: true, goatee: true } },
    { id: 'clau', name: 'Clau', project: 'saas', avatar: { bg: SAAS_BG, skin: '#f0c8a0', hair: '#6b4a2f', hairStyle: 'long', glasses: true } },
    { id: 'wendel', name: 'Wendel', project: 'saas', avatar: { bg: SAAS_BG, skin: '#d29b6e', hair: '#2b2b2b', hairStyle: 'short', goatee: true } },
    { id: 'thiago', name: 'Thiago', project: 'saas', avatar: { bg: SAAS_BG, skin: '#c68a5b', hair: '#2b2b2b', hairStyle: 'short' } },
    { id: 'regina', name: 'Regina', project: 'saas', avatar: { bg: SAAS_BG, skin: '#f0c8a0', hair: '#7a4a2a', hairStyle: 'long' } }
];

export function getPersonMeta(id) {
    return ONBOARDING_PEOPLE.find((person) => person.id === id) ?? null;
}

/** Nomes dos responsáveis de um agendamento (array de ids), prontos pra exibir. */
export function responsavelNames(ids) {
    return (ids ?? []).map((id) => getPersonMeta(id)?.name).filter(Boolean).join(', ');
}

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
