<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useEstablishments } from '@/composables/useEstablishments';
import { ONBOARDING_KINDS, ONBOARDING_PROJECTS } from '@/config/onboardingConfig';
import '@/assets/commercial.css';
import '@/assets/onboarding.css';

const props = defineProps({
    id: { type: String, default: '' },
    /** Esconde a barra de "Salvar alterações" (quando o dialog pai renderiza seu próprio botão, ex.: junto do Excluir). */
    hideSaveButton: { type: Boolean, default: false }
});

const { getEstablishment, updateFields, specialties, cities } = useEstablishments();

const establishment = computed(() => getEstablishment(props.id));

const kinds = ONBOARDING_KINDS;
const projects = ONBOARDING_PROJECTS;

const EDITABLE_FIELDS = [
    'fantasia', 'razaoSocial', 'kind', 'cnpj', 'cpf', 'classificacao', 'grupoEcon', 'natNd',
    'contactName', 'telefone', 'ddd', 'email', 'endereco', 'numEndereco', 'complemento', 'bairro', 'municipio', 'uf', 'cep',
    'observacao'
];

const CLASSIFICACAO_OPTIONS = ['DIAGNOSTICA', 'TERAPEUTICA', 'CLINICA', 'PRONTO SOCORRO', 'HOSPITAL', 'HOSPITAL DIA', 'ANESTESIA'];

const draft = reactive({});
const projectsDraft = ref([]);
const especialidadesDraft = ref([]);
const novaEspecialidade = ref('');
const especialidadeSuggestions = ref([]);
const saving = ref(false);
const saveError = ref(null);
const cepLoading = ref(false);
const cepError = ref(null);

function loadDraft() {
    saveError.value = null;
    cepError.value = null;
    if (!establishment.value) return;
    for (const field of EDITABLE_FIELDS) {
        draft[field] = establishment.value[field] ?? '';
    }
    especialidadesDraft.value = [...(establishment.value.especialidades ?? [])];
    novaEspecialidade.value = '';
    projectsDraft.value = [...(establishment.value.projects ?? [])];
}

function isProjectOn(projectId) {
    return projectsDraft.value.includes(projectId);
}

function toggleProject(projectId) {
    if (projectsDraft.value.includes(projectId)) {
        projectsDraft.value = projectsDraft.value.filter((id) => id !== projectId);
    } else {
        projectsDraft.value = [...projectsDraft.value, projectId];
    }
}

watch(() => establishment.value?.id, loadDraft, { immediate: true });

const isDirty = computed(() => {
    if (!establishment.value) return false;
    const fieldsChanged = EDITABLE_FIELDS.some((field) => (draft[field] ?? '') !== (establishment.value[field] ?? ''));
    const especialidadesChanged = JSON.stringify(especialidadesDraft.value) !== JSON.stringify(establishment.value.especialidades ?? []);
    const projectsChanged = JSON.stringify([...projectsDraft.value].sort()) !== JSON.stringify([...(establishment.value.projects ?? [])].sort());
    return fieldsChanged || especialidadesChanged || projectsChanged;
});

/** Salvar não depende de ter alterado algo — só de ter um nome pra identificar o registro. */
const canSave = computed(() => Boolean((draft.fantasia || '').trim()));

function addEspecialidade() {
    const value = novaEspecialidade.value.trim().toUpperCase();
    if (!value || especialidadesDraft.value.includes(value)) return;
    especialidadesDraft.value.push(value);
    novaEspecialidade.value = '';
}

function searchEspecialidades(event) {
    const query = event.query.trim().toUpperCase();
    const pool = specialties.value.filter((esp) => !especialidadesDraft.value.includes(esp));
    especialidadeSuggestions.value = query ? pool.filter((esp) => esp.includes(query)) : pool;
}

/** Busca o endereço pelo CEP (ViaCEP) e preenche logradouro/bairro/município/UF. */
async function lookupCep() {
    const cep = (draft.cep || '').replace(/\D/g, '');
    cepError.value = null;
    if (cep.length !== 8) return;

    cepLoading.value = true;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            cepError.value = 'CEP não encontrado.';
            return;
        }

        if (data.logradouro) draft.endereco = data.logradouro;
        if (data.bairro) draft.bairro = data.bairro;
        if (data.localidade) draft.municipio = data.localidade.toUpperCase();
        if (data.uf) draft.uf = data.uf;
        if (data.complemento && !draft.complemento) draft.complemento = data.complemento;
    } catch (error) {
        cepError.value = 'Não foi possível buscar o CEP agora.';
    } finally {
        cepLoading.value = false;
    }
}

function removeEspecialidade(value) {
    especialidadesDraft.value = especialidadesDraft.value.filter((esp) => esp !== value);
}

async function saveChanges() {
    if (!establishment.value) return;
    saving.value = true;
    saveError.value = null;

    const patch = { ...draft, especialidades: [...especialidadesDraft.value], projects: [...projectsDraft.value] };

    try {
        await updateFields(establishment.value.id, patch);
    } catch (error) {
        saveError.value = error.message || 'Não foi possível salvar as alterações.';
    } finally {
        saving.value = false;
    }
}

defineExpose({ isDirty, canSave, saving, saveError, saveChanges });
</script>

