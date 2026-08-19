<script setup>
import { computed, ref, watch } from 'vue';
import { useEstablishments } from '@/composables/useEstablishments';
import { ONBOARDING_PEOPLE } from '@/config/onboardingConfig';
import OnboardingAvatar from '@/components/OnboardingAvatar.vue';
import '@/assets/commercial.css';
import '@/assets/onboarding.css';

const visible = defineModel('visible', { type: Boolean, default: false });

const props = defineProps({
    defaultDate: { type: String, default: '' }
});

const emit = defineEmits(['created']);

const { establishments, createAppointment } = useEstablishments();

const establishmentQuery = ref('');
const establishmentSuggestions = ref([]);
const selectedEstablishment = ref(null);
const date = ref('');
const time = ref('09:00');
const modality = ref('presencial');
const location = ref('');
const paymentLink = ref('');
const responsavelId = ref(null);
const saving = ref(false);
const error = ref(null);

const people = ONBOARDING_PEOPLE;
const MODALITIES = [
    { id: 'presencial', label: 'Presencial', icon: 'pi pi-map-marker' },
    { id: 'online', label: 'Online', icon: 'pi pi-video' }
];

watch(visible, (open) => {
    if (!open) return;
    date.value = props.defaultDate || new Date().toISOString().slice(0, 10);
    time.value = '09:00';
    modality.value = 'presencial';
    location.value = '';
    paymentLink.value = '';
    responsavelId.value = null;
    selectedEstablishment.value = null;
    establishmentQuery.value = '';
    error.value = null;
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

const canSubmit = computed(() => {
    if (!selectedEstablishment.value?.id || !date.value || !time.value) return false;
    if (modality.value === 'presencial') return Boolean(location.value.trim());
    return Boolean(paymentLink.value.trim());
});

async function submit() {
    if (!canSubmit.value) return;
    saving.value = true;
    error.value = null;

    try {
        await createAppointment(selectedEstablishment.value.id, {
            date: date.value,
            time: time.value,
            modality: modality.value,
            location: modality.value === 'presencial' ? location.value.trim() : null,
            paymentLink: modality.value === 'online' ? paymentLink.value.trim() : null,
            responsavelId: responsavelId.value
        });
        emit('created');
        visible.value = false;
    } catch (err) {
        error.value = err.message || 'Não foi possível criar o agendamento.';
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
        header="Novo agendamento"
        :style="{ width: 'min(480px, 96vw)' }"
        :draggable="false"
    >
        <div class="com-field" style="margin-bottom: 14px">
            <label>Estabelecimento</label>
            <AutoComplete
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
            <label>Responsável</label>
            <Select
                v-model="responsavelId"
                :options="people"
                option-label="name"
                option-value="id"
                show-clear
                placeholder="Sem responsável"
                append-to="body"
                class="w-full"
            >
                <template #value="slotProps">
                    <span v-if="slotProps.value" class="onb-person">
                        <OnboardingAvatar :avatar="people.find((p) => p.id === slotProps.value)?.avatar" :size="22" />
                        {{ people.find((p) => p.id === slotProps.value)?.name }}
                    </span>
                    <span v-else class="onb-person onb-person--empty">Sem responsável</span>
                </template>
                <template #option="slotProps">
                    <span class="onb-person">
                        <OnboardingAvatar :avatar="slotProps.option.avatar" :size="24" />
                        {{ slotProps.option.name }}
                    </span>
                </template>
            </Select>
        </div>

        <div style="display: flex; align-items: center; gap: 10px; margin-top: 18px">
            <Button type="button" label="Agendar" :loading="saving" :disabled="!canSubmit" @click="submit" />
            <span v-if="error" style="font-size: 12px; color: var(--hub-coral, #cf4a3e)">{{ error }}</span>
        </div>
    </Dialog>
</template>
