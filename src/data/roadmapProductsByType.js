import { ROADMAP_PRODUCTS } from '@/data/roadmapProducts';
import { parseRoadmapType } from '@/config/roadmapTypes';

export const ROADMAP_PRODUCTS_INTERNO = [
    {
        id: 'infraestrutura',
        title: 'Infraestrutura',
        icon: 'pi pi-server',
        accent: '#1e4fe0',
        description: 'Ambientes, deploy, observabilidade e confiabilidade dos sistemas internos.'
    },
    {
        id: 'ferramentas',
        title: 'Ferramentas',
        icon: 'pi pi-wrench',
        accent: '#6e47c9',
        description: 'Ferramentas internas para produto, engenharia, suporte e operações.'
    },
    {
        id: 'processos',
        title: 'Processos',
        icon: 'pi pi-sitemap',
        accent: '#0e9e92',
        description: 'Padronização de fluxos, SLAs internos e melhoria contínua entre áreas.'
    },
    {
        id: 'automacao',
        title: 'Automação',
        icon: 'pi pi-bolt',
        accent: '#c8841a',
        description: 'Automações, integrações e redução de trabalho manual da equipe.'
    },
    {
        id: 'dados',
        title: 'Dados & BI',
        icon: 'pi pi-chart-bar',
        accent: '#168a5a',
        description: 'Indicadores internos, relatórios e governança de dados.'
    }
];

export const ROADMAP_PRODUCTS_BPO = [
    {
        id: 'operacional',
        title: 'Operacional',
        icon: 'pi pi-cog',
        accent: '#0e9e92',
        description: 'Rotinas diárias do BPO, filas de trabalho e produtividade da operação.'
    },
    {
        id: 'faturamento-bpo',
        title: 'Faturamento',
        icon: 'pi pi-file-export',
        accent: '#6e47c9',
        description: 'Envio, conferência e acompanhamento de guias para operadoras.'
    },
    {
        id: 'conciliacao-bpo',
        title: 'Conciliação',
        icon: 'pi pi-sync',
        accent: '#1e4fe0',
        description: 'Cruzamento de faturado, analisado e pago para clientes do BPO.'
    },
    {
        id: 'glosas-bpo',
        title: 'Glosas',
        icon: 'pi pi-exclamation-circle',
        accent: '#cf4a3e',
        description: 'Identificação, análise e recuperação de glosas para contas geridas.'
    },
    {
        id: 'relacionamento',
        title: 'Relacionamento',
        icon: 'pi pi-users',
        accent: '#168a5a',
        description: 'Comunicação com clientes, entregas, relatórios e satisfação.'
    },
    {
        id: 'qualidade',
        title: 'Qualidade',
        icon: 'pi pi-shield',
        accent: '#c8841a',
        description: 'Auditorias, conformidade TISS e melhoria da entrega do serviço.'
    }
];

export const ROADMAP_PRODUCTS_BY_TYPE = {
    saas: ROADMAP_PRODUCTS,
    interno: ROADMAP_PRODUCTS_INTERNO,
    bpo: ROADMAP_PRODUCTS_BPO
};

export function getRoadmapProducts(type) {
    return ROADMAP_PRODUCTS_BY_TYPE[parseRoadmapType(type)] ?? ROADMAP_PRODUCTS;
}
