<script setup>
/**
 * Logotipo do Product Hub — marca "hub" (nó central + satélites conectados)
 * + wordmark. SVG inline, sem asset externo (offline/CSP-safe).
 */
import { computed } from 'vue';

const props = defineProps({
    variant: {
        type: String,
        default: 'full', // 'full' = marca + texto | 'mark' = só a marca
        validator: (v) => ['full', 'mark'].includes(v)
    },
    size: { type: Number, default: 30 }
});

const gid = `ph-grad-${Math.random().toString(36).slice(2, 8)}`;
const markStyle = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }));
const wordSize = computed(() => `${Math.round(props.size * 0.62)}px`);
</script>

<template>
    <span class="ph-logo">
        <svg
            class="ph-logo__mark"
            :style="markStyle"
            viewBox="0 0 48 48"
            role="img"
            aria-label="Product Hub"
        >
            <defs>
                <linearGradient :id="gid" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#3b6bf0" />
                    <stop offset="1" stop-color="#1636b0" />
                </linearGradient>
            </defs>
            <rect x="2" y="2" width="44" height="44" rx="13" :fill="`url(#${gid})`" />

            <!-- rede do hub -->
            <g stroke="#ffffff" stroke-linecap="round" fill="none">
                <path d="M24 24 L24 11" stroke-width="2.2" opacity="0.9" />
                <path d="M24 24 L12.5 32" stroke-width="2.2" opacity="0.9" />
                <path d="M24 24 L35.5 32" stroke-width="2.2" opacity="0.9" />
                <path d="M24 11 L12.5 32 L35.5 32 Z" stroke-width="1.4" opacity="0.3" />
            </g>
            <g fill="#ffffff">
                <circle cx="24" cy="24" r="4" />
                <circle cx="24" cy="11" r="2.9" />
                <circle cx="12.5" cy="32" r="2.9" />
                <circle cx="35.5" cy="32" r="2.9" />
            </g>
        </svg>

        <span v-if="variant === 'full'" class="ph-logo__word" :style="{ fontSize: wordSize }">
            Product<span class="ph-logo__word-accent">Hub</span>
        </span>
    </span>
</template>

<style scoped>
.ph-logo {
    display: inline-flex;
    align-items: center;
    gap: 9px;
}

.ph-logo__mark {
    flex: none;
    display: block;
    filter: drop-shadow(0 2px 5px rgba(22, 54, 176, 0.28));
}

.ph-logo__word {
    font-family: Inter, system-ui, sans-serif;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #0c1b2a;
    line-height: 1;
    white-space: nowrap;
}

.ph-logo__word-accent {
    color: #1e4fe0;
    margin-left: 0.28em;
}

:global(.dark) .ph-logo__word {
    color: #f1f4fb;
}
</style>
