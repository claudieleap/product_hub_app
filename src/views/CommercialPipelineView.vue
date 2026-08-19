<script setup>
import { computed, ref } from 'vue';
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import PageHeader from '@/components/PageHeader.vue';
import CommercialLeadDialog from '@/components/CommercialLeadDialog.vue';
import { useEstablishments } from '@/composables/useEstablishments';
import { useOnboardingPhases } from '@/composables/useOnboardingPhases';
import { useKanbanDrag } from '@/composables/useKanbanDrag';
import { useAuth } from '@/composables/useAuth';
import { establishmentsApi } from '@/api/establishmentsClient';
import { COMMERCIAL_STAGES } from '@/config/commercialConfig';
import { getKindMeta, getProjectMeta, getPersonMeta } from '@/config/onboardingConfig';
import '@/assets/commercial.css';

const { establishments, pipelineEstablishments, isHydrated, loadError, cities, specialties, moveToStage, updateFields, createEstablishment } =
    useEstablishments();
const { phases: onboardingPhases } = useOnboardingPhases();
const { isAdmin } = useAuth();

const cityFilter = ref([]);
const specialtyFilter = ref([]);
const dragError = ref(null);
const dialogVisible = ref(false);
const activeCnpj = ref('');
const creating = ref(false);
const importInput = ref(null);
const importing = ref(false);
const importMessage = ref(null);
const importError = ref(null);

const CONVERTED_STAGE = 'onboardado_fremium';

const filteredLeads = computed(() =>
    pipelineEstablishments.value.filter((lead) => {
        if (cityFilter.value.length && !cityFilter.value.includes(lead.municipio)) return false;
        if (specialtyFilter.value.length && !lead.especialidades.some((esp) => specialtyFilter.value.includes(esp))) {
            return false;
        }
        return true;
    })
);

function leadsByStage(stageId) {
    return filteredLeads.value.filter((lead) => lead.stageId === stageId);
}

const { draggingId, dropTargetKey, suppressClick, onPointerDown } = useKanbanDrag({
    async onMove(item, zone) {
        dragError.value = null;
        try {
            return await moveToStage(item.id, zone.dataset.stageId);
        } catch (error) {
            dragError.value = error.message || 'Não foi possível mover o estabelecimento.';
            return false;
        }
    }
});

function openLead(id) {
    if (suppressClick.value) {
        suppressClick.value = false;
        return;
    }
    activeCnpj.value = id;
    dialogVisible.value = true;
}

function visibleTags(lead) {
    return lead.especialidades.slice(0, 2);
}

function extraTagsCount(lead) {
    return Math.max(lead.especialidades.length - 2, 0);
}

function responsavelNames(ids) {
    return (ids ?? []).map((id) => getPersonMeta(id)?.name).filter(Boolean).join(', ');
}

async function handleNewLead() {
    creating.value = true;
    try {
        const created = await createEstablishment({ razaoSocial: 'Novo lead', stageId: 'inbox', orderIndex: 0 });
        openLead(created.id);
    } catch (error) {
        dragError.value = error.message || 'Não foi possível criar o lead.';
    } finally {
        creating.value = false;
    }
}

async function sendToOnboarding(lead) {
    const phaseId = onboardingPhases.value[0]?.id ?? 'backlog';
    try {
        await updateFields(lead.id, { onboardingPhaseId: phaseId, onboardingOrderIndex: 0 });
    } catch (error) {
        dragError.value = error.message || 'Não foi possível enviar para o onboarding.';
    }
}

function triggerImport() {
    importInput.value?.click();
}

async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    importing.value = true;
    importError.value = null;
    importMessage.value = null;

    try {
        const result = await establishmentsApi.import(file);
        importMessage.value = `${result.imported} novos, ${result.skipped} já existentes.`;
        const data = await establishmentsApi.list();
        establishments.value = data.map((e) => ({ ...e, especialidades: e.especialidades ?? [], projects: e.projects ?? [] }));
    } catch (error) {
        importError.value = error.message || 'Falha ao importar a planilha.';
    } finally {
        importing.value = false;
    }
}
</script>

