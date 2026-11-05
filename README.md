# Générateur de dégradés

Des dégradés doux et fluides, générés par un shader WebGL. Choisissez une palette, ajustez les réglages, puis exportez en PNG.

**Stack :** React 18 + Vite, déployé sur Vercel (site statique).

## Lancer en local

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173.

## Déployer sur Vercel

1. Sur [vercel.com](https://vercel.com) → **Add New Project** → importer ce dépôt GitHub.
2. Framework Preset : **Vite** (détecté automatiquement). Build : `npm run build`, dossier de sortie : `dist`.
3. Cliquer **Deploy**.

Chaque push sur la branche principale redéploie automatiquement le site.

## Structure

```
src/
├── App.jsx                 État de l'app, rendu, actions (aléatoire, export)
├── components/             Palettes, couleurs, curseurs, variations
├── data/index.js           Palettes, formats, réglages par défaut
├── hooks/useRafCallback.js Regroupe les rendus dans une frame
├── lib/renderer.js         Shader WebGL
├── lib/format.js           Calcul des dimensions selon le format
└── index.css               Styles
```
