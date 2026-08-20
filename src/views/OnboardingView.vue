<script setup>
import { computed, ref } from 'vue';
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import PageHeader from '@/components/PageHeader.vue';
import OnboardingCardDialog from '@/components/OnboardingCardDialog.vue';
import { useOnboardingBoard } from '@/composables/useOnboardingBoard';
import { useEstablishments } from '@/composables/useEstablishments';
import { useKanbanDrag } from '@/composables/useKanbanDrag';
import { getKindMeta, getProjectMeta, getPersonMeta, responsavelNames } from '@/config/onboardingConfig';
import { getStageMeta } from '@/config/commercialConfig';
import OnboardingAvatar from '@/components/OnboardingAvatar.vue';
import '@/assets/onboarding.css';

const { getEstablishment } = useEstablishments();

const {
    phases,
    cards,
    addPhase,
    renamePhase,
    removePhase,
    movePhase,
    cardsByPhase,
    countByPhase,
    addCard,
    removeCard,
    cardProgress,
    moveCardToPhase
} = useOnboardingBoard();

const cardDialogVisible = ref(false);
const activeCardId = ref('');
const editingPhaseId = ref('');
const dragError = ref(null);

const totalCards = computed(() => cards.value.length);

const { draggingId, dropTargetKey, suppressClick, onPointerDown } = useKanbanDrag({
    async onMove(item, zone) {
        dragError.value = null;
        try {
            return moveCardToPhase(item.id, zone.dataset.phaseId);
        } catch (error) {
            dragError.value = error.message || 'Não foi possível mover a clínica.';
            return false;
        }
    }
});

function openCard(cardId) {
    if (suppressClick.value) {
        suppressClick.value = false;
        return;
    }
    activeCardId.value = cardId;
    cardDialogVisible.value = true;
}

function handleAddCard(phaseId) {
    const card = addCard({ phaseId });
    activeCardId.value = card.id;
    cardDialogVisible.value = true;
}

function handleAddColumn() {
    const phase = addPhase('Nova fase');
    editingPhaseId.value = phase.id;
}

function startRename(phaseId) {
    editingPhaseId.value = phaseId;
}

function finishRename(phase) {
    if (!phase.title.trim()) renamePhase(phase.id, 'Fase');
    editingPhaseId.value = '';
}

function handleRemovePhase(phase) {
    const count = countByPhase(phase.id);
    const message = count
        ? `Remover a fase "${phase.title}"? As ${count} clínica(s) serão movidas para a fase anterior.`
        : `Remover a fase "${phase.title}"?`;
    if (window.confirm(message)) removePhase(phase.id);
}

function handleRemoveCard(card) {
    if (window.confirm(`Excluir a clínica "${card.name}"? Essa ação não pode ser desfeita.`)) {
        removeCard(card.id);
    }
}

function kindMeta(kind) {
    return getKindMeta(kind);
}

function projectMeta(projectId) {
    return getProjectMeta(projectId);
}

function responsavel(card) {
    return getPersonMeta(card.responsavelId);
}

function progressOf(card) {
    return cardProgress(card);
}

/** Estágio no funil comercial (Convertido, Concluído...) — o mesmo registro visto do outro lado. */
function pipelineStage(card) {
    const stageId = getEstablishment(card.id)?.stageId;
    return stageId ? getStageMeta(stageId) : null;
}
</script>