<template>
    <VuePressLayout wide>
        <div class="home-page commercial-page commercial-page--board">
            <PageHeader
                eyebrow="Comercial"
                title="Pipeline comercial"
                subtitle="Estabelecimentos em prospecção — de Leads à proposta apresentada."
            >
                <template #actions>
                    <div class="roadmap-stats roadmap-stats--inline">
                        <span class="roadmap-stat"><b>{{ filteredLeads.length }}</b> de {{ pipelineEstablishments.length }} estabelecimentos</span>
                    </div>
                    <Button
                        v-if="isAdmin"
                        type="button"
                        severity="secondary"
                        icon="pi pi-upload"
                        label="Importar planilha"
                        :loading="importing"
                        @click="triggerImport"
                    />
                    <input ref="importInput" type="file" accept=".xlsx,.xls" style="display: none" @change="handleImportFile" />
                    <Button type="button" icon="pi pi-plus" label="Novo Lead" :loading="creating" @click="handleNewLead" />
                </template>
            </PageHeader>

            <p v-if="loadError" class="roadmap-sync-warning">{{ loadError }}</p>
            <p v-if="dragError" class="roadmap-sync-warning">{{ dragError }}</p>
            <p v-if="importMessage" class="roadmap-sync-warning" style="color: var(--hub-green)">Importação concluída: {{ importMessage }}</p>
            <p v-if="importError" class="roadmap-sync-warning">{{ importError }}</p>

            <div class="com-filters">
                <MultiSelect
                    v-model="cityFilter"
                    :options="cities"
                    display="chip"
                    filter
                    placeholder="Todas as cidades"
                    class="com-filters__select"
                />
                <MultiSelect
                    v-model="specialtyFilter"
                    :options="specialties"
                    display="chip"
                    filter
                    placeholder="Todas as especialidades"
                    class="com-filters__select"
                />
                <span class="com-filters__count" v-if="!isHydrated">Carregando...</span>
            </div>

            <div class="com-board-wrap">
                <div class="com-board">
                    <section
                        v-for="stage in COMMERCIAL_STAGES"
                        :key="stage.id"
                        class="com-column"
                        :class="{ 'com-column--drop-target': dropTargetKey === stage.id }"
                    >
                        <header class="com-column__head">
                            <h2 class="com-column__title">{{ stage.title }}</h2>
                            <span class="com-column__count">{{ leadsByStage(stage.id).length }}</span>
                        </header>

                        <div
                            class="com-column__body"
                            data-drop-zone
                            :data-zone-key="stage.id"
                            :data-stage-id="stage.id"
                        >
                            <p v-if="isHydrated && !leadsByStage(stage.id).length" class="com-column__empty">
                                Nenhum estabelecimento aqui.
                            </p>

                            <article
                                v-for="lead in leadsByStage(stage.id)"
                                :key="lead.id"
                                class="com-card"
                                :class="{ 'com-card--dragging': draggingId === lead.id }"
                                title="Arraste para outra fase ou clique para abrir"
                                @pointerdown="onPointerDown($event, lead)"
                                @click="openLead(lead.id)"
                            >
                                <div class="com-card__top">
                                    <span v-if="lead.classificacao" class="com-card__classificacao">{{ lead.classificacao }}</span>
                                    <span class="com-card__city"><i class="pi pi-map-marker" />{{ lead.municipio }}</span>
                                </div>

                                <h3 class="com-card__name">{{ lead.fantasia || lead.razaoSocial }}</h3>

                                <div class="com-card__tags">
                                    <span class="com-tag com-tag--kind" :class="{ 'com-tag--kind-hospital': lead.kind === 'hospital' }">
                                        <i :class="getKindMeta(lead.kind).icon" /> {{ getKindMeta(lead.kind).label }}
                                    </span>
                                    <span v-for="projectId in lead.projects" :key="projectId" class="com-tag">
                                        {{ getProjectMeta(projectId).label }}
                                    </span>
                                    <span v-for="esp in visibleTags(lead)" :key="esp" class="com-tag">{{ esp }}</span>
                                    <span v-if="extraTagsCount(lead)" class="com-tag com-tag--more">+{{ extraTagsCount(lead) }}</span>
                                </div>

                                <div class="com-card__meta">
                                    <span v-if="lead.telefone"><i class="pi pi-phone" />{{ lead.ddd ? `(${lead.ddd}) ` : '' }}{{ lead.telefone }}</span>
                                    <span v-if="lead.email"><i class="pi pi-envelope" />{{ lead.email }}</span>
                                    <span v-if="lead.nextAppointment">
                                        <i class="pi pi-calendar" />
                                        {{ lead.nextAppointment.date }} · {{ lead.nextAppointment.time }}
                                        <template v-if="responsavelNames(lead.nextAppointment.responsavelIds)">
                                            · {{ responsavelNames(lead.nextAppointment.responsavelIds) }}
                                        </template>
                                    </span>
                                </div>

                                <div v-if="lead.observacao" class="com-card__obs">
                                    <i class="pi pi-comment" />
                                    <span>{{ lead.observacao }}</span>
                                </div>

                                <button
                                    v-if="lead.stageId === CONVERTED_STAGE"
                                    type="button"
                                    class="com-chip-add"
                                    data-no-drag
                                    style="margin-top: 10px; width: 100%; justify-content: center"
                                    @click.stop="sendToOnboarding(lead)"
                                >
                                    <i class="pi pi-arrow-right" /> Enviar para onboarding
                                </button>
                            </article>
                        </div>
                    </section>
                </div>
            </div>

            <CommercialLeadDialog v-model:visible="dialogVisible" :cnpj="activeCnpj" />
        </div>
    </VuePressLayout>
</template>
