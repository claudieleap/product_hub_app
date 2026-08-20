<script setup>
import { computed, ref } from 'vue';
import { useOnboardingBoard } from '@/composables/useOnboardingBoard';
import { useEstablishments } from '@/composables/useEstablishments';
import EstablishmentDataForm from '@/components/EstablishmentDataForm.vue';
import EstablishmentAppointments from '@/components/EstablishmentAppointments.vue';
import EstablishmentComments from '@/components/EstablishmentComments.vue';
import EstablishmentOnboardingPanel from '@/components/EstablishmentOnboardingPanel.vue';
import CommercialStageStepper from '@/components/CommercialStageStepper.vue';
import OnboardingPhaseStepper from '@/components/OnboardingPhaseStepper.vue';

const visible = defineModel('visible', { type: Boolean, default: false });

const props = defineProps({
    cardId: { type: String, default: '' }
});

const emit = defineEmits(['deleted']);

const { getCard, removeCard, phases, moveCardToPhase } = useOnboardingBoard();

const { getEstablishment, moveToStage } = useEstablishments();

const card = computed(() => getCard(props.cardId));
const establishment = computed(() => (card.value ? getEstablishment(card.value.id) : null));

const dataFormRef = ref(null);

const stageChanging = ref(false);
const stageError = ref(null);

async function onStageChange(stageId) {
    if (!establishment.value) return;
    stageChanging.value = true;
    stageError.value = null;
    try {
        await moveToStage(establishment.value.id, stageId);
    } catch (error) {
        stageError.value = error.message || 'Não foi possível mover o estabelecimento.';
    } finally {
        stageChanging.value = false;
    }
}

function onPhaseChange(phaseId) {
    if (!card.value) return;
    moveCardToPhase(card.value.id, phaseId);
}

async function saveAndClose() {
    const ok = await dataFormRef.value?.saveChanges();
    if (ok) visible.value = false;
}

function confirmDelete() {
    if (!card.value) return;
    if (!window.confirm(`Excluir a clínica "${card.value.name}"? Essa ação não pode ser desfeita.`)) return;
    const id = card.value.id;
    removeCard(id);
    visible.value = false;
    emit('deleted', id);
}
</script>

<template>
    <Dialog
        v-model:visible="visible"
        modal
        append-to="body"
        class="onb-dialog onb-card-dialog"
        :header="card?.name ?? 'Clínica'"
        :style="{ width: 'min(1040px, 96vw)' }"
        :content-style="{ maxHeight: '74vh' }"
        :draggable="false"
    >
        <template v-if="card">
        <CommercialStageStepper
            v-if="establishment?.stageId"
            :model-value="establishment.stageId"
            :loading="stageChanging"
            @update:model-value="onStageChange"
        />
        <p v-if="stageError" style="font-size: 12px; color: var(--hub-coral, #cf4a3e); margin: -10px 0 14px">{{ stageError }}</p>

        <OnboardingPhaseStepper
            :phases="phases"
            :model-value="card.phaseId"
            @update:model-value="onPhaseChange"
        />

        <Tabs value="dados">
            <TabList>
                <Tab value="dados">Dados</Tab>
                <Tab value="agendamentos">Agendamentos</Tab>
                <Tab value="comentarios">Comentários</Tab>
                <Tab value="onboarding">Onboarding</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="dados">
                    <EstablishmentDataForm :id="card.id" ref="dataFormRef" hide-save-button />
                </TabPanel>
                <TabPanel value="agendamentos">
                    <EstablishmentAppointments :id="card.id" />
                </TabPanel>
                <TabPanel value="comentarios">
                    <EstablishmentComments :id="card.id" />
                </TabPanel>
                <TabPanel value="onboarding">
                    <EstablishmentOnboardingPanel :id="card.id" />
                </TabPanel>
            </TabPanels>
        </Tabs>
        </template>

        <template #footer>
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 10px">
                <div style="display: flex; align-items: center; gap: 10px">
                    <Button
                        label="Excluir"
                        severity="danger"
                        text
                        icon="pi pi-trash"
                        @click="confirmDelete"
                    />
                </div>

                <div style="display: flex; align-items: center; gap: 10px">
                    <span v-if="dataFormRef?.saveError" style="font-size: 12px; color: var(--hub-coral, #cf4a3e)">{{ dataFormRef.saveError }}</span>
                    <span v-else-if="dataFormRef?.isDirty" style="font-size: 12px; color: var(--hub-muted)">Alterações não salvas</span>
                    <Button
                        type="button"
                        label="Salvar alterações"
                        :loading="dataFormRef?.saving"
                        :disabled="!dataFormRef?.canSave"
                        @click="saveAndClose"
                    />
                </div>
            </div>
        </template>
    </Dialog>
</template>
