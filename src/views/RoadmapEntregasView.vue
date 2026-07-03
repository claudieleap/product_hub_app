<script setup>
import { computed, ref } from 'vue';
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import PageHeader from '@/components/PageHeader.vue';
import RoadmapTypeIcon from '@/components/RoadmapTypeIcon.vue';
import { ROADMAP_PRIORITIES } from '@/data/roadmapProducts';
import { ROADMAP_TYPES, getRoadmapTypeMeta, roadmapDevPath } from '@/config/roadmapTypes';
import { useAllDeliveries } from '@/composables/useAllDeliveries';
import { useRoadmapMetrics } from '@/composables/useRoadmapMetrics';
import { formatBrazilianDateTime, deliveryDateIsoKey } from '@/utils/brazilianDate';
import BrazilianDateInput from '@/components/BrazilianDateInput.vue';
import '@/assets/home.css';

const { allReady, deliveredItems, getProductById } = useAllDeliveries();
const { getMetricLabels } = useRoadmapMetrics();

const filterFrom = ref('');
const filterTo = ref('');
const filterType = ref('');

const filteredItems = computed(() => {
    return deliveredItems.value.filter((item) => {
        if (filterType.value && item.roadmapType !== filterType.value) return false;

        const day = deliveryDateIsoKey(item.deliveredAt);
        if (!day) return false;
        if (filterFrom.value && day < filterFrom.value) return false;
        if (filterTo.value && day > filterTo.value) return false;
        return true;
    });
});

function productTitle(item) {
    return getProductById(item.roadmapType, item.productId)?.title ?? item.productId;
}

function productAccent(item) {
    return getProductById(item.roadmapType, item.productId)?.accent ?? getRoadmapTypeMeta(item.roadmapType).color;
}

function priorityLabel(priorityId) {
    return ROADMAP_PRIORITIES.find((p) => p.id === priorityId)?.label ?? priorityId;
}

function priorityClass(priorityId) {
    return ROADMAP_PRIORITIES.find((p) => p.id === priorityId)?.rowClass ?? '';
}

function metricSummary(metricIds = []) {
    return getMetricLabels(metricIds).join(' · ');
}

function clearDateFilters() {
    filterFrom.value = '';
    filterTo.value = '';
}

function countByType(typeId) {
    if (!typeId) return deliveredItems.value.length;
    return deliveredItems.value.filter((item) => item.roadmapType === typeId).length;
}
</script>

