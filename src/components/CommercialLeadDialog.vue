<script setup>
import { computed, ref, watch } from 'vue';
import { useEstablishments } from '@/composables/useEstablishments';
import { useOnboardingBoard } from '@/composables/useOnboardingBoard';
import EstablishmentDataForm from '@/components/EstablishmentDataForm.vue';
import EstablishmentAppointments from '@/components/EstablishmentAppointments.vue';
import EstablishmentComments from '@/components/EstablishmentComments.vue';
import EstablishmentOnboardingPanel from '@/components/EstablishmentOnboardingPanel.vue';
import CommercialStageStepper from '@/components/CommercialStageStepper.vue';
import OnboardingPhaseStepper from '@/components/OnboardingPhaseStepper.vue';

const visible = defineModel('visible', { type: Boolean, default: false });

const props = defineProps({
    cnpj: { type: String, default: '' }
});

const emit = defineEmits(['deleted']);

const { getEstablishment, removeEstablishment, moveToStage } = useEstablishments();
const { phases: onboardingPhases, moveCardToPhase } = useOnboardingBoard();

const establishment = computed(() => getEstablishment(props.cnpj));

/** "Convertido" ou "Concluído" — só a partir daí o board de Onboarding passa a valer pro lead. */
const isConverted = computed(() => ['onboardado_fremium', 'concluido'].includes(establishment.value?.stageId));

function onPhaseChange(phaseId) {
    if (!establishment.value) return;
    moveCardToPhase(establishment.value.id, phaseId);
}

const activeTab = ref('dados');
const dataFormRef = ref(null);

watch(isConverted, (converted) => {
    if (!converted && activeTab.value === 'onboarding') activeTab.value = 'dados';
});

const deleting = ref(false);
const deleteError = ref(null);

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

async function saveAndClose() {
    const ok = await dataFormRef.value?.saveChanges();
    if (ok) visible.value = false;
}

async function confirmDelete() {
    if (!establishment.value) return;
    const name = establishment.value.fantasia || establishment.value.razaoSocial || 'este estabelecimento';
    if (!window.confirm(`Excluir "${name}"? Essa ação não pode ser desfeita.`)) return;

    deleting.value = true;
    deleteError.value = null;
    const id = establishment.value.id;

    try {
        await removeEstablishment(id);
        visible.value = false;
        emit('deleted', id);
    } catch (error) {
        deleteError.value = error.message || 'Não foi possível excluir o estabelecimento.';
    } finally {
        deleting.value = false;
    }
}
</script>

<template>
    <Dialog
        v-model:visible="visible"
        modal
        append-to="body"
        class="com-dialog"
        :header="establishment?.fantasia || establishment?.razaoSocial || 'Estabelecimento'"
        :style="{ width: 'min(960px, 96vw)' }"
        :content-style="{ maxHeight: '78vh' }"
        :draggable="false"
    >
        <CommercialStageStepper
            v-if="establishment?.stageId"
            :model-value="establishment.stageId"
            :loading="stageChanging"
            @update:model-value="onStageChange"
        />
        <p v-if="stageError" style="font-size: 12px; color: var(--hub-coral, #cf4a3e); margin: -10px 0 14px">{{ stageError }}</p>

        <OnboardingPhaseStepper
            v-if="establishment?.onboardingPhaseId"
            :phases="onboardingPhases"
            :model-value="establishment.onboardingPhaseId"
            @update:model-value="onPhaseChange"
        />

        <Tabs v-model:value="activeTab">
            <TabList>
                <Tab value="dados">Dados</Tab>
                <Tab value="agendamentos">Agendamentos</Tab>
                <Tab value="comentarios">Comentários</Tab>
                <Tab v-if="isConverted" value="onboarding">Onboarding</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="dados">
                    <EstablishmentDataForm :id="cnpj" ref="dataFormRef" hide-save-button />
                </TabPanel>
                <TabPanel value="agendamentos">
                    <EstablishmentAppointments :id="cnpj" />
                </TabPanel>
                <TabPanel value="comentarios">
                    <EstablishmentComments :id="cnpj" />
                </TabPanel>
                <TabPanel v-if="isConverted" value="onboarding">
                    <EstablishmentOnboardingPanel :id="cnpj" />
                </TabPanel>
            </TabPanels>
        </Tabs>

        <template #footer>
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 10px">
                <div style="display: flex; align-items: center; gap: 10px">
                    <Button
                        label="Excluir"
                        severity="danger"
                        text
                        icon="pi pi-trash"
                        :loading="deleting"
                        @click="confirmDelete"
                    />
                    <span v-if="deleteError" style="font-size: 12px; color: var(--hub-coral, #cf4a3e)">{{ deleteError }}</span>
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
