<script setup>
import { computed, onMounted, ref } from 'vue';
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import PageHeader from '@/components/PageHeader.vue';
import AppointmentDialog from '@/components/AppointmentDialog.vue';
import { establishmentsApi } from '@/api/establishmentsClient';
import { useHolidays } from '@/composables/useHolidays';
import { responsavelNames as personNames } from '@/config/onboardingConfig';
import '@/assets/commercial.css';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_LABELS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const today = new Date();
const cursor = ref(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
const viewMode = ref('month'); // 'month' | 'week'

/** Carrega o histórico inteiro de uma vez — alimenta a grade e a aba de Agendamentos. */
const appointments = ref([]);
const loading = ref(false);
const error = ref(null);

const { holidaysByDate, loadYear } = useHolidays();

const dialogVisible = ref(false);
const dialogDate = ref('');
const editingAppointment = ref(null);

function pad(n) {
    return String(n).padStart(2, '0');
}

function toISODate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfWeek(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return d;
}

const monthLabel = computed(() => `${MONTH_LABELS[cursor.value.getMonth()]} ${cursor.value.getFullYear()}`);

const weekLabel = computed(() => {
    const start = startOfWeek(cursor.value);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const sameMonth = start.getMonth() === end.getMonth();
    const startLabel = `${start.getDate()}${sameMonth ? '' : ' ' + MONTH_LABELS[start.getMonth()].slice(0, 3)}`;
    return `${startLabel} a ${end.getDate()} de ${MONTH_LABELS[end.getMonth()]} ${end.getFullYear()}`;
});

const weeks = computed(() => {
    if (viewMode.value === 'week') {
        const start = startOfWeek(cursor.value);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return [days];
    }

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

const todayIso = toISODate(today);

const upcomingAppointments = computed(() =>
    [...appointments.value]
        .filter((item) => item.date >= todayIso)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
);

const pastAppointments = computed(() =>
    [...appointments.value]
        .filter((item) => item.date < todayIso)
        .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
);

function isToday(date) {
    return date && toISODate(date) === toISODate(today);
}

function holidayName(date) {
    return date ? holidaysByDate.value[toISODate(date)] : null;
}

function dayAppointments(date) {
    return date ? appointmentsByDate.value.get(toISODate(date)) ?? [] : [];
}

function responsavelNames(item) {
    return personNames(item.responsavelIds);
}

function appointmentTooltip(item) {
    const names = responsavelNames(item);
    return `${item.establishmentName} · ${item.time}${names ? ' · ' + names : ''}`;
}

async function loadAppointments() {
    loading.value = true;
    error.value = null;
    try {
        appointments.value = await establishmentsApi.listAppointments('2000-01-01', '2100-12-31');
    } catch (err) {
        error.value = err.message || 'Não foi possível carregar os agendamentos.';
    } finally {
        loading.value = false;
    }
}

function changePeriod(delta) {
    if (viewMode.value === 'week') {
        cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth(), cursor.value.getDate() + delta * 7);
        const weekStart = startOfWeek(cursor.value);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        loadYear(weekStart.getFullYear());
        loadYear(weekEnd.getFullYear());
    } else {
        cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + delta, 1);
    }
    loadYear(cursor.value.getFullYear());
}

function goToday() {
    cursor.value = new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function openDay(date) {
    editingAppointment.value = null;
    dialogDate.value = date ? toISODate(date) : toISODate(today);
    dialogVisible.value = true;
}

function openAppointment(item) {
    editingAppointment.value = item;
    dialogVisible.value = true;
}

function openNewFromList() {
    editingAppointment.value = null;
    dialogDate.value = toISODate(today);
    dialogVisible.value = true;
}

onMounted(() => {
    loadYear(today.getFullYear() - 1);
    loadYear(today.getFullYear());
    loadYear(today.getFullYear() + 1);
    loadAppointments();
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

            <Tabs value="calendario">
                <TabList>
                    <Tab value="calendario">Calendário</Tab>
                    <Tab value="agendamentos">Agendamentos</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel value="calendario">
                        <div class="com-cal-toolbar">
                            <div class="com-cal-toolbar__nav">
                                <Button type="button" text severity="secondary" icon="pi pi-angle-left" @click="changePeriod(-1)" />
                                <span class="com-cal-toolbar__label">{{ viewMode === 'week' ? weekLabel : monthLabel }}</span>
                                <Button type="button" text severity="secondary" icon="pi pi-angle-right" @click="changePeriod(1)" />
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px">
                                <div class="onb-seg">
                                    <button
                                        type="button"
                                        class="onb-seg__btn"
                                        :class="{ active: viewMode === 'month' }"
                                        @click="viewMode = 'month'"
                                    >
                                        Mês
                                    </button>
                                    <button
                                        type="button"
                                        class="onb-seg__btn"
                                        :class="{ active: viewMode === 'week' }"
                                        @click="viewMode = 'week'"
                                    >
                                        Semana
                                    </button>
                                </div>
                                <Button type="button" text severity="secondary" label="Hoje" @click="goToday" />
                            </div>
                        </div>

                        <div class="com-calendar" :class="{ 'com-calendar--week': viewMode === 'week' }">
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
                                                v-for="item in (viewMode === 'week' ? dayAppointments(date) : dayAppointments(date).slice(0, 3))"
                                                :key="item.id"
                                                class="com-calendar__appointment"
                                                :title="appointmentTooltip(item)"
                                                @click.stop="openAppointment(item)"
                                            >
                                                {{ item.time }} · {{ item.establishmentName }}
                                            </span>
                                            <span
                                                v-if="viewMode === 'month' && dayAppointments(date).length > 3"
                                                class="com-calendar__appointment com-calendar__appointment--more"
                                            >
                                                +{{ dayAppointments(date).length - 3 }} mais
                                            </span>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </TabPanel>

                    <TabPanel value="agendamentos">
                        <div class="com-filters">
                            <span class="com-filters__count" v-if="!loading">{{ appointments.length }} agendamentos no total</span>
                            <Button type="button" icon="pi pi-plus" label="Novo agendamento" @click="openNewFromList" style="margin-left: auto" />
                        </div>

                        <p v-if="loading" class="roadmap-sync-warning">Carregando...</p>

                        <template v-else>
                            <section class="com-agenda-section">
                                <h2 class="com-dash-panel__title">Próximos agendamentos</h2>
                                <p v-if="!upcomingAppointments.length" class="com-column__empty">Nenhum agendamento futuro.</p>
                                <div v-else class="com-table-wrap">
                                    <table class="com-table">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Horário</th>
                                                <th>Estabelecimento</th>
                                                <th>Formato</th>
                                                <th>Responsáveis</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr
                                                v-for="item in upcomingAppointments"
                                                :key="item.id"
                                                class="com-agenda-row"
                                                @click="openAppointment(item)"
                                            >
                                                <td>{{ item.date.split('-').reverse().join('/') }}</td>
                                                <td>{{ item.time }}</td>
                                                <td>{{ item.establishmentName }}</td>
                                                <td>{{ item.modality === 'online' ? 'Online' : 'Presencial' }}</td>
                                                <td>{{ responsavelNames(item) || '—' }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section class="com-agenda-section">
                                <h2 class="com-dash-panel__title">Agendamentos anteriores</h2>
                                <p v-if="!pastAppointments.length" class="com-column__empty">Nenhum agendamento anterior.</p>
                                <div v-else class="com-table-wrap">
                                    <table class="com-table">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Horário</th>
                                                <th>Estabelecimento</th>
                                                <th>Formato</th>
                                                <th>Responsáveis</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr
                                                v-for="item in pastAppointments"
                                                :key="item.id"
                                                class="com-agenda-row"
                                                @click="openAppointment(item)"
                                            >
                                                <td>{{ item.date.split('-').reverse().join('/') }}</td>
                                                <td>{{ item.time }}</td>
                                                <td>{{ item.establishmentName }}</td>
                                                <td>{{ item.modality === 'online' ? 'Online' : 'Presencial' }}</td>
                                                <td>{{ responsavelNames(item) || '—' }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </template>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            <AppointmentDialog
                v-model:visible="dialogVisible"
                :default-date="dialogDate"
                :appointment="editingAppointment"
                @created="loadAppointments"
                @updated="loadAppointments"
            />
        </div>
    </VuePressLayout>
</template>

<style scoped>
.com-agenda-section {
    margin-bottom: 24px;
}

.com-agenda-row {
    cursor: pointer;
}

.com-agenda-row:hover td {
    background: var(--hub-blue-wash);
}
</style>
