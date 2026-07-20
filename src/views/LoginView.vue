<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import '@/assets/auth.css';

const router = useRouter();
const route = useRoute();
const { login } = useAuth();

const loginId = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function onSubmit() {
    if (!loginId.value.trim() || !password.value) return;
    loading.value = true;
    error.value = '';
    try {
        await login(loginId.value.trim(), password.value);
        const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
        router.push(redirect);
    } catch (err) {
        error.value = err.status === 401 ? 'Usuário ou senha inválidos.' : err.message || 'Não foi possível entrar.';
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="auth-shell">
        <div class="auth-card">
            <img src="/layout/images/logo.svg" alt="Aleevia" class="auth-logo" />
            <h1 class="auth-title">Product Hub</h1>
            <p class="auth-subtitle">Acesse com seu usuário do time</p>

            <form class="auth-form" @submit.prevent="onSubmit">
                <label class="auth-field">
                    <span>Usuário</span>
                    <InputText
                        v-model="loginId"
                        autofocus
                        autocomplete="username"
                        placeholder="ex.: pedro"
                    />
                </label>
                <label class="auth-field">
                    <span>Senha</span>
                    <Password
                        v-model="password"
                        :feedback="false"
                        toggle-mask
                        autocomplete="current-password"
                        input-class="auth-password-input"
                        placeholder="Sua senha"
                    />
                </label>

                <p v-if="error" class="auth-error">{{ error }}</p>

                <Button
                    type="submit"
                    label="Entrar"
                    icon="pi pi-sign-in"
                    :loading="loading"
                    class="auth-submit"
                />
            </form>

            <p class="auth-hint">
                Primeiro acesso? Use a senha padrão informada pelo admin e troque em seguida.
            </p>
        </div>
        <p class="auth-footer">Aleevia · Product Hub</p>
    </div>
</template>
