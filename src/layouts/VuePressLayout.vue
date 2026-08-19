<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { dashboardNavItem, homeNavItem, isNavActive, navGroups, resolveSidebar } from '@/config/site';
import { parseRoadmapTypeFromPath, roadmapMatrixPath } from '@/config/roadmapTypes';
import { useRoadmapProducts } from '@/composables/useRoadmapProducts';
import { useAuth } from '@/composables/useAuth';
import RoadmapTypeIcon from '@/components/RoadmapTypeIcon.vue';
import ProductHubLogo from '@/components/ProductHubLogo.vue';

const props = defineProps({
    /** Home não exibe links de contexto na sidebar */
    home: { type: Boolean, default: false },
    /** Conteúdo full-bleed (matriz roadmap) */
    wide: { type: Boolean, default: false }
});

const route = useRoute();
const router = useRouter();
const isDark = ref(false);
const asideCollapsed = ref(false);
const mobileMenuOpen = ref(false);

const ASIDE_STORAGE_KEY = 'vp-aside-collapsed';

const { user, isAdmin, logout } = useAuth();
const visibleNavGroups = computed(() =>
    navGroups
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => !item.adminOnly || isAdmin.value)
        }))
        .filter((group) => group.items.length)
);

async function onLogout() {
    await logout();
    router.push('/login');
}

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
                <ProductHubLogo :size="26" />
            </router-link>

            <button type="button" class="vp-mobile-bar__appearance" title="Alternar tema" @click="toggleAppearance">
                <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" />
            </button>
        </header>

        <aside class="vp-aside" :class="{ 'vp-aside--collapsed': asideCollapsed }" aria-label="Navegação principal">
            <div class="vp-aside__brand">
                <router-link :to="{ name: 'home' }" class="vp-aside__logo" @click="closeMobileMenu">
                    <ProductHubLogo :variant="asideCollapsed ? 'mark' : 'full'" :size="26" />
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
                    :to="dashboardNavItem.link"
                    class="vp-aside__nav-link"
                    :class="{ active: isNavActive(dashboardNavItem, route.path) }"
                    :title="dashboardNavItem.text"
                    @click="closeMobileMenu"
                >
                    <RoadmapTypeIcon :icon="dashboardNavItem.icon" class="vp-aside__nav-icon" aria-hidden="true" />
                    <span class="vp-aside__nav-label">{{ dashboardNavItem.text }}</span>
                </router-link>

                <router-link
                    :to="homeNavItem.link"
                    class="vp-aside__nav-link"
                    :class="{ active: isNavActive(homeNavItem, route.path) }"
                    :title="homeNavItem.text"
                    @click="closeMobileMenu"
                >
                    <RoadmapTypeIcon :icon="homeNavItem.icon" class="vp-aside__nav-icon" aria-hidden="true" />
                    <span class="vp-aside__nav-label">{{ homeNavItem.text }}</span>
                </router-link>

                <div v-for="group in visibleNavGroups" :key="group.text" class="vp-aside__nav-group">
                    <p v-if="!asideCollapsed" class="vp-aside__nav-group-title">{{ group.text }}</p>
                    <router-link
                        v-for="item in group.items"
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
                </div>
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

                <div v-if="user" class="vp-aside__user" :class="{ 'vp-aside__user--collapsed': asideCollapsed }">
                    <span class="vp-aside__user-avatar" :title="user.name">
                        {{ (user.name || user.username || '?').charAt(0).toUpperCase() }}
                    </span>
                    <span v-if="!asideCollapsed" class="vp-aside__user-info">
                        <span class="vp-aside__user-name">{{ user.name }}</span>
                        <span class="vp-aside__user-role">{{ isAdmin ? 'Admin' : 'Usuário' }}</span>
                    </span>
                    <button
                        type="button"
                        class="vp-aside__logout"
                        title="Sair"
                        aria-label="Sair"
                        @click="onLogout"
                    >
                        <i class="pi pi-sign-out" />
                    </button>
                </div>
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

<style scoped>
.vp-aside__user {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
    padding-top: 12px;
    border-top: 1px solid rgba(120, 130, 150, 0.18);
}

.vp-aside__user--collapsed {
    justify-content: center;
}

.vp-aside__user-avatar {
    flex: none;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #1e4fe0;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
}

.vp-aside__user-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    line-height: 1.2;
}

.vp-aside__user-name {
    font-size: 13px;
    font-weight: 600;
    color: inherit;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.vp-aside__user-role {
    font-size: 11px;
    opacity: 0.6;
}

.vp-aside__logout {
    flex: none;
    border: none;
    background: transparent;
    color: inherit;
    opacity: 0.65;
    cursor: pointer;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.vp-aside__logout:hover {
    opacity: 1;
    background: rgba(207, 74, 62, 0.12);
    color: #cf4a3e;
}
</style>
