#!/usr/bin/env node

import fs from 'node:fs';

const file = process.argv[2];
const baseUrl = (process.env.VITE_API_BASE_URL || process.argv[3] || '').replace(/\/$/, '');
const apiKey = process.env.VITE_API_KEY || process.argv[4] || '';

if (!file) {
    console.error('Uso: node scripts/push-roadmap.mjs <export.json> [API_BASE_URL] [API_KEY]');
    console.error('Ou defina VITE_API_BASE_URL e VITE_API_KEY no ambiente.');
    process.exit(1);
}

if (!baseUrl || !apiKey) {
    console.error('Informe VITE_API_BASE_URL e VITE_API_KEY (env ou argumentos).');
    process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(file, 'utf8'));

const response = await fetch(`${baseUrl}/roadmap/sync`, {
    method: 'POST',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
    },
    body: JSON.stringify(payload)
});

let body = null;

try {
    body = await response.json();
} catch {
    body = null;
}

if (!response.ok) {
    console.error(body?.message || `Erro HTTP ${response.status}`);
    process.exit(1);
}

const data = body?.data ?? body;
console.log(
    `Roadmap sincronizado: ${data?.items?.length ?? payload.items?.length ?? 0} itens, ` +
        `${data?.customProducts?.length ?? payload.customProducts?.length ?? 0} módulos.`
);
