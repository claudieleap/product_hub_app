<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import PageHeader from '@/components/PageHeader.vue';
import AppointmentDialog from '@/components/AppointmentDialog.vue';
import { establishmentsApi } from '@/api/establishmentsClient';
import { useHolidays } from '@/composables/useHolidays';
import { getPersonMeta } from '@/config/onboardingConfig';
import '@/assets/commercial.css';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_LABELS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const today = new Date();
const cursor = ref(new Date(today.getFullYear(), today.getMonth(), 1));

const appointments = ref([]);
const loading = ref(false);
const error = ref(null);

const { holidaysByDate, loadYear } = useHolidays();

const dialogVisible = ref(false);
const dialogDate = ref('');

function pad(n) {
    return String(n).padStart(2, '0');
}

function toISODate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const monthLabel = computed(() => `${MONTH_LABELS[cursor.value.getMonth()]} ${cursor.value.getFullYear()}`);

const monthRange = computed(() => {
    const start = new Date(cursor.value.getFullYear(), cursor.value.getMonth(), 1);
    const end = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 0);
    return { start: toISODate(start), end: toISODate(end) };
});

const weeks = computed(() => {
    const year = cursor.value.getFullYear();
    const month = cursor.value.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
    while (cells.length % 7 !== 0) cells.push(null);

    const result = [];
    for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7));
    return result;
});

const appointmentsByDate = computed(() => {
    const map = new Map();
    for (const item of appointments.value) {
        if (!map.has(item.date)) map.set(item.date, []);
        map.get(item.date).push(item);
    }
    for (const list of map.values()) list.sort((a, b) => a.time.localeCompare(b.time));
    return map;
});

function isToday(date) {
    return date && toISODate(date) === toISODate(today);
}

function holidayName(date) {
    return date ? holidaysByDate.value[toISODate(date)] : null;
}

function dayAppointments(date) {
    return date ? appointmentsByDate.value.get(toISODate(date)) ?? [] : [];
}

function appointmentTooltip(item) {
    const responsavel = getPersonMeta(item.responsavelId)?.name;
    return `${item.establishmentName} · ${item.time}${responsavel ? ' · ' + responsavel : ''}`;
}

async function loadAppointments() {
    loading.value = true;
    error.value = null;
    try {
        appointments.value = await establishmentsApi.listAppointments(monthRange.value.start, monthRange.value.end);
    } catch (err) {
        error.value = err.message || 'Não foi possível carregar os agendamentos.';
    } finally {
        loading.value = false;
    }
}

function changeMonth(delta) {
    cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + delta, 1);
}

function goToday() {
    cursor.value = new Date(today.getFullYear(), today.getMonth(), 1);
}

function openDay(date) {
    dialogDate.value = date ? toISODate(date) : toISODate(today);
    dialogVisible.value = true;
}

watch(
    () => monthRange.value,
    () => {
        loadYear(cursor.value.getFullYear());
        loadAppointments();
    },
    { immediate: true }
);

onMounted(() => {
    loadYear(today.getFullYear() - 1);
    loadYear(today.getFullYear() + 1);
});
</script>

<template>
    <VuePressLayout>
        <div class="home-page commercial-page">
            <PageHeader
                eyebrow="Comercial"
                title="Calendário"
                subtitle="Reuniões agendadas com estabelecimentos e feriados nacionais."
            >
                <template #actions>
                    <Button type="button" icon="pi pi-plus" label="Agendar" @click="openDay(null)" />
                </template>
            </PageHeader>

            <p v-if="error" class="roadmap-sync-warning">{{ error }}</p>

            <div class="com-cal-toolbar">
                <div class="com-cal-toolbar__nav">
                    <Button type="button" text severity="secondary" icon="pi pi-angle-left" @click="changeMonth(-1)" />
                    <span class="com-cal-toolbar__label">{{ monthLabel }}</span>
                    <Button type="button" text severity="secondary" icon="pi pi-angle-right" @click="changeMonth(1)" />
                </div>
                <Button type="button" text severity="secondary" label="Hoje" @click="goToday" />
            </div>

            <div class="com-calendar">
                <div class="com-calendar__weekdays">
                    <span v-for="label in WEEKDAY_LABELS" :key="label">{{ label }}</span>
                </div>

                <div v-for="(week, wi) in weeks" :key="wi" class="com-calendar__week">
                    <div
                        v-for="(date, di) in week"
                        :key="di"
                        class="com-calendar__day"
                        :class="{ 'com-calendar__day--empty': !date, 'com-calendar__day--today': isToday(date), 'com-calendar__day--holiday': holidayName(date) }"
                        @click="date && openDay(date)"
                    >
                        <template v-if="date">
                            <div class="com-calendar__day-head">
                                <span class="com-calendar__day-number">{{ date.getDate() }}</span>
                            </div>
                            <p v-if="holidayName(date)" class="com-calendar__holiday" :title="holidayName(date)">{{ holidayName(date) }}</p>
                            <div class="com-calendar__appointments">
                                <span
                                    v-for="item in dayAppointments(date).slice(0, 3)"
                                    :key="item.id"
                                    class="com-calendar__appointment"
                                    :title="appointmentTooltip(item)"
                                >
                                    {{ item.time }} · {{ item.establishmentName }}
                                </span>
                                <span v-if="dayAppointments(date).length > 3" class="com-calendar__appointment com-calendar__appointment--more">
                                    +{{ dayAppointments(date).length - 3 }} mais
                                </span>
                            </div>
                        </template>
                    </div>
                </div>
            </div>

            <AppointmentDialog v-model:visible="dialogVisible" :default-date="dialogDate" @created="loadAppointments" />
        </div>
    </VuePressLayout>
</template>
