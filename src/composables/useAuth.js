import { computed, reactive } from 'vue';
import { authApi, setAuthToken } from '@/api/authClient';

const TOKEN_KEY = 'product-hub-auth-token';
const USER_KEY = 'product-hub-auth-user';

const state = reactive({
    token: null,
    user: null,
    ready: false
});

function persist() {
    if (state.token) {
        localStorage.setItem(TOKEN_KEY, state.token);
    } else {
        localStorage.removeItem(TOKEN_KEY);
    }
    if (state.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(state.user));
    } else {
        localStorage.removeItem(USER_KEY);
    }
}

function restore() {
    if (state.ready) return;
    try {
        state.token = localStorage.getItem(TOKEN_KEY);
        const raw = localStorage.getItem(USER_KEY);
        state.user = raw ? JSON.parse(raw) : null;
    } catch {
        state.token = null;
        state.user = null;
    }
    setAuthToken(state.token);
    state.ready = true;
}

restore();

function clearSession() {
    state.token = null;
    state.user = null;
    setAuthToken(null);
    persist();
}

async function login(loginId, password) {
    const data = await authApi.login(loginId, password);
    state.token = data.token;
    state.user = data.user;
    setAuthToken(state.token);
    persist();
    return data.user;
}

async function logout() {
    try {
        if (state.token) await authApi.logout();
    } catch {
        // ignora erro de rede no logout — limpa a sessão de qualquer forma
    }
    clearSession();
}

function setUser(user) {
    state.user = user;
    persist();
}

export function useAuth() {
    return {
        user: computed(() => state.user),
        isAuthenticated: computed(() => Boolean(state.token && state.user)),
        isAdmin: computed(() => state.user?.role === 'admin'),
        mustChangePassword: computed(() => Boolean(state.user?.mustChangePassword)),
        login,
        logout,
        setUser,
        clearSession
    };
}
