import { DEFAULT_ONBOARDING_PHASES, cellKey } from '@/config/onboardingConfig';

/**
 * Board inicial de exemplo — espelha o rascunho: uma clínica com 2 unidades e
 * 3 convênios, com a célula Convênio 1 × Unidade 1 preenchida (ativa, portal,
 * FAT feito / DP pendente / DC pendente).
 *
 * Serve como demonstração; o usuário pode editar ou remover.
 */
export function createOnboardingSeed() {
    const units = [
        { id: 'un-1', name: 'Unidade 1' },
        { id: 'un-2', name: 'Unidade 2' }
    ];
    const convenios = [
        { id: 'cv-1', name: 'Convênio 1' },
        { id: 'cv-2', name: 'Convênio 2' },
        { id: 'cv-3', name: 'Convênio 3' }
    ];

    const cells = {
        [cellKey('cv-1', 'un-1')]: {
            ativo: true,
            modo: 'portal',
            portalLogin: '',
            portalSenha: '',
            detalhe: '',
            ops: {
                fat: { status: 'feito', descricao: '' },
                dp: { status: 'pendente', descricao: '' },
                dc: { status: 'pendente', descricao: '' }
            }
        }
    };

    return {
        phases: DEFAULT_ONBOARDING_PHASES.map((phase) => ({ ...phase })),
        cards: [
            {
                id: 'onb-exemplo',
                phaseId: 'onboarding',
                order: 0,
                name: 'Clínica Exemplo',
                kind: 'clinica',
                notes: '',
                units,
                convenios,
                cells,
                createdAt: '2026-07-20T12:00:00.000Z'
            }
        ]
    };
}