<template>
    <template v-if="establishment">
        <div class="com-section">
            <p class="com-section__title"><i class="pi pi-building" /> Dados Corporativos</p>
            <div class="com-field-row">
                <div class="com-field"><label>Razão social</label><InputText v-model="draft.razaoSocial" /></div>
                <div class="com-field"><label>Nome fantasia</label><InputText v-model="draft.fantasia" /></div>
            </div>
            <div class="com-field"><label>CNPJ</label><InputText v-model="draft.cnpj" placeholder="sem CNPJ" /></div>
            <div class="com-field-row">
                <div class="com-field" style="flex: 0 0 auto">
                    <label>Tipo</label>
                    <div class="onb-seg">
                        <button
                            v-for="kind in kinds"
                            :key="kind.id"
                            type="button"
                            class="onb-seg__btn"
                            :class="{ active: draft.kind === kind.id }"
                            @click="draft.kind = kind.id"
                        >
                            <i :class="kind.icon" />
                            {{ kind.label }}
                        </button>
                    </div>
                </div>
                <div class="com-field" style="flex: 0 0 auto">
                    <label>Projeto <span style="font-weight: 400; color: var(--hub-muted)">(SaaS, BPO ou os dois)</span></label>
                    <div class="onb-proj-toggle">
                        <button
                            v-for="project in projects"
                            :key="project.id"
                            type="button"
                            class="onb-tag onb-tag--toggle"
                            :class="[`onb-tag--${project.tone}`, { 'onb-tag--off': !isProjectOn(project.id) }]"
                            @click="toggleProject(project.id)"
                        >
                            <i :class="isProjectOn(project.id) ? 'pi pi-check' : project.icon" />
                            {{ project.label }}
                        </button>
                    </div>
                </div>
            </div>
            <div class="com-field">
                <label>Classificação</label>
                <Select v-model="draft.classificacao" :options="CLASSIFICACAO_OPTIONS" append-to="body" />
            </div>
            <div class="com-field"><label>Grupo econômico</label><InputText v-model="draft.grupoEcon" /></div>
        </div>

        <div class="com-section">
            <p class="com-section__title"><i class="pi pi-user" /> Responsável Legal</p>
            <div class="com-field-row">
                <div class="com-field"><label>Nome</label><InputText v-model="draft.contactName" placeholder="Pessoa de contato" /></div>
                <div class="com-field"><label>CPF</label><InputText v-model="draft.cpf" placeholder="sem CPF" /></div>
            </div>
            <div class="com-field-row">
                <div class="com-field"><label>E-mail</label><InputText v-model="draft.email" /></div>
                <div class="com-field" style="flex: 0 0 90px"><label>DDD</label><InputText v-model="draft.ddd" /></div>
                <div class="com-field"><label>Telefone</label><InputText v-model="draft.telefone" /></div>
            </div>
        </div>

        <div class="com-section">
            <p class="com-section__title">Especialidades</p>
            <div class="com-chips">
                <span v-for="esp in especialidadesDraft" :key="esp" class="com-chip">
                    {{ esp }}
                    <button type="button" class="com-chip__remove" title="Remover" @click="removeEspecialidade(esp)">
                        <i class="pi pi-times" />
                    </button>
                </span>
            </div>
            <div class="com-field" style="margin-top: 10px; max-width: 340px">
                <AutoComplete
                    v-model="novaEspecialidade"
                    :suggestions="especialidadeSuggestions"
                    dropdown
                    placeholder="Buscar entre as cadastradas ou digitar uma nova"
                    class="w-full"
                    input-class="w-full"
                    append-to="body"
                    @complete="searchEspecialidades"
                    @item-select="addEspecialidade"
                    @keyup.enter="addEspecialidade"
                />
            </div>
        </div>

        <div class="com-section">
            <p class="com-section__title">Endereço</p>
            <div class="com-field-row">
                <div class="com-field" style="flex: 0 0 160px">
                    <label>CEP</label>
                    <InputText v-model="draft.cep" placeholder="00000000" @blur="lookupCep" />
                    <span v-if="cepLoading" style="font-size: 11px; color: var(--hub-muted)">Buscando endereço...</span>
                    <span v-else-if="cepError" style="font-size: 11px; color: var(--hub-coral, #cf4a3e)">{{ cepError }}</span>
                    <span v-else style="font-size: 11px; color: var(--hub-muted)">Preenche o resto ao sair do campo</span>
                </div>
                <div class="com-field" style="flex: 2"><label>Logradouro</label><InputText v-model="draft.endereco" /></div>
                <div class="com-field" style="flex: 0 0 100px"><label>Número</label><InputText v-model="draft.numEndereco" /></div>
            </div>
            <div class="com-field-row">
                <div class="com-field"><label>Complemento</label><InputText v-model="draft.complemento" /></div>
                <div class="com-field"><label>Bairro</label><InputText v-model="draft.bairro" /></div>
            </div>
            <div class="com-field-row">
                <div class="com-field" style="flex: 0 0 80px"><label>UF</label><InputText v-model="draft.uf" /></div>
                <div class="com-field">
                    <label>Cidade</label>
                    <Select
                        v-model="draft.municipio"
                        :options="cities"
                        editable
                        filter
                        placeholder="Selecione ou digite a cidade"
                        append-to="body"
                        class="w-full"
                    />
                </div>
            </div>
        </div>

        <div class="com-section">
            <p class="com-section__title">Observação</p>
            <div class="com-field">
                <Textarea v-model="draft.observacao" rows="4" placeholder="Anotações do time..." />
            </div>
        </div>

        <div v-if="!hideSaveButton" style="display: flex; align-items: center; gap: 10px; position: sticky; bottom: 0; background: var(--hub-surface); padding-top: 8px">
            <Button type="button" label="Salvar alterações" :loading="saving" :disabled="!canSave" @click="saveChanges" />
            <span v-if="saveError" style="font-size: 12px; color: var(--hub-coral, #cf4a3e)">{{ saveError }}</span>
            <span v-else-if="isDirty" style="font-size: 12px; color: var(--hub-muted)">Alterações não salvas</span>
        </div>
    </template>
</template>
