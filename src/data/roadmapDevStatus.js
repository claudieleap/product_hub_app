export const ROADMAP_DEV_STATUSES = [
    { id: 'a_fazer', label: 'A fazer', rowClass: 'dev-a-fazer', icon: 'pi pi-inbox' },
    { id: 'em_andamento', label: 'Em andamento', rowClass: 'dev-em-andamento', icon: 'pi pi-sync' },
    { id: 'concluido', label: 'Concluído', rowClass: 'dev-concluido', icon: 'pi pi-check-circle' }
];

export function getDevStatus(id) {
    return ROADMAP_DEV_STATUSES.find((status) => status.id === id) ?? null;
}
