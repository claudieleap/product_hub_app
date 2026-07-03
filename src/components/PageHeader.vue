<script setup>
defineProps({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        default: ''
    },
    eyebrow: {
        type: String,
        default: ''
    },
    variant: {
        type: String,
        default: 'bordered',
        validator: (value) => ['bordered', 'hero', 'plain'].includes(value)
    }
});
</script>

<template>
    <section
        class="page-header vp-doc"
        :class="{
            'page-header--bordered': variant === 'bordered',
            'page-header--hero': variant === 'hero'
        }"
    >
        <div v-if="$slots.nav" class="page-header__nav">
            <slot name="nav" />
        </div>

        <div class="page-header__row">
            <div class="page-header__intro">
                <p v-if="eyebrow" class="page-header__eyebrow">{{ eyebrow }}</p>
                <h1 class="page-header__title">{{ title }}</h1>
                <p v-if="subtitle || $slots.subtitle" class="page-header__subtitle">
                    <slot name="subtitle">{{ subtitle }}</slot>
                </p>
            </div>
            <div v-if="$slots.actions" class="page-header__toolbar">
                <slot name="actions" />
            </div>
        </div>
    </section>
</template>