<template>
    <VuePressLayout wide>
        <div class="home-page">
            <div v-if="!allReady" class="wrap roadmap-loading">
                <p>Carregando entregas...</p>
            </div>
            <div v-else class="wrap">
                <PageHeader
                    title="Entregas"
                    subtitle="Itens finalizados de todos os projetos — SaaS, Interno e BPO — em um só lugar."
                />

                <section class="roadmap-entregas-filters">
                    <div class="roadmap-entregas-type-filters">
                        <span class="roadmap-entregas-type-filters__label">Projeto</span>
                        <div class="roadmap-entregas-type-filters__chips" role="group" aria-label="Filtrar por projeto">
                            <button
                                type="button"
                                class="roadmap-entregas-type-chip"
                                :class="{ active: !filterType }"
                                @click="filterType = ''"
                            >
                                Todos
                                <span class="roadmap-entregas-type-chip__count">{{ countByType('') }}</span>
                            </button>
                            <button
                                v-for="type in ROADMAP_TYPES"
                                :key="type.id"
                                type="button"
                                class="roadmap-entregas-type-chip"
                                :class="{ active: filterType === type.id }"
                                :style="{
                                    '--chip-color': type.color,
                                    '--chip-wash': type.wash
                                }"
                                @click="filterType = type.id"
                            >
                                <RoadmapTypeIcon :icon="type.icon" class="roadmap-entregas-type-chip__icon" />
                                {{ type.label }}
                                <span class="roadmap-entregas-type-chip__count">{{ countByType(type.id) }}</span>
                            </button>
                        </div>
                    </div>

                    <div class="roadmap-entregas-date-filters">
                        <span class="roadmap-entregas-type-filters__label">Período</span>
                        <div class="roadmap-entregas-date-filters__fields">
                            <label class="roadmap-entregas-filter">
                                <span>De</span>
                                <BrazilianDateInput id="entregas-filter-from" v-model="filterFrom" />
                            </label>
                            <label class="roadmap-entregas-filter">
                                <span>Até</span>
                                <BrazilianDateInput id="entregas-filter-to" v-model="filterTo" />
                            </label>
                            <button
                                v-if="filterFrom || filterTo"
                                type="button"
                                class="roadmap-entregas-clear"
                                @click="clearDateFilters"
                            >
                                Limpar datas
                            </button>
                        </div>
                    </div>

                    <span class="roadmap-entregas-count">
                        {{ filteredItems.length }} {{ filteredItems.length === 1 ? 'entrega' : 'entregas' }}
                    </span>
                </section>

                <section v-if="!deliveredItems.length" class="roadmap-dev-empty roadmap-entregas-empty">
                    <i class="pi pi-send" />
                    <h3>Nenhuma entrega registrada</h3>
                    <p>
                        Nos boards de desenvolvimento de
                        <template v-for="(type, index) in ROADMAP_TYPES" :key="type.id">
                            <span v-if="index > 0">{{
                                index === ROADMAP_TYPES.length - 1 ? ' e ' : ', '
                            }}</span>
                            <router-link :to="roadmapDevPath(type.id)">{{ type.label }}</router-link>
                        </template>,
                        mova itens para <strong>Concluído</strong> e use <strong>Finalizar</strong>.
                    </p>
                </section>

                <section v-else-if="!filteredItems.length" class="roadmap-dev-empty roadmap-entregas-empty">
                    <i class="pi pi-filter-slash" />
                    <h3>Nenhuma entrega encontrada</h3>
                    <p>Ajuste os filtros de projeto ou data para ver outras entregas.</p>
                </section>

                <section v-else class="roadmap-entregas-list">
                    <article
                        v-for="item in filteredItems"
                        :key="`${item.roadmapType}-${item.id}`"
                        class="roadmap-entregas-card"
                        :style="{ '--feature-accent': productAccent(item) }"
                    >
                        <div class="roadmap-entregas-card__head">
                            <div>
                                <div class="roadmap-entregas-card__tags">
                                    <span
                                        class="roadmap-entregas-type-tag"
                                        :style="{
                                            '--tag-color': getRoadmapTypeMeta(item.roadmapType).color,
                                            '--tag-wash': getRoadmapTypeMeta(item.roadmapType).wash
                                        }"
                                    >
                                        <RoadmapTypeIcon
                                            :icon="getRoadmapTypeMeta(item.roadmapType).icon"
                                            class="roadmap-entregas-type-tag__icon"
                                        />
                                        {{ getRoadmapTypeMeta(item.roadmapType).label }}
                                    </span>
                                    <span class="roadmap-entregas-card__module">{{ productTitle(item) }}</span>
                                </div>
                                <h3 class="roadmap-entregas-card__title">{{ item.title }}</h3>
                            </div>
                            <time class="roadmap-entregas-card__date" :datetime="item.deliveredAt">
                                {{ formatBrazilianDateTime(item.deliveredAt) }}
                            </time>
                        </div>
                        <p v-if="item.notes" class="roadmap-entregas-card__notes">{{ item.notes }}</p>
                        <div class="roadmap-entregas-card__meta">
                            <span class="roadmap-priority-pill" :class="priorityClass(item.priority)">
                                {{ priorityLabel(item.priority) }}
                            </span>
                            <span
                                v-if="item.metrics?.length"
                                class="roadmap-dev-card__metrics"
                                :title="metricSummary(item.metrics)"
                            >
                                <i class="pi pi-chart-line" />
                                {{ item.metrics.length }}
                            </span>
                        </div>
                    </article>
                </section>
            </div>
        </div>
    </VuePressLayout>
</template>