<template>
    <VuePressLayout wide>
        <div class="home-page onboarding-page">
            <PageHeader
                eyebrow="Implantação"
                title="Onboarding de clínicas"
                subtitle="Do backlog ao go live — cada clínica com sua matriz de convênios × unidades."
            >
                <template #actions>
                    <div class="roadmap-stats roadmap-stats--inline">
                        <span class="roadmap-stat"><b>{{ totalCards }}</b> estabelecimentos</span>
                        <span class="roadmap-stat"><b>{{ phases.length }}</b> fases</span>
                    </div>
                    <Button
                        type="button"
                        icon="pi pi-plus"
                        label="Novo estabelecimento"
                        @click="handleAddCard(phases[0]?.id)"
                    />
                </template>
            </PageHeader>

            <p v-if="dragError" class="roadmap-sync-warning">{{ dragError }}</p>

            <div class="onb-board-wrap">
                <div class="onb-board">
                    <section
                        v-for="phase in phases"
                        :key="phase.id"
                        class="onb-column"
                        :class="{ 'onb-column--drop-target': dropTargetKey === phase.id }"
                    >
                        <header class="onb-column__head">
                            <h2 v-if="editingPhaseId !== phase.id" class="onb-column__title">
                                <button
                                    type="button"
                                    style="border: none; background: transparent; font: inherit; color: inherit; cursor: text; padding: 0"
                                    title="Renomear fase"
                                    @click="startRename(phase.id)"
                                >
                                    {{ phase.title }}
                                </button>
                                <span v-if="phase.hint" class="onb-column__hint">{{ phase.hint }}</span>
                            </h2>
                            <input
                                v-else
                                v-model="phase.title"
                                class="onb-column__title"
                                style="border: 1px solid var(--hub-blue); border-radius: 6px; padding: 2px 6px; font: inherit; font-weight: 700"
                                autofocus
                                @keyup.enter="finishRename(phase)"
                                @blur="finishRename(phase)"
                            />

                            <span class="onb-column__count">{{ countByPhase(phase.id) }}</span>
                            <button
                                type="button"
                                class="onb-column__menu-btn"
                                title="Mover fase para a esquerda"
                                @click="movePhase(phase.id, -1)"
                            >
                                <i class="pi pi-angle-left" />
                            </button>
                            <button
                                type="button"
                                class="onb-column__menu-btn"
                                title="Mover fase para a direita"
                                @click="movePhase(phase.id, 1)"
                            >
                                <i class="pi pi-angle-right" />
                            </button>
                            <button
                                v-if="phases.length > 1"
                                type="button"
                                class="onb-column__menu-btn"
                                title="Remover fase"
                                @click="handleRemovePhase(phase)"
                            >
                                <i class="pi pi-trash" />
                            </button>
                        </header>

                        <div
                            class="onb-column__body"
                            data-drop-zone
                            :data-zone-key="phase.id"
                            :data-phase-id="phase.id"
                        >
                            <article
                                v-for="card in cardsByPhase(phase.id)"
                                :key="card.id"
                                class="onb-card"
                                :class="{ 'onb-card--dragging': draggingId === card.id }"
                                title="Arraste para outra fase ou clique para abrir"
                                @pointerdown="onPointerDown($event, card)"
                                @click="openCard(card.id)"
                            >
                                <div class="onb-card__top">
                                    <span
                                        class="onb-card__kind"
                                        :class="{ 'onb-card__kind--hospital': card.kind === 'hospital' }"
                                    >
                                        <i :class="kindMeta(card.kind).icon" />
                                        {{ kindMeta(card.kind).label }}
                                    </span>
                                    <span v-if="pipelineStage(card)" class="onb-tag onb-tag--moat">
                                        {{ pipelineStage(card).title }}
                                    </span>
                                    <div class="onb-card__actions">
                                        <button
                                            type="button"
                                            class="onb-card__icon-btn"
                                            data-no-drag
                                            title="Abrir"
                                            @click.stop="openCard(card.id)"
                                        >
                                            <i class="pi pi-arrow-up-right" />
                                        </button>
                                        <button
                                            type="button"
                                            class="onb-card__icon-btn onb-card__icon-btn--danger"
                                            data-no-drag
                                            title="Excluir clínica"
                                            @click.stop="handleRemoveCard(card)"
                                        >
                                            <i class="pi pi-trash" />
                                        </button>
                                    </div>
                                </div>

                                <h3 class="onb-card__name">{{ card.name }}</h3>

                                <div v-if="card.projects?.length" class="onb-card__tags">
                                    <span
                                        v-for="projectId in card.projects"
                                        :key="projectId"
                                        class="onb-tag"
                                        :class="`onb-tag--${projectMeta(projectId).tone}`"
                                    >
                                        <i :class="projectMeta(projectId).icon" />
                                        {{ projectMeta(projectId).label }}
                                    </span>
                                </div>

                                <div class="onb-card__meta">
                                    <span><b>{{ card.units.length }}</b> unidades</span>
                                    <span><b>{{ card.convenios.length }}</b> convênios</span>
                                </div>

                                <div v-if="card.nextAppointment" class="onb-card__meta" style="margin-bottom: 10px">
                                    <span>
                                        <i class="pi pi-calendar" />
                                        {{ card.nextAppointment.date }} · {{ card.nextAppointment.time }}
                                        <template v-if="responsavelNames(card.nextAppointment.responsavelIds)">
                                            · {{ responsavelNames(card.nextAppointment.responsavelIds) }}
                                        </template>
                                    </span>
                                </div>

                                <div class="onb-card__progress">
                                    <span class="onb-progress-track">
                                        <span
                                            class="onb-progress-fill"
                                            :style="{ width: `${progressOf(card).pct}%` }"
                                        />
                                    </span>
                                    <span class="onb-progress-label">{{ progressOf(card).pct }}%</span>
                                </div>

                                <div class="onb-card__owner">
                                    <template v-if="responsavel(card)">
                                        <OnboardingAvatar :avatar="responsavel(card).avatar" :size="24" />
                                        <span class="onb-card__owner-name">{{ responsavel(card).name }}</span>
                                    </template>
                                    <span v-else class="onb-card__owner-empty">
                                        <i class="pi pi-user-plus" /> Sem responsável
                                    </span>
                                </div>
                            </article>

                            <button
                                type="button"
                                class="onb-add-card"
                                @click="handleAddCard(phase.id)"
                            >
                                <i class="pi pi-plus" /> Adicionar estabelecimento
                            </button>
                        </div>
                    </section>

                    <button type="button" class="onb-add-column" @click="handleAddColumn">
                        <i class="pi pi-plus" /> Nova fase
                    </button>
                </div>
            </div>

            <OnboardingCardDialog
                v-model:visible="cardDialogVisible"
                :card-id="activeCardId"
            />
        </div>
    </VuePressLayout>
</template>
