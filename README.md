# Prototype

Minimal React + Vite project for prototyping scenarios.

## Getting started

```bash
npm install
npm run dev
```

## Adding a scenario

1. Create a component in `src/scenarios/`.
2. Register it in `src/scenarios.jsx` (add `path`, `title`, `description`, `component`).

It automatically appears on the home page and gets a route at `/{path}`.
