export const BACKLOG_PRIORITY_ID = 'backlog';

export const MATRIX_PRIORITIES = [
    { id: 'alta', label: 'Alta', rowClass: 'priority-alta' },
    { id: 'media', label: 'Média', rowClass: 'priority-media' },
    { id: 'baixa', label: 'Baixa', rowClass: 'priority-baixa' },
    { id: 'perfumaria', label: 'Perfumaria', rowClass: 'priority-perfumaria' }
];

/** Colunas da matriz (sem backlog). */
export const ROADMAP_PRIORITIES = MATRIX_PRIORITIES;

export const BACKLOG_PRIORITY = {
    id: BACKLOG_PRIORITY_ID,
    label: 'Backlog',
    rowClass: 'priority-backlog'
};

export function isBacklogPriority(priority) {
    return priority === BACKLOG_PRIORITY_ID;
}

export function isMatrixPriority(priority) {
    return MATRIX_PRIORITIES.some((entry) => entry.id === priority);
}

export const ROADMAP_PRODUCTS = [
    {
        id: 'cadastro',
        title: 'Cadastro',
        icon: 'pi pi-users',
        accent: '#1e4fe0',
        description:
            'O cadastro é o ponto de partida para usar a Aleevia. Ele define perfis de acesso, garante segurança e estrutura a base de dados da clínica ou profissional.'
    },
    {
        id: 'etapas-iniciais',
        title: 'Etapas Iniciais',
        icon: 'pi pi-flag',
        accent: '#0e9e92',
        description:
            'As etapas iniciais guiam o usuário na configuração da plataforma. Esse processo acelera a implantação e garante que todas as informações essenciais estejam completas desde o início.'
    },
    {
        id: 'faturamento',
        title: 'Faturamento',
        icon: 'pi pi-file-export',
        accent: '#6e47c9',
        description:
            'O faturamento organiza e estrutura as guias enviadas para as operadoras. Ele garante rastreabilidade, conformidade com o padrão TISS e prepara os dados para recebimento e conciliação.'
    },
    {
        id: 'recebimento',
        title: 'Recebimento',
        icon: 'pi pi-wallet',
        accent: '#168a5a',
        description:
            'O recebimento centraliza os retornos das operadoras em diferentes formatos. O sistema transforma essas informações em dados estruturados para acompanhamento financeiro e operacional.'
    },
    {
        id: 'conciliacao',
        title: 'Conciliação',
        icon: 'pi pi-sync',
        accent: '#1e4fe0',
        description:
            'A conciliação cruza automaticamente o que foi faturado, analisado e pago pelas operadoras. Isso reduz retrabalho, identifica divergências e oferece visibilidade completa da receita.'
    },
    {
        id: 'glosas',
        title: 'Glosas',
        icon: 'pi pi-exclamation-circle',
        accent: '#cf4a3e',
        description:
            'O módulo de glosas identifica valores recusados ou ajustados pelas operadoras e seus respectivos motivos. Com análises inteligentes, ajuda a recuperar receita e reduzir perdas recorrentes.'
    },
    {
        id: 'antecipacao',
        title: 'Antecipação',
        icon: 'pi pi-bolt',
        accent: '#c8841a',
        description:
            'A antecipação transforma recebíveis futuros em caixa imediato para clínicas e médicos. Integrada à conciliação, ela oferece liquidez com segurança, transparência e controle financeiro.'
    },
    {
        id: 'portal-medico',
        title: 'Portal do Médico',
        icon: 'pi pi-id-card',
        accent: '#0e9e92',
        description:
            'O Portal do Médico oferece visibilidade sobre produção, recebimentos, repasses e antecipações. A experiência foi criada para dar autonomia ao profissional e fortalecer sua relação com a clínica.'
    },
    {
        id: 'ia-financeira',
        title: 'IA Financeira',
        icon: 'pi pi-sparkles',
        accent: '#6e47c9',
        description:
            'A IA Financeira analisa os dados da operação e transforma informações em recomendações práticas. Ela identifica riscos, oportunidades e tendências para apoiar decisões financeiras mais inteligentes.'
    }
];
