import { DEFAULT_ONBOARDING_PHASES, cellKey } from '@/config/onboardingConfig';

/**
 * Board inicial com as clínicas reais (quadro físico de onboarding).
 * Cotrel (go live) vem com a matriz preenchida como exemplo de status;
 * as demais entram só com nome/tipo para o time configurar.
 */

function op(status) {
    return { status, descricao: '' };
}

function cell(ativo, modo, ops) {
    return {
        ativo,
        modo,
        portalLogin: '',
        portalSenha: '',
        detalhe: '',
        ops
    };
}

function makeCard({ id, phaseId, order, name, kind, projects = ['bpo'], units = [], convenios = [], cells = {} }) {
    return {
        id,
        phaseId,
        order,
        name,
        kind,
        projects,
        notes: '',
        units,
        convenios,
        cells,
        createdAt: '2026-07-20T12:00:00.000Z'
    };
}

/* Cotrel — go live, matriz de exemplo com cores variadas. */
const cotrelUnits = [
    { id: 'un-1', name: 'Unidade 1' },
    { id: 'un-2', name: 'Unidade 2' }
];
const cotrelConvenios = [
    { id: 'cv-unimed', name: 'Unimed' },
    { id: 'cv-bradesco', name: 'Bradesco Saúde' },
    { id: 'cv-sulamerica', name: 'SulAmérica' }
];
const cotrelCells = {
    [cellKey('cv-unimed', 'un-1')]: cell(true, 'portal', {
        fat: op('feito'),
        dp: op('feito'),
        dc: op('parcial')
    }),
    [cellKey('cv-unimed', 'un-2')]: cell(true, 'portal', {
        fat: op('feito'),
        dp: op('parcial'),
        dc: op('pendente')
    }),
    [cellKey('cv-bradesco', 'un-1')]: cell(true, 'fora', {
        fat: op('feito'),
        dp: op('feito'),
        dc: op('feito')
    }),
    [cellKey('cv-sulamerica', 'un-1')]: cell(true, 'portal', {
        fat: op('parcial'),
        dp: op('pendente'),
        dc: op('pendente')
    })
};

export function createOnboardingSeed() {
    return {
        phases: DEFAULT_ONBOARDING_PHASES.map((phase) => ({ ...phase })),
        cards: [
            // Backlog
            makeCard({ id: 'onb-ortodoc', phaseId: 'backlog', order: 0, name: 'Ortodoc', kind: 'clinica', projects: ['saas'] }),
            makeCard({ id: 'onb-cian', phaseId: 'backlog', order: 1, name: 'Cian', kind: 'clinica', projects: ['bpo'] }),

            // Onboarding
            makeCard({ id: 'onb-pronto-baby', phaseId: 'onboarding', order: 0, name: 'Pronto Baby', kind: 'clinica', projects: ['bpo'] }),
            makeCard({ id: 'onb-dimeg', phaseId: 'onboarding', order: 1, name: 'Dimeg', kind: 'clinica', projects: ['saas'] }),
            makeCard({ id: 'onb-santa-casa-cruzeiro', phaseId: 'onboarding', order: 2, name: 'Santa Casa Cruzeiro', kind: 'hospital', projects: ['bpo'] }),
            makeCard({ id: 'onb-santa-casa-ourinhos', phaseId: 'onboarding', order: 3, name: 'Santa Casa Ourinhos', kind: 'hospital', projects: ['bpo'] }),
            makeCard({ id: 'onb-inep', phaseId: 'onboarding', order: 4, name: 'INEP', kind: 'clinica', projects: ['saas', 'bpo'] }),
            makeCard({ id: 'onb-hoc', phaseId: 'onboarding', order: 5, name: 'HOC Oswaldo Cruz', kind: 'hospital', projects: ['bpo'] }),
            makeCard({ id: 'onb-rm', phaseId: 'onboarding', order: 6, name: 'RM', kind: 'clinica', projects: ['saas'] }),

            // Go live
            makeCard({
                id: 'onb-cotrel',
                phaseId: 'golive',
                order: 0,
                name: 'Cotrel',
                kind: 'clinica',
                projects: ['saas', 'bpo'],
                units: cotrelUnits,
                convenios: cotrelConvenios,
                cells: cotrelCells
            })
        ]
    };
}
