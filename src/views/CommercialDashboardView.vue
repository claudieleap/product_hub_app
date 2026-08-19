<script setup>
import { computed } from 'vue';
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import PageHeader from '@/components/PageHeader.vue';
import { useEstablishments } from '@/composables/useEstablishments';
import { COMMERCIAL_STAGES } from '@/config/commercialConfig';
import '@/assets/commercial.css';

const { pipelineEstablishments, isHydrated, loadError, cities, specialties, countByStage } = useEstablishments();

const totalEstabelecimentos = computed(() => pipelineEstablishments.value.length);

/* ---------- Estabelecimentos por etapa do funil (ranking ordinal) ---------- */

const stageCounts = computed(() =>
    COMMERCIAL_STAGES.map((stage, index) => ({
        id: stage.id,
        title: stage.title,
        count: countByStage(stage.id),
        opacity: 0.45 + (index / (COMMERCIAL_STAGES.length - 1)) * 0.55
    }))
);

const maxStageCount = computed(() => Math.max(1, ...stageCounts.value.map((s) => s.count)));

function stageTooltip(stage) {
    const pct = totalEstabelecimentos.value ? ((stage.count / totalEstabelecimentos.value) * 100).toFixed(1) : '0';
    return `${stage.title}: ${stage.count} estabelecimentos (${pct}% do total)`;
}

/* ---------- Top especialidades (ranking, hue único) ---------- */

