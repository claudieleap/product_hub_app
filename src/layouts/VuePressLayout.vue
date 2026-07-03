<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { isNavActive, nav, resolveSidebar } from '@/config/site';
import { parseRoadmapTypeFromPath, roadmapMatrixPath } from '@/config/roadmapTypes';
import { useRoadmapProducts } from '@/composables/useRoadmapProducts';
import RoadmapTypeIcon from '@/components/RoadmapTypeIcon.vue';

const props = defineProps({
    /** Home não exibe links de contexto na sidebar */
    home: { type: Boolean, default: false },
    /** Conteúdo full-bleed (matriz roadmap) */
    wide: { type: Boolean, default: false }
});

const route = useRoute();
const isDark = ref(false);
const asideCollapsed = ref(false);
const mobileMenuOpen = ref(false);

const ASIDE_STORAGE_KEY = 'vp-aside-collapsed';

const roadmapType = computed(() => parseRoadmapTypeFromPath(route.path));
const { allProducts } = useRoadmapProducts(roadmapType);

const sidebarGroups = computed(() => {
    if (props.home) return null;

    const base = resolveSidebar(route.path);
    if (!base) return null;

    const onMatrix = route.path.match(/^\/roadmap\/[^/]+$/) && !route.path.includes('/desenvolvimento');
    if (!onMatrix) return base;

    return [
        ...base,
        {
            text: 'Módulos',
            items: allProducts.value.map((product) => ({
                text: product.title,
                link: `${roadmapMatrixPath(roadmapType.value)}#product-${product.id}`
            }))
        }
    ];
});

function toggleAppearance() {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle('dark', isDark.value);
    localStorage.setItem('vp-appearance', isDark.value ? 'dark' : 'light');
}

function toggleAside() {
    asideCollapsed.value = !asideCollapsed.value;
    localStorage.setItem(ASIDE_STORAGE_KEY, asideCollapsed.value ? '1' : '0');
}

function toggleMobileMenu() {
    mobileMenuOpen.value = !mobileMenuOpen.value;
}

function closeMobileMenu() {
    mobileMenuOpen.value = false;
}

function isSidebarLinkActive(link) {
    if (link.includes('?tab=')) {
        const tab = new URL(link, window.location.origin).searchParams.get('tab');
        return route.path.startsWith('/documentacao') && route.query.tab === tab;
    }
    if (link.includes('#')) {
        return route.fullPath === link || route.hash === link.slice(link.indexOf('#'));
    }
    return route.path === link;
}

watch(
    () => route.fullPath,
    () => closeMobileMenu()
);

watch(mobileMenuOpen, (open) => {
    document.body.style.overflow = open ? 'hidden' : '';
});

onMounted(() => {
    isDark.value = localStorage.getItem('vp-appearance') === 'dark';
    document.documentElement.classList.toggle('dark', isDark.value);
    asideCollapsed.value = localStorage.getItem(ASIDE_STORAGE_KEY) === '1';
});

onUnmounted(() => {
    document.body.style.overflow = '';
});
</script>

<template>
    <div
        class="vp-layout"
        :class="{
            'vp-layout--full': wide,
            'vp-layout--aside-collapsed': asideCollapsed,
            'vp-layout--aside-open': mobileMenuOpen
        }"
    >
        <header class="vp-mobile-bar">
            <button
                type="button"
                class="vp-mobile-bar__hamburger"
                :title="mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'"
                :aria-label="mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'"
                :aria-expanded="mobileMenuOpen"
                @click="toggleMobileMenu"
            >
                <i :class="mobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'" />
            </button>

            <router-link :to="{ name: 'home' }" class="vp-mobile-bar__logo" @click="closeMobileMenu">
                <img src="/layout/images/logo.svg" alt="Aleevia" />
            </router-link>

            <button type="button" class="vp-mobile-bar__appearance" title="Alternar tema" @click="toggleAppearance">
                <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" />
            </button>
        </header>

        <aside class="vp-aside" :class="{ 'vp-aside--collapsed': asideCollapsed }" aria-label="Navegação principal">
            <div class="vp-aside__brand">
                <router-link :to="{ name: 'home' }" class="vp-aside__logo" @click="closeMobileMenu">
                    <img src="/layout/images/logo.svg" alt="Aleevia" />
                </router-link>
                <button
                    type="button"
                    class="vp-aside__collapse"
                    :title="asideCollapsed ? 'Expandir menu' : 'Recolher menu'"
                    :aria-label="asideCollapsed ? 'Expandir menu' : 'Recolher menu'"
                    @click="toggleAside"
                >
                    <i :class="asideCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'" />
                </button>
            </div>

            <nav class="vp-aside__nav" aria-label="Seções">
                <router-link
                    v-for="item in nav"
                    :key="item.text"
                    :to="item.link"
                    class="vp-aside__nav-link"
                    :class="{
                        active: isNavActive(item, route.path),
                        'vp-aside__nav-link--featured': item.featured
                    }"
                    :title="item.text"
                    @click="closeMobileMenu"
                >
                    <RoadmapTypeIcon :icon="item.icon" class="vp-aside__nav-icon" aria-hidden="true" />
                    <span class="vp-aside__nav-label">{{ item.text }}</span>
                </router-link>
            </nav>

            <div v-if="sidebarGroups?.length && !asideCollapsed" class="vp-aside__context">
                <div v-for="(group, index) in sidebarGroups" :key="index" class="vp-aside__group">
                    <p class="vp-aside__group-title">{{ group.text }}</p>
                    <router-link
                        v-for="item in group.items"
                        :key="item.link"
                        :to="item.link"
                        class="vp-aside__context-link"
                        :class="{ active: isSidebarLinkActive(item.link), disabled: item.disabled }"
                        @click="closeMobileMenu"
                    >
                        {{ item.text }}
                    </router-link>
                </div>
            </div>

            <div class="vp-aside__footer">
                <button
                    type="button"
                    class="vp-aside__appearance"
                    :title="asideCollapsed ? 'Alternar tema' : undefined"
                    @click="toggleAppearance"
                >
                    <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" />
                    <span v-if="!asideCollapsed" class="vp-aside__appearance-label">
                        {{ isDark ? 'Modo claro' : 'Modo escuro' }}
                    </span>
                </button>
            </div>
        </aside>

        <button
            v-if="mobileMenuOpen"
            type="button"
            class="vp-aside-overlay"
            aria-label="Fechar menu"
            @click="closeMobileMenu"
        />

        <div class="vp-main">
            <main class="vp-content" :class="{ 'vp-content--home': home, 'vp-doc-container': !wide }">
                <slot />
            </main>

            <footer class="vp-footer">Aleevia · Product Hub · estratégia compartilhada</footer>
        </div>
    </div>
</template>
