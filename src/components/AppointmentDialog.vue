<script setup>
import { computed, ref, watch } from 'vue';
import { useEstablishments } from '@/composables/useEstablishments';
import { establishmentsApi } from '@/api/establishmentsClient';
import { ONBOARDING_PEOPLE } from '@/config/onboardingConfig';
import OnboardingAvatar from '@/components/OnboardingAvatar.vue';
import '@/assets/commercial.css';
import '@/assets/onboarding.css';

const visible = defineModel('visible', { type: Boolean, default: false });

const props = defineProps({
    defaultDate: { type: String, default: '' },
    /** Quando setado, o dialog abre em modo edição carregando os dados desse agendamento. */
    appointment: { type: Object, default: null }
});

const emit = defineEmits(['created', 'updated']);

const { establishments, createAppointment } = useEstablishments();

const isEditing = computed(() => Boolean(props.appointment));

const establishmentQuery = ref('');
const establishmentSuggestions = ref([]);
const selectedEstablishment = ref(null);
const date = ref('');
const time = ref('09:00');
const modality = ref('presencial');
const location = ref('');
const paymentLink = ref('');
const responsavelIds = ref([]);
const saving = ref(false);
const error = ref(null);

const people = ONBOARDING_PEOPLE;
const MODALITIES = [
    { id: 'presencial', label: 'Presencial', icon: 'pi pi-map-marker' },
    { id: 'online', label: 'Online', icon: 'pi pi-video' }
];

function personName(id) {
    return people.find((p) => p.id === id)?.name ?? id;
}

watch(visible, (open) => {
    if (!open) return;
    error.value = null;

    if (props.appointment) {
        const appt = props.appointment;
        selectedEstablishment.value = establishments.value.find((e) => e.id === appt.establishmentId) ?? {
            id: appt.establishmentId,
            fantasia: appt.establishmentName,
            razaoSocial: appt.establishmentName
        };
        establishmentQuery.value = appt.establishmentName || '';
        date.value = appt.date || '';
        time.value = appt.time || '09:00';
        modality.value = appt.modality || 'presencial';
        location.value = appt.location || '';
        paymentLink.value = appt.paymentLink || '';
        responsavelIds.value = [...(appt.responsavelIds ?? [])];
        return;
    }

    date.value = props.defaultDate || new Date().toISOString().slice(0, 10);
    time.value = '09:00';
    modality.value = 'presencial';
    location.value = '';
    paymentLink.value = '';
    responsavelIds.value = [];
    selectedEstablishment.value = null;
    establishmentQuery.value = '';
});

function searchEstablishments(event) {
    const query = event.query.trim().toLowerCase();
    const pool = establishments.value;
    establishmentSuggestions.value = (
        query
            ? pool.filter((item) => (item.fantasia || item.razaoSocial || '').toLowerCase().includes(query))
            : pool.slice(0, 20)
    ).slice(0, 20);
}

function selectEstablishment(event) {
    selectedEstablishment.value = event.value;
}

const canSubmit = computed(() => Boolean(selectedEstablishment.value?.id && date.value && time.value));

async function submit() {
    if (!canSubmit.value) return;
    saving.value = true;
    error.value = null;

    const payload = {
        date: date.value,
        time: time.value,
        modality: modality.value,
        location: modality.value === 'presencial' ? location.value.trim() : null,
        paymentLink: modality.value === 'online' ? paymentLink.value.trim() : null,
        responsavelIds: responsavelIds.value
    };

    try {
        if (isEditing.value) {
            await establishmentsApi.updateAppointment(selectedEstablishment.value.id, props.appointment.id, payload);
            emit('updated');
        } else {
            await createAppointment(selectedEstablishment.value.id, payload);
            emit('created');
        }
        visible.value = false;
    } catch (err) {
        error.value = err.message || 'Não foi possível salvar o agendamento.';
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <Dialog
        v-model:visible="visible"
        modal
        append-to="body"
        class="com-dialog"
        :header="isEditing ? 'Editar agendamento' : 'Novo agendamento'"
        :style="{ width: 'min(480px, 96vw)' }"
        :draggable="false"
    >
        <div class="com-field" style="margin-bottom: 14px">
            <label>Estabelecimento</label>
            <AutoComplete
                v-if="!isEditing"
                v-model="establishmentQuery"
                :suggestions="establishmentSuggestions"
                option-label="fantasia"
                dropdown
                placeholder="Buscar estabelecimento pelo nome"
                class="w-full"
                input-class="w-full"
                append-to="body"
                @complete="searchEstablishments"
                @item-select="selectEstablishment"
            >
                <template #option="slotProps">
                    <span>{{ slotProps.option.fantasia || slotProps.option.razaoSocial }}</span>
                    <span v-if="slotProps.option.municipio" style="color: var(--hub-muted); font-size: 12px"> · {{ slotProps.option.municipio }}</span>
                </template>
            </AutoComplete>
            <p v-else style="margin: 0; font-weight: 700; font-size: 14px">
                {{ selectedEstablishment?.fantasia || selectedEstablishment?.razaoSocial }}
            </p>
        </div>

        <div class="com-field-row">
            <div class="com-field">
                <label>Data</label>
                <InputText v-model="date" type="date" />
            </div>
            <div class="com-field">
                <label>Horário</label>
                <InputText v-model="time" type="time" />
            </div>
        </div>

        <div class="com-field" style="margin-bottom: 14px">
            <label>Formato</label>
            <div class="onb-seg">
                <button
                    v-for="option in MODALITIES"
                    :key="option.id"
                    type="button"
                    class="onb-seg__btn"
                    :class="{ active: modality === option.id }"
                    @click="modality = option.id"
                >
                    <i :class="option.icon" />
                    {{ option.label }}
                </button>
            </div>
        </div>

        <div v-if="modality === 'presencial'" class="com-field" style="margin-bottom: 14px">
            <label>Endereço</label>
            <InputText v-model="location" placeholder="Onde vai acontecer a reunião" />
        </div>
        <div v-else class="com-field" style="margin-bottom: 14px">
            <label>Link de pagamento</label>
            <InputText v-model="paymentLink" placeholder="https://..." />
        </div>

        <div class="com-field" style="max-width: 340px">
            <label>Responsáveis</label>
            <MultiSelect
                v-model="responsavelIds"
                :options="people"
                option-label="name"
                option-value="id"
                display="chip"
                placeholder="Sem responsável"
                append-to="body"
                class="w-full"
            >
                <template #chip="slotProps">
                    <span class="onb-person" style="gap: 4px">
                        <OnboardingAvatar :avatar="people.find((p) => p.id === slotProps.value)?.avatar" :size="18" />
                        {{ personName(slotProps.value) }}
                        <i
                            class="pi pi-times-circle"
                            style="cursor: pointer; font-size: 12px"
                            @click.stop="slotProps.removeCallback($event, slotProps.value)"
                        />
                    </span>
                </template>
                <template #option="slotProps">
                    <span class="onb-person">
                        <OnboardingAvatar :avatar="slotProps.option.avatar" :size="24" />
                        {{ slotProps.option.name }}
                    </span>
                </template>
            </MultiSelect>
        </div>

        <div style="display: flex; align-items: center; gap: 10px; margin-top: 18px">
            <Button type="button" :label="isEditing ? 'Salvar alterações' : 'Agendar'" :loading="saving" :disabled="!canSubmit" @click="submit" />
            <span v-if="error" style="font-size: 12px; color: var(--hub-coral, #cf4a3e)">{{ error }}</span>
        </div>
    </Dialog>
</template>
