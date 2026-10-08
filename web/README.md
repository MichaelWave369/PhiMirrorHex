# Φ-Mirror Hex: React research lab (E3)

A static React/Vite lab deployed to **GitHub Pages** from `web/`. No server, API token, data ingestion, or deployment secret is required.

**Production URL:** https://michaelwave369.github.io/PhiMirrorHex/

## Development

Requires Node.js 22+.

```bash
cd web
npm install
npm test
npm run dev
npm run build
```

The React app imports the **exact canonical E2 deterministic synthetic simulator** and seeded SHA-256 peer ranking from `../docs/living-hex.mjs`, avoiding a forked experimental algorithm. This source has no DOM side effects when the legacy E2 canvas is not present.

## Deploy

1. Merge the React lab PR into `main`.
2. In repository **Settings → Pages → Build and deployment**, choose **Source: GitHub Actions** if not already configured.
3. Workflow `React Lab · GitHub Pages` runs on `main` changes under `web/`, the shared E2 simulator, or the workflow; manual dispatch is also supported.
4. Wait for the GitHub Actions deploy job to be successful before treating the production URL as live. A successful PR build alone does not publish.

The legacy static `docs/` E1/E2 instrument remains available in the repository, but the published project root now serves the React app.

## What is real?

- **Exact:** the 6×6 labeling scheme, 36 channels, 37 nodes, 666 audit relations (630 peer + 36 gate), and Fibonacci budget counts.
- **Deterministic, synthetic:** frame values, conflict injections, candidate coherence score, simulated activity, seeded peer ranking.
- **Visual only:** the 3D bipyramid orientation and animated pulses.
- **Not implemented:** live agent feeds, sensor ingestion, write access, autonomous decisions, integration with PhiOS / SuperPhiVessel / NestedBubbleGear.

The 666 edge comparisons count possible logical pairs, **not** 666 physical pyramid edges and not 666 verified factual claims. `Φ` and Fibonacci remain research hypotheses that require control comparisons.

## E4 Nested Vessel tab

The VESSEL tab uses `src/NestedVessel.jsx` and `src/vessel-model.mjs` to visualize the exact finite NBG-style Keyhole experiment. No data from users or external sensors is collected. The Keyhole-depth/gear gain controls show a delayed mathematical witness and zero-gain negative control. Python/JS parity is checked by the repository CI across 80 scenarios. See [`../docs/E4_NESTED_VESSEL.md`](../docs/E4_NESTED_VESSEL.md).
