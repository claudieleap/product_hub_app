<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import PageHeader from '@/components/PageHeader.vue';
import MetricsCatalogPanel from '@/components/MetricsCatalogPanel.vue';
import { useMetricsDashboard } from '@/composables/useMetricsDashboard';
import '@/assets/home.css';

const route = useRoute();
const router = useRouter();

const {
    groups,
    topMetrics,
    maxTopMetricCount,
    totals,
    allReady,
    metricsLoading,
    metricsError
} = useMetricsDashboard();

const activeTab = computed(() => (route.query.aba === 'catalogo' ? 'catalogo' : 'visao'));

const totalMetrics = computed(() =>
    groups.value.reduce((sum, group) => sum + group.metrics.length, 0)
);

function setTab(tab) {
    if (tab === 'catalogo') {
        router.replace({ path: route.path, query: { aba: 'catalogo' } });
        return;
    }

    router.replace({ path: route.path });
}

function barWidth(count, max) {
    return `${Math.max(count > 0 ? 8 : 0, Math.round((count / max) * 100))}%`;
}
</script>

<template>
    <VuePressLayout>
        <div class="home-page">
            <div class="wrap metrics-dash">
                <PageHeader
                    eyebrow="Estratégia de produto"
                    title="Métricas de sucesso"
                    :subtitle="
                        activeTab === 'catalogo'
                            ? 'Gerencie grupos e métricas do catálogo usado nos itens do roadmap.'
                            : 'Visão de quantos itens do roadmap estão associados a cada métrica — SaaS, Interno e BPO consolidados.'
                    "
                >
                    <template #nav>
                        <div class="roadmap-view-switch metrics-dash__tabs" role="tablist" aria-label="Seção de métricas">
                            <button
                                type="button"
                                class="roadmap-view-switch__link"
                                :class="{ active: activeTab === 'visao' }"
                                role="tab"
                                :aria-selected="activeTab === 'visao'"
                                @click="setTab('visao')"
                            >
                                Visão geral
                            </button>
                            <button
                                type="button"
                                class="roadmap-view-switch__link"
                                :class="{ active: activeTab === 'catalogo' }"
                                role="tab"
                                :aria-selected="activeTab === 'catalogo'"
                                @click="setTab('catalogo')"
                            >
                                Catálogo
                            </button>
                        </div>
                    </template>
                </PageHeader>

                <Message v-if="metricsError" severity="warn" :closable="false" class="metrics-dash__banner">
                    {{ metricsError }}
                </Message>

                <template v-if="activeTab === 'visao'">
                    <section v-if="!allReady || metricsLoading" class="hub-exec hub-exec--loading" aria-label="Carregando">
                        <div v-for="n in 4" :key="n" class="hub-exec-kpi hub-exec-kpi--skeleton" />
                    </section>

                    <template v-else>
                        <section class="hub-exec metrics-dash__kpis" aria-label="Resumo">
                            <div class="hub-exec-kpis">
                                <article class="hub-exec-kpi hub-exec-kpi--matrix">
                                    <span class="hub-exec-kpi__icon"><i class="pi pi-th-large" /></span>
                                    <span class="hub-exec-kpi__value">{{ totals.items }}</span>
                                    <span class="hub-exec-kpi__label">Itens no roadmap</span>
                                    <span class="hub-exec-kpi__hint">Todos os estágios</span>
                                </article>

                                <article class="hub-exec-kpi hub-exec-kpi--featured">
                                    <span class="hub-exec-kpi__icon"><i class="pi pi-chart-line" /></span>
                                    <span class="hub-exec-kpi__value">{{ totals.withMetrics }}</span>
                                    <span class="hub-exec-kpi__label">Com métrica</span>
                                    <span class="hub-exec-kpi__hint">
                                        {{ totals.items ? Math.round((totals.withMetrics / totals.items) * 100) : 0 }}% do total
                                    </span>
                                </article>

                                <article class="hub-exec-kpi hub-exec-kpi--backlog">
                                    <span class="hub-exec-kpi__icon"><i class="pi pi-minus-circle" /></span>
                                    <span class="hub-exec-kpi__value">{{ totals.withoutMetrics }}</span>
                                    <span class="hub-exec-kpi__label">Sem métrica</span>
                                    <span class="hub-exec-kpi__hint">Ainda não classificados</span>
                                </article>

                                <article class="hub-exec-kpi hub-exec-kpi--dev">
                                    <span class="hub-exec-kpi__icon"><i class="pi pi-tags" /></span>
                                    <span class="hub-exec-kpi__value">{{ totals.metricsWithItems }}</span>
                                    <span class="hub-exec-kpi__label">Métricas em uso</span>
                                    <span class="hub-exec-kpi__hint">de {{ totalMetrics }} no catálogo</span>
                                </article>
                            </div>
                        </section>

                        <section v-if="topMetrics.length" class="metrics-dash__highlight" aria-label="Métricas mais usadas">
                            <div class="metrics-dash__section-head">
                                <h2>Mais associadas</h2>
                                <p>Top métricas por quantidade de itens vinculados.</p>
                            </div>

                            <div class="metrics-dash__top-grid">
                                <article
                                    v-for="(metric, index) in topMetrics"
                                    :key="metric.id"
                                    class="metrics-dash__top-card"
                                >
                                    <span class="metrics-dash__top-rank">#{{ index + 1 }}</span>
                                    <div class="metrics-dash__top-copy">
                                        <p class="metrics-dash__top-group">{{ metric.groupLabel }}</p>
                                        <h3>{{ metric.label }}</h3>
                                    </div>
                                    <div class="metrics-dash__top-value">{{ metric.itemCount }}</div>
                                    <div class="metrics-dash__bar metrics-dash__bar--top">
                                        <span
                                            class="metrics-dash__bar-fill"
                                            :style="{ width: barWidth(metric.itemCount, maxTopMetricCount) }"
                                        />
                                    </div>
                                </article>
                            </div>
                        </section>
                    </template>
                </template>

                <MetricsCatalogPanel v-else />
            </div>
        </div>
    </VuePressLayout>
