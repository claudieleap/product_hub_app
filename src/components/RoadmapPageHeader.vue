<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '@/components/PageHeader.vue';
import {
    getRoadmapTypeMeta,
    parseRoadmapType,
    roadmapBacklogPath,
    roadmapDevPath,
    roadmapMatrixPath
} from '@/config/roadmapTypes';
import RoadmapTypeIcon from '@/components/RoadmapTypeIcon.vue';

defineProps({
    view: {
        type: String,
        required: true,
        validator: (value) => ['matrix', 'backlog', 'dev'].includes(value)
    },
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        default: ''
    }
});

const route = useRoute();
const roadmapType = computed(() => parseRoadmapType(route.params.type));
const typeMeta = computed(() => getRoadmapTypeMeta(roadmapType.value));
const matrixPath = computed(() => roadmapMatrixPath(roadmapType.value));
const backlogPath = computed(() => roadmapBacklogPath(roadmapType.value));
const devPath = computed(() => roadmapDevPath(roadmapType.value));
</script>

<template>
    <PageHeader :title="title" :subtitle="subtitle">
        <template #nav>
            <nav class="roadmap-breadcrumb" aria-label="Contexto do roadmap">
                <router-link :to="matrixPath" class="roadmap-breadcrumb__type">
                    <RoadmapTypeIcon :icon="typeMeta.icon" aria-hidden="true" />
                    {{ typeMeta.label }}
                </router-link>
                <span class="roadmap-breadcrumb__sep" aria-hidden="true">/</span>
                <div class="roadmap-view-switch" role="tablist" aria-label="Visualização">
                    <router-link
                        :to="matrixPath"
                        class="roadmap-view-switch__link"
                        :class="{ active: view === 'matrix' }"
                        role="tab"
                        :aria-selected="view === 'matrix'"
                    >
                        Matriz
                    </router-link>
                    <router-link
                        :to="backlogPath"
                        class="roadmap-view-switch__link"
                        :class="{ active: view === 'backlog' }"
                        role="tab"
                        :aria-selected="view === 'backlog'"
                    >
                        Backlog
                    </router-link>
                    <router-link
                        :to="devPath"
                        class="roadmap-view-switch__link"
                        :class="{ active: view === 'dev' }"
                        role="tab"
                        :aria-selected="view === 'dev'"
                    >
                        Desenvolvimento
                    </router-link>
                </div>
            </nav>
        </template>
        <template v-if="$slots.actions" #actions>
            <slot name="actions" />
        </template>
    </PageHeader>
</template>
