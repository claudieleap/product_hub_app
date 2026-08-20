<script setup>
import { computed, ref } from 'vue';
import { useEstablishments } from '@/composables/useEstablishments';
import EstablishmentDataForm from '@/components/EstablishmentDataForm.vue';
import EstablishmentAppointments from '@/components/EstablishmentAppointments.vue';
import EstablishmentComments from '@/components/EstablishmentComments.vue';
import EstablishmentOnboardingPanel from '@/components/EstablishmentOnboardingPanel.vue';
import CommercialStageStepper from '@/components/CommercialStageStepper.vue';

const visible = defineModel('visible', { type: Boolean, default: false });

const props = defineProps({
    cnpj: { type: String, default: '' }
});

const emit = defineEmits(['deleted']);

const { getEstablishment, removeEstablishment, moveToStage } = useEstablishments();

const establishment = computed(() => getEstablishment(props.cnpj));

const activeTab = ref('dados');
const dataFormRef = ref(null);

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

        <Tabs v-model:value="activeTab">
            <TabList>
                <Tab value="dados">Dados</Tab>
                <Tab value="onboarding">Onboarding</Tab>
                <Tab value="agendamentos">Agendamentos</Tab>
                <Tab value="comentarios">Comentários</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="dados">
                    <EstablishmentDataForm :id="cnpj" ref="dataFormRef" hide-save-button />
                </TabPanel>
                <TabPanel value="onboarding">
                    <EstablishmentOnboardingPanel :id="cnpj" />
                </TabPanel>
                <TabPanel value="agendamentos">
                    <EstablishmentAppointments :id="cnpj" />
                </TabPanel>
                <TabPanel value="comentarios">
                    <EstablishmentComments :id="cnpj" />
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
                        @click="dataFormRef?.saveChanges()"
                    />
                </div>
            </div>
        </template>
    </Dialog>
</template>
