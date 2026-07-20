<script setup>
import { computed } from 'vue';

/**
 * Avatar "carinha" desenhado por features — sem imagem externa.
 * avatar: { bg, skin, hair, hairStyle: 'short'|'long'|'buzz'|'bald',
 *           chubby, glasses, goatee }
 */
const props = defineProps({
    avatar: { type: Object, default: null },
    size: { type: Number, default: 34 }
});

const a = computed(() => props.avatar ?? {});
const faceRx = computed(() => (a.value.chubby ? 17 : 14));
const hairTopRy = computed(() => (a.value.hairStyle === 'buzz' ? 13 : 16.5));
const hairTopRx = computed(() => (a.value.chubby ? 18 : 15.5));
</script>

<template>
    <svg
        :width="size"
        :height="size"
        viewBox="0 0 64 64"
        class="onb-avatar"
        role="img"
    >
        <circle cx="32" cy="32" r="32" :fill="a.bg || '#e5e7eb'" />

        <!-- cabelo comprido (atrás do rosto) -->
        <ellipse
            v-if="a.hairStyle === 'long'"
            cx="32"
            cy="41"
            :rx="a.chubby ? 20 : 18"
            ry="20"
            :fill="a.hair || '#3a3a3a'"
        />

        <!-- topo de cabelo (aparece como coroa atrás do rosto) -->
        <ellipse
            v-if="a.hairStyle !== 'bald'"
            cx="32"
            cy="29"
            :rx="hairTopRx"
            :ry="hairTopRy"
            :fill="a.hair || '#3a3a3a'"
        />

        <!-- rosto -->
        <ellipse cx="32" cy="33" :rx="faceRx" ry="16" :fill="a.skin || '#e8b98f'" />

        <!-- bochechas (gordinho) -->
        <template v-if="a.chubby">
            <circle cx="21" cy="38" r="3.2" fill="#f0928f" opacity="0.45" />
            <circle cx="43" cy="38" r="3.2" fill="#f0928f" opacity="0.45" />
        </template>

        <!-- olhos -->
        <template v-if="!a.glasses">
            <circle cx="26" cy="32" r="2" fill="#2b2b3a" />
            <circle cx="38" cy="32" r="2" fill="#2b2b3a" />
        </template>
        <template v-else>
            <circle cx="26" cy="32" r="5" fill="#ffffff" stroke="#2b2b3a" stroke-width="1.6" />
            <circle cx="38" cy="32" r="5" fill="#ffffff" stroke="#2b2b3a" stroke-width="1.6" />
            <circle cx="26" cy="32" r="1.8" fill="#2b2b3a" />
            <circle cx="38" cy="32" r="1.8" fill="#2b2b3a" />
            <line x1="31" y1="32" x2="33" y2="32" stroke="#2b2b3a" stroke-width="1.6" />
        </template>

        <!-- boca -->
        <path d="M27 40 Q32 44 37 40" fill="none" stroke="#b5566a" stroke-width="1.8" stroke-linecap="round" />

        <!-- babinha / cavanhaque -->
        <ellipse v-if="a.goatee" cx="32" cy="44.5" rx="2.6" ry="3.4" :fill="a.hair || '#3a3a3a'" />
    </svg>
</template>

<style scoped>
.onb-avatar {
    display: block;
    border-radius: 50%;
    flex: none;
}
</style>
