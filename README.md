# Product Hub App

Frontend do **Product Hub** Aleevia — Vue 3, Vite, PrimeVue e Tailwind.

## Stack

- Vue 3 + Vue Router
- Vite 8
- PrimeVue 4 + PrimeIcons
- Tailwind CSS 4
- Axios

## Desenvolvimento

```bash
npm install
npm run dev
```

## Rotas

- `/` — Home do Product Hub
- `/roadmap` — Matriz de prioridades
- `/roadmap/desenvolvimento` — Board kanban de desenvolvimento
- `/status` — Health check da API

Configure `VITE_API_BASE_URL=/api/v1` no `.env` para sincronizar com o backend.

## Variáveis

Copie `.env.example` para `.env` se precisar apontar para outra URL de API.

## Build

```bash
npm run build
npm run preview
```
