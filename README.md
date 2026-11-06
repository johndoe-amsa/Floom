# Générateur de dégradés

Des dégradés doux et fluides, générés par un shader WebGL. Choisissez une palette, ajustez les réglages, puis exportez en PNG.

## Mode « Couleurs de marque »

Pour créer des visuels (fonds d'écran, etc.) aux couleurs exactes d'une entreprise :

- de 1 à 8 couleurs, saisies en hex (`#1B5FC2`) ou en RGB (`27, 95, 194`) ;
- **Prédominance** : part de surface de chaque couleur. Le rendu est égalisé pour respecter ces proportions (60 / 30 / 10 donne bien 60 / 30 / 10 % de l'image) ;
- **Écart de luminosité / de teinte** : variation autorisée autour de chaque couleur saisie (0 = couleur exacte uniquement) ;
- **Fondu entre couleurs** : 0 = transitions nettes, 100 % = transitions douces ;
- l'ordre des couleurs (↑ ↓) définit quelles couleurs se touchent.

Les couleurs de marque sont mémorisées dans le navigateur. Pour des codes strictement exacts, mettre aussi les traînées de lumière et le grain à 0.

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
├── lib/renderer.js         Shader WebGL (+ passe de mesure pour l'égalisation)
├── lib/ramp.js             Rampes de couleurs (palettes, marque)
├── lib/color.js            Saisie hex/RGB, conversions OKLab
├── lib/format.js           Calcul des dimensions selon le format
└── index.css               Styles
```
