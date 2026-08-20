<script setup>
import { computed, ref, watch } from 'vue';
import { useEstablishments } from '@/composables/useEstablishments';
import { establishmentsApi } from '@/api/establishmentsClient';
import { ONBOARDING_PEOPLE } from '@/config/onboardingConfig';
import OnboardingAvatar from '@/components/OnboardingAvatar.vue';
import AppointmentDialog from '@/components/AppointmentDialog.vue';
import '@/assets/commercial.css';

const props = defineProps({
    id: { type: String, default: '' }
});

const { getEstablishment } = useEstablishments();

const establishment = computed(() => getEstablishment(props.id));

const appointments = ref([]);
const loading = ref(false);
const error = ref(null);
const dialogVisible = ref(false);

async function loadAppointments() {
    appointments.value = [];
    error.value = null;
    if (!establishment.value) return;

    loading.value = true;
    try {
        appointments.value = await establishmentsApi.listAppointmentsForEstablishment(establishment.value.id);
    } catch (err) {
        error.value = err.message || 'Não foi possível carregar os agendamentos.';
    } finally {
        loading.value = false;
    }
}

watch(() => establishment.value?.id, loadAppointments, { immediate: true });

function responsavelNames(item) {
    return (item.responsavelIds ?? [])
        .map((id) => ONBOARDING_PEOPLE.find((p) => p.id === id))
        .filter(Boolean);
}

function isFuture(item) {
    return `${item.date}T${item.time}` >= new Date().toISOString().slice(0, 16);
}

function formatDate(iso) {
    if (!iso) return '';
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
}
</script>

<template>
    <template v-if="establishment">
        <div style="margin-bottom: 12px">
            <Button type="button" size="small" icon="pi pi-plus" label="Novo agendamento" @click="dialogVisible = true" />
        </div>

        <p v-if="loading" class="com-comment-empty">Carregando agendamentos...</p>
        <p v-else-if="error" class="com-comment-empty" style="color: var(--hub-coral, #cf4a3e)">{{ error }}</p>
        <p v-else-if="!appointments.length" class="com-comment-empty">Nenhum agendamento ainda.</p>

        <ul v-else class="com-comment-list">
            <li v-for="item in appointments" :key="item.id" class="com-comment">
                <div class="com-comment__head">
                    <span class="com-comment__author">
                        {{ formatDate(item.date) }} às {{ item.time }}
                        <span v-if="isFuture(item)" class="onb-tag onb-tag--teal" style="margin-left: 6px">Futuro</span>
                        <span v-else class="onb-tag" style="margin-left: 6px">Passado</span>
                    </span>
                    <span class="com-comment__date">
                        <i :class="item.modality === 'online' ? 'pi pi-video' : 'pi pi-map-marker'" />
                        {{ item.modality === 'online' ? 'Online' : 'Presencial' }}
                    </span>
                </div>
                <p v-if="item.modality === 'presencial' && item.location" class="com-comment__text">{{ item.location }}</p>
                <p v-else-if="item.paymentLink" class="com-comment__text">{{ item.paymentLink }}</p>
                <div v-if="responsavelNames(item).length" style="display: flex; align-items: center; gap: 6px; margin-top: 6px; flex-wrap: wrap">
                    <span v-for="person in responsavelNames(item)" :key="person.id" class="onb-person" style="gap: 4px">
                        <OnboardingAvatar :avatar="person.avatar" :size="18" />
                        {{ person.name }}
                    </span>
                </div>
            </li>
        </ul>

        <AppointmentDialog
            v-model:visible="dialogVisible"
            :establishment-id="establishment.id"
            @created="loadAppointments"
        />
    </template>
</template>
