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
const editingAddress = ref(false);
const editingContact = ref(false);

const hasAddress = computed(() => Boolean(draft.endereco || draft.municipio || draft.bairro || draft.cep));
const hasContact = computed(() => Boolean(draft.contactName || draft.telefone || draft.email));

function formatCep(cep) {
    const digits = (cep || '').replace(/\D/g, '');
    return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : cep || '';
}

/** "(19) 3824-3233" (fixo, 8 dígitos) ou "(19) 98888-7777" (celular, 9 dígitos). */
function formatPhone(ddd, telefone) {
    const digits = (telefone || '').replace(/\D/g, '');
    const local = digits.length === 9 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits.length === 8 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
    return ddd ? `(${ddd}) ${local}` : local;
}

const phoneDisplay = computed(() => formatPhone(draft.ddd, draft.telefone));
const phoneHref = computed(() => `tel:+55${(draft.ddd || '').replace(/\D/g, '')}${(draft.telefone || '').replace(/\D/g, '')}`);

const addressLines = computed(() => {
    const streetLine = [draft.endereco, draft.numEndereco].filter(Boolean).join(', ');
    const complementLine = draft.complemento || '';
    const cityLine = [draft.bairro, [draft.municipio, draft.uf].filter(Boolean).join(' - ')].filter(Boolean).join(', ');
    const cepLine = draft.cep ? `CEP ${formatCep(draft.cep)}` : '';
    return [streetLine, complementLine, cityLine, cepLine].filter(Boolean);
});

