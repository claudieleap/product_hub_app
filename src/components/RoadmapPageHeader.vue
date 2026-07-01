<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
    getRoadmapTypeMeta,
    parseRoadmapType,
    roadmapDevPath,
    roadmapMatrixPath
} from '@/config/roadmapTypes';

const props = defineProps({
    view: {
        type: String,
        required: true,
        validator: (value) => ['matrix', 'dev'].includes(value)
    },
    title: {
        type: String,
        required: true
    },
    lead: {
        type: String,
        default: ''
    }
});

const route = useRoute();
const roadmapType = computed(() => parseRoadmapType(route.params.type));
const typeMeta = computed(() => getRoadmapTypeMeta(roadmapType.value));
const matrixPath = computed(() => roadmapMatrixPath(roadmapType.value));
const devPath = computed(() => roadmapDevPath(roadmapType.value));
</script>

<template>
    <section class="roadmap-page-header vp-doc">
        <nav class="roadmap-breadcrumb" aria-label="Contexto do roadmap">
            <router-link :to="matrixPath" class="roadmap-breadcrumb__type">
                <i :class="typeMeta.icon" aria-hidden="true" />
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

        <div class="roadmap-page-header__row">
            <div class="roadmap-page-header__intro">
                <h1>{{ title }}</h1>
                <p v-if="lead" class="roadmap-page-header__lead">{{ lead }}</p>
            </div>
            <div v-if="$slots.actions" class="roadmap-page-header__toolbar">
                <slot name="actions" />
            </div>
        </div>
    </section>
</template>
