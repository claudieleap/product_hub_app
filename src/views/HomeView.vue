<script setup>
import { computed } from 'vue';
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import PageHeader from '@/components/PageHeader.vue';
import RoadmapTypeIcon from '@/components/RoadmapTypeIcon.vue';
import { ROADMAP_TYPES, ENTREGAS_PATH, getRoadmapTypeMeta, roadmapMatrixPath } from '@/config/roadmapTypes';
import { useHomeDashboard } from '@/composables/useHomeDashboard';
import { formatBrazilianDate } from '@/utils/brazilianDate';
import '@/assets/home.css';

const { allReady, totals, statsByType, pipeline, recentDeliveries } = useHomeDashboard();

const maxPipelineValue = computed(() => Math.max(...pipeline.value.map((segment) => segment.value), 1));

function pipelineBarWidth(value) {
    return `${Math.max(8, Math.round((value / maxPipelineValue.value) * 100))}%`;
}
</script>

<template>
    <VuePressLayout home>
        <div class="home-page hub-home">
            <div class="hub-home__glow" aria-hidden="true" />

            <div class="wrap">
                <PageHeader
                    variant="hero"
                    class="hub-home__hero"
                    eyebrow="Aleevia · Estratégia de produto"
                    title="Product Hub"
                >
                    <template #subtitle>
                        Visão executiva do que estamos <b>construindo, priorizando e entregando</b> — SaaS,
                        Interno e BPO em tempo real.
                    </template>
                </PageHeader>

                <section v-if="!allReady" class="hub-exec hub-exec--loading" aria-label="Carregando indicadores">
                    <div v-for="n in 4" :key="n" class="hub-exec-kpi hub-exec-kpi--skeleton" />
                </section>

                <section v-else class="hub-exec" aria-label="Indicadores executivos">
                    <div class="hub-exec-kpis">
                        <router-link :to="ENTREGAS_PATH" class="hub-exec-kpi hub-exec-kpi--featured">
                            <span class="hub-exec-kpi__glow" aria-hidden="true" />
                            <span class="hub-exec-kpi__icon"><i class="pi pi-send" /></span>
                            <span class="hub-exec-kpi__value">{{ totals.deliveries }}</span>
                            <span class="hub-exec-kpi__label">Entregas totais</span>
                            <span class="hub-exec-kpi__hint">
                                +{{ totals.deliveriesThisMonth }} neste mês
                            </span>
                        </router-link>

                        <article class="hub-exec-kpi hub-exec-kpi--dev">
                            <span class="hub-exec-kpi__icon"><i class="pi pi-code" /></span>
                            <span class="hub-exec-kpi__value">{{ totals.dev }}</span>
                            <span class="hub-exec-kpi__label">Em desenvolvimento</span>
                            <span class="hub-exec-kpi__hint">{{ totals.devConcluido }} prontos p/ entrega</span>
                        </article>

                        <article class="hub-exec-kpi hub-exec-kpi--matrix">
                            <span class="hub-exec-kpi__icon"><i class="pi pi-th-large" /></span>
                            <span class="hub-exec-kpi__value">{{ totals.matrix }}</span>
                            <span class="hub-exec-kpi__label">Na matriz</span>
                            <span class="hub-exec-kpi__hint">Priorizados por módulo</span>
                        </article>

                        <article class="hub-exec-kpi hub-exec-kpi--backlog">
                            <span class="hub-exec-kpi__icon"><i class="pi pi-inbox" /></span>
                            <span class="hub-exec-kpi__value">{{ totals.backlog }}</span>
                            <span class="hub-exec-kpi__label">No backlog</span>
                            <span class="hub-exec-kpi__hint">Aguardando priorização</span>
                        </article>
                    </div>

                    <div class="hub-exec-pipeline">
                        <div class="hub-exec-pipeline__head">
                            <h2>Pipeline de valor</h2>
                            <span class="hub-exec-pipeline__progress">
                                {{ totals.devProgress }}% concluído no dev
                            </span>
                        </div>
                        <div class="hub-exec-pipeline__track" role="img" aria-label="Distribuição do pipeline">
                            <div
                                v-for="segment in pipeline"
                                :key="segment.id"
                                class="hub-exec-pipeline__segment"
                                :style="{
                                    '--segment-color': segment.color,
                                    '--segment-width': pipelineBarWidth(segment.value)
                                }"
                                :title="`${segment.label}: ${segment.value}`"
                            >
                                <span class="hub-exec-pipeline__segment-fill" />
                            </div>
                        </div>
                        <div class="hub-exec-pipeline__legend">
                            <div v-for="segment in pipeline" :key="segment.id" class="hub-exec-pipeline__legend-item">
                                <span
                                    class="hub-exec-pipeline__dot"
                                    :style="{ background: segment.color }"
                                />
                                <span class="hub-exec-pipeline__legend-label">{{ segment.label }}</span>
                                <strong>{{ segment.value }}</strong>
                                <span class="hub-exec-pipeline__legend-pct">{{ segment.pct }}%</span>
                            </div>
                        </div>
                    </div>

                    <div v-if="recentDeliveries.length" class="hub-exec-wins">
                        <div class="hub-exec-wins__head">
                            <h2>Entregas recentes</h2>
                            <router-link :to="ENTREGAS_PATH" class="hub-exec-wins__link">
                                Ver todas
                                <i class="pi pi-arrow-right" />
                            </router-link>
                        </div>
                        <div class="hub-exec-wins__list">
                            <router-link
                                v-for="item in recentDeliveries"
                                :key="`${item.roadmapType}-${item.id}`"
                                :to="ENTREGAS_PATH"
                                class="hub-exec-win"
                            >
                                <span
                                    class="hub-exec-win__tag"
                                    :style="{
                                        '--tag-color': getRoadmapTypeMeta(item.roadmapType).color,
                                        '--tag-wash': getRoadmapTypeMeta(item.roadmapType).wash
                                    }"
                                >
                                    {{ getRoadmapTypeMeta(item.roadmapType).label }}
                                </span>
                                <span class="hub-exec-win__title">{{ item.title }}</span>
                                <time class="hub-exec-win__date">{{ formatBrazilianDate(item.deliveredAt) }}</time>
                            </router-link>
                        </div>
                    </div>
                </section>

                <section class="hub-home__cards" aria-label="Roadmaps">
                    <article
                        v-for="(roadmap, index) in ROADMAP_TYPES"
                        :key="roadmap.id"
                        class="hub-home-card"
                        :class="`hub-home-card--${roadmap.id}`"
                        :style="{
                            '--card-accent': roadmap.color,
                            '--card-wash': roadmap.wash
                        }"
                    >
                        <div class="hub-home-card__head">
                            <span class="hub-home-card__icon" :style="{ background: roadmap.color }">
                                <RoadmapTypeIcon :icon="roadmap.icon" />
                            </span>
                            <div>
                                <p class="hub-home-card__tagline">{{ roadmap.tagline }}</p>
                                <h2 class="hub-home-card__title">Roadmap {{ roadmap.label }}</h2>
                            </div>
                        </div>

                        <div v-if="allReady" class="hub-home-card__metrics">
                            <div class="hub-home-card__metric">
                                <strong>{{ statsByType[index].matrix }}</strong>
                                <span>Matriz</span>
                            </div>
                            <div class="hub-home-card__metric">
                                <strong>{{ statsByType[index].dev }}</strong>
                                <span>Dev</span>
                            </div>
                            <div class="hub-home-card__metric hub-home-card__metric--delivered">
                                <strong>{{ statsByType[index].deliveries }}</strong>
                                <span>Entregas</span>
                            </div>
                        </div>
                        <div v-else class="hub-home-card__metrics hub-home-card__metrics--loading">
                            <span v-for="n in 3" :key="n" />
                        </div>

                        <p class="hub-home-card__desc">{{ roadmap.description }}</p>

                        <ul class="hub-home-card__highlights">
                            <li v-for="item in roadmap.highlights" :key="item">
                                <i class="pi pi-check" />
                                {{ item }}
                            </li>
                        </ul>

                        <div class="hub-home-card__footer">
                            <router-link :to="roadmapMatrixPath(roadmap.id)" class="hub-home-card__cta">
                                Abrir matriz
                                <i class="pi pi-arrow-right" />
                            </router-link>
                        </div>
                    </article>
                </section>
            </div>
        </div>
    </VuePressLayout>
</template>