</template>

<style scoped>
.metrics-dash {
    max-width: 72rem;
}

.metrics-dash__tabs {
    margin-top: 0.25rem;
}

.metrics-dash__banner {
    margin-bottom: 1rem;
}

.metrics-dash__kpis {
    margin-bottom: 1.5rem;
}

.metrics-dash__section-head {
    margin-bottom: 1rem;
}

.metrics-dash__section-head h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--hub-ink);
}

.metrics-dash__section-head p {
    margin: 0.25rem 0 0;
    font-size: 0.875rem;
    color: var(--hub-muted);
}

.metrics-dash__highlight {
    margin-bottom: 2rem;
}

.metrics-dash__top-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
}

.metrics-dash__top-card {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto auto;
    gap: 4px 10px;
    padding: 14px;
    border: 1px solid var(--hub-line);
    border-radius: 14px;
    background: var(--hub-surface);
}

.metrics-dash__top-rank {
    grid-row: 1 / 3;
    align-self: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--hub-muted);
}

.metrics-dash__top-copy h3 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.35;
    color: var(--hub-ink);
}

.metrics-dash__top-group {
    margin: 0 0 2px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--hub-blue);
}

.metrics-dash__top-value {
    grid-row: 1 / 3;
    align-self: center;
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--hub-ink);
    font-variant-numeric: tabular-nums;
}

.metrics-dash__bar--top {
    grid-column: 2 / 4;
}

.metrics-dash__bar {
    height: 6px;
    border-radius: 999px;
    background: #eef2f7;
    overflow: hidden;
}

.metrics-dash__bar-fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--hub-blue), #60a5fa);
}

@media (max-width: 1100px) {
    .metrics-dash__top-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 768px) {
    .metrics-dash__top-grid {
        grid-template-columns: 1fr;
    }
}
</style>