const mapEmbedUrl = computed(() => {
    const query = [addressLines.value.join(', '), draft.cep].filter(Boolean).join(', ');
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&hl=pt-BR&output=embed`;
});

function loadDraft() {
    saveError.value = null;
    cepError.value = null;
    editingAddress.value = false;
    editingContact.value = false;
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
    if (!establishment.value) return false;
    saving.value = true;
    saveError.value = null;

    const patch = { ...draft, especialidades: [...especialidadesDraft.value], projects: [...projectsDraft.value] };

    try {
        await updateFields(establishment.value.id, patch);
        return true;
    } catch (error) {
        saveError.value = error.message || 'Não foi possível salvar as alterações.';
        return false;
    } finally {
        saving.value = false;
    }
}

defineExpose({ isDirty, canSave, saving, saveError, saveChanges });
</script>

<template>
    <template v-if="establishment">
        <div class="com-section">
            <div style="display: flex; align-items: center; justify-content: space-between">
                <p class="com-section__title" style="margin-bottom: 0"><i class="pi pi-user" /> Contato</p>
                <button
                    v-if="hasContact"
                    type="button"
                    class="com-icon-btn"
                    :title="editingContact ? 'Concluir edição' : 'Editar contato'"
                    @click="editingContact = !editingContact"
                >
                    <i :class="editingContact ? 'pi pi-check' : 'pi pi-pencil'" />
                </button>
            </div>

            <template v-if="editingContact || !hasContact">
                <div class="com-field-row" style="margin-top: 10px">
                    <div class="com-field"><label>Nome</label><InputText v-model="draft.contactName" placeholder="Pessoa de contato" /></div>
                </div>
                <div class="com-field-row">
                    <div class="com-field"><label>E-mail</label><InputText v-model="draft.email" placeholder="email@exemplo.com" /></div>
                    <div class="com-field" style="flex: 0 0 90px"><label>DDD</label><InputText v-model="draft.ddd" placeholder="11" /></div>
                    <div class="com-field"><label>Telefone</label><InputText v-model="draft.telefone" placeholder="98765-4321" /></div>
                </div>
            </template>

            <div v-else class="com-contact-view">
                <p class="com-contact-view__name">{{ draft.contactName || 'Sem nome de contato' }}</p>
                <a v-if="draft.telefone" :href="phoneHref" class="com-contact-view__row">
                    <i class="pi pi-phone" /> {{ phoneDisplay }}
                </a>
                <a v-if="draft.email" :href="`mailto:${draft.email}`" class="com-contact-view__row">
                    <i class="pi pi-envelope" /> {{ draft.email }}
                </a>
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
            <div style="display: flex; align-items: center; justify-content: space-between">
                <p class="com-section__title" style="margin-bottom: 0">Endereço</p>
                <button
                    v-if="hasAddress"
                    type="button"
                    class="com-icon-btn"
                    :title="editingAddress ? 'Concluir edição' : 'Editar endereço'"
                    @click="editingAddress = !editingAddress"
                >
                    <i :class="editingAddress ? 'pi pi-check' : 'pi pi-pencil'" />
                </button>
            </div>

            <template v-if="editingAddress || !hasAddress">
                <div class="com-field-row" style="margin-top: 10px">
                    <div class="com-field" style="flex: 0 0 160px">
                        <label>CEP</label>
                        <InputText v-model="draft.cep" placeholder="00000000" @blur="lookupCep" />
                        <span v-if="cepLoading" style="font-size: 11px; color: var(--hub-muted)">Buscando endereço...</span>
                        <span v-else-if="cepError" style="font-size: 11px; color: var(--hub-coral, #cf4a3e)">{{ cepError }}</span>
                        <span v-else style="font-size: 11px; color: var(--hub-muted)">Preenche o resto ao sair do campo</span>
                    </div>
                    <div class="com-field" style="flex: 2"><label>Logradouro</label><InputText v-model="draft.endereco" placeholder="Rua, avenida..." /></div>
                    <div class="com-field" style="flex: 0 0 100px"><label>Número</label><InputText v-model="draft.numEndereco" placeholder="Nº" /></div>
                </div>
                <div class="com-field-row">
                    <div class="com-field"><label>Complemento</label><InputText v-model="draft.complemento" placeholder="Apto, sala..." /></div>
                    <div class="com-field"><label>Bairro</label><InputText v-model="draft.bairro" placeholder="Bairro" /></div>
                </div>
                <div class="com-field-row">
                    <div class="com-field" style="flex: 0 0 80px"><label>UF</label><InputText v-model="draft.uf" placeholder="SP" /></div>
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
            </template>

            <div v-else class="com-address-view">
                <p v-for="line in addressLines" :key="line" class="com-address-view__line">{{ line }}</p>
                <div class="com-address-view__map">
                    <iframe
                        :src="mapEmbedUrl"
                        title="Mapa do endereço"
                        loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade"
                    />
                </div>
            </div>
        </div>

        <div class="com-section">
            <p class="com-section__title"><i class="pi pi-building" /> Dados Corporativos</p>
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
                    <div class="onb-seg">
                        <button
                            v-for="project in projects"
                            :key="project.id"
                            type="button"
                            class="onb-seg__btn"
                            :class="{ active: isProjectOn(project.id) }"
                            @click="toggleProject(project.id)"
                        >
                            <i :class="isProjectOn(project.id) ? 'pi pi-check' : project.icon" />
                            {{ project.label }}
                        </button>
                    </div>
                </div>
            </div>
            <div class="com-field-row">
                <div class="com-field"><label>Razão social</label><InputText v-model="draft.razaoSocial" placeholder="Razão social da empresa" /></div>
                <div class="com-field"><label>Nome fantasia</label><InputText v-model="draft.fantasia" placeholder="Nome fantasia" /></div>
            </div>
            <div class="com-field-row">
                <div class="com-field"><label>CNPJ</label><InputMask v-model="draft.cnpj" mask="99.999.999/9999-99" :unmask="true" placeholder="sem CNPJ" /></div>
                <div class="com-field"><label>CPF</label><InputMask v-model="draft.cpf" mask="999.999.999-99" :unmask="true" placeholder="sem CPF" /></div>
            </div>
            <div class="com-field-row">
                <div class="com-field">
                    <label>Classificação</label>
                    <Select v-model="draft.classificacao" :options="CLASSIFICACAO_OPTIONS" placeholder="Selecione a classificação" append-to="body" />
                </div>
                <div class="com-field"><label>Grupo econômico</label><InputText v-model="draft.grupoEcon" placeholder="Sem vínculo com grupo econômico" /></div>
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