const especialidadeCounts = computed(() => {
    const counts = new Map();
    for (const lead of pipelineEstablishments.value) {
        for (const esp of lead.especialidades) {
            counts.set(esp, (counts.get(esp) ?? 0) + 1);
        }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
});

const topEspecialidades = computed(() => especialidadeCounts.value.slice(0, 12));
const maxEspecialidadeCount = computed(() => topEspecialidades.value[0]?.[1] ?? 1);

function especialidadeTooltip([esp, count]) {
    const pct = totalEstabelecimentos.value ? ((count / totalEstabelecimentos.value) * 100).toFixed(1) : '0';
    return `${esp}: ${count} estabelecimentos (${pct}% do total)`;
}

/* ---------- Estabelecimentos por cidade (ranking, hue único) ---------- */

const cidadeCounts = computed(() => {
    const counts = new Map();
    for (const lead of pipelineEstablishments.value) {
        if (!lead.municipio) continue;
        counts.set(lead.municipio, (counts.get(lead.municipio) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
});

const maxCidadeCount = computed(() => cidadeCounts.value[0]?.[1] ?? 1);

function cidadeTooltip([cidade, count]) {
    const pct = totalEstabelecimentos.value ? ((count / totalEstabelecimentos.value) * 100).toFixed(1) : '0';
    return `${cidade}: ${count} estabelecimentos (${pct}% do total)`;
}

/* ---------- Composição por classificação (donut, paleta categórica) ---------- */

const CLASSIFICACAO_GROUPS = [
    { key: 'CLINICA', label: 'Clínica', hue: 'var(--hub-blue)' },
    { key: 'TERAPEUTICA', label: 'Terapêutica', hue: 'var(--hub-teal)' },
    { key: 'DIAGNOSTICA', label: 'Diagnóstica', hue: 'var(--hub-moat)' },
    { key: 'HOSPITAL', label: 'Hospital', hue: 'var(--hub-amber)' },
    { key: '__outros', label: 'Outros', hue: 'var(--hub-green)' }
];

const classificacaoBreakdown = computed(() => {
    const counts = new Map(CLASSIFICACAO_GROUPS.map((group) => [group.key, 0]));

    for (const lead of pipelineEstablishments.value) {
        const key = counts.has(lead.classificacao) ? lead.classificacao : '__outros';
        counts.set(key, counts.get(key) + 1);
    }

    return CLASSIFICACAO_GROUPS.map((group) => ({
        ...group,
        count: counts.get(group.key) ?? 0,
        pct: totalEstabelecimentos.value ? (counts.get(group.key) / totalEstabelecimentos.value) * 100 : 0
    })).filter((group) => group.count > 0);
});

/** Trick do "donut via stroke-dasharray": circunferência normalizada em 100. */
const DONUT_CIRCUMFERENCE = 100;

const donutSegments = computed(() => {
    let cumulative = 0;
    return classificacaoBreakdown.value.map((group) => {
        const dash = (group.pct / 100) * DONUT_CIRCUMFERENCE;
        const segment = {
            ...group,
            dasharray: `${dash} ${DONUT_CIRCUMFERENCE - dash}`,
            dashoffset: -cumulative
        };
        cumulative += dash;
        return segment;
    });
});
</script>

<template>
    <VuePressLayout>
        <div class="home-page commercial-page">
            <PageHeader
                eyebrow="Comercial"
                title="Dashboard comercial"
                subtitle="Quantidade de estabelecimentos por etapa do funil, especialidade e cidade — Vale do Paraíba."
            />

            <p v-if="loadError" class="roadmap-sync-warning">{{ loadError }}</p>
            <p v-if="!isHydrated" class="roadmap-sync-warning">Carregando dados...</p>

            <template v-if="isHydrated">
                <div class="com-dash-stats">
                    <div class="com-dash-stat">
                        <div class="com-dash-stat__value">{{ totalEstabelecimentos }}</div>
                        <div class="com-dash-stat__label">Estabelecimentos</div>
                    </div>
                    <div class="com-dash-stat">
                        <div class="com-dash-stat__value">{{ cities.length }}</div>
                        <div class="com-dash-stat__label">Cidades (Vale do Paraíba)</div>
                    </div>
                    <div class="com-dash-stat">
                        <div class="com-dash-stat__value">{{ specialties.length }}</div>
                        <div class="com-dash-stat__label">Especialidades</div>
                    </div>
                </div>

                <div class="com-dash-grid">
                    <div class="com-dash-panel com-dash-panel--wide">
                        <h2 class="com-dash-panel__title">Estabelecimentos por etapa do funil</h2>
                        <p class="com-dash-panel__subtitle">Distribuição no Pipeline comercial, do Lead à Convertido/Perdido</p>
                        <div
                            v-for="stage in stageCounts"
                            :key="stage.id"
                            class="com-bar-row"
                            :title="stageTooltip(stage)"
                        >
                            <span class="com-bar-row__label">{{ stage.title }}</span>
                            <span class="com-bar-row__track">
                                <span
                                    class="com-bar-row__fill"
                                    :style="{ width: `${(stage.count / maxStageCount) * 100}%`, '--com-bar-hue': 'var(--hub-blue)', opacity: stage.opacity }"
                                />
                            </span>
                            <span class="com-bar-row__value">{{ stage.count }}</span>
                        </div>
                    </div>

                    <div class="com-dash-panel">
                        <h2 class="com-dash-panel__title">Top especialidades</h2>
                        <p class="com-dash-panel__subtitle">Estabelecimentos que atendem cada especialidade</p>
                        <div
                            v-for="entry in topEspecialidades"
                            :key="entry[0]"
                            class="com-bar-row"
                            :title="especialidadeTooltip(entry)"
                        >
                            <span class="com-bar-row__label">{{ entry[0] }}</span>
                            <span class="com-bar-row__track">
                                <span
                                    class="com-bar-row__fill"
                                    style="--com-bar-hue: var(--hub-blue)"
                                    :style="{ width: `${(entry[1] / maxEspecialidadeCount) * 100}%` }"
                                />
                            </span>
                            <span class="com-bar-row__value">{{ entry[1] }}</span>
                        </div>
                    </div>

                    <div class="com-dash-panel">
                        <h2 class="com-dash-panel__title">Estabelecimentos por cidade</h2>
                        <p class="com-dash-panel__subtitle">Vale do Paraíba, todas as cidades da base</p>
                        <div
                            v-for="entry in cidadeCounts"
                            :key="entry[0]"
                            class="com-bar-row"
                            :title="cidadeTooltip(entry)"
                        >
                            <span class="com-bar-row__label">{{ entry[0] }}</span>
                            <span class="com-bar-row__track">
                                <span
                                    class="com-bar-row__fill"
                                    style="--com-bar-hue: var(--hub-teal)"
                                    :style="{ width: `${(entry[1] / maxCidadeCount) * 100}%` }"
                                />
                            </span>
                            <span class="com-bar-row__value">{{ entry[1] }}</span>
                        </div>
                    </div>

                    <div class="com-dash-panel com-dash-panel--wide">
                        <h2 class="com-dash-panel__title">Composição por classificação</h2>
                        <p class="com-dash-panel__subtitle">Clínica, terapêutica, diagnóstica, hospital e outros</p>
                        <div class="com-donut-wrap">
                            <svg class="com-donut" viewBox="0 0 42 42" role="img" aria-label="Composição por classificação">
                                <g class="com-donut__ring">
                                    <circle
                                        v-for="segment in donutSegments"
                                        :key="segment.key"
                                        class="com-donut__segment"
                                        cx="21"
                                        cy="21"
                                        r="15.91549431"
                                        fill="transparent"
                                        :stroke="segment.hue"
                                        stroke-width="6"
                                        :stroke-dasharray="segment.dasharray"
                                        :stroke-dashoffset="segment.dashoffset"
                                    >
                                        <title>{{ segment.label }}: {{ segment.count }} ({{ segment.pct.toFixed(1) }}%)</title>
                                    </circle>
                                </g>
                                <g class="com-donut__center">
                                    <text x="21" y="19" text-anchor="middle" class="com-donut__center-value">{{ totalEstabelecimentos }}</text>
                                    <text x="21" y="27" text-anchor="middle" class="com-donut__center-label">estab.</text>
                                </g>
                            </svg>

                            <div class="com-legend">
                                <div v-for="group in classificacaoBreakdown" :key="group.key" class="com-legend__row">
                                    <span class="com-legend__swatch" :style="{ '--com-legend-hue': group.hue }" />
                                    <span class="com-legend__label">{{ group.label }}</span>
                                    <span class="com-legend__value">{{ group.count }}</span>
                                    <span class="com-legend__pct">{{ group.pct.toFixed(1) }}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </VuePressLayout>
</template>
