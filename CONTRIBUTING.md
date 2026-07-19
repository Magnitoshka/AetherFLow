# Contributing

Thanks for improving AetherFlow.

## Local Checks

Before opening a pull request or pushing changes, run:

```bash
npm test
npm run build
```

For installer changes, also run:

```bash
npm run dist
```

## Code Style

- Keep Electron main-process logic in `src/main`.
- Keep renderer UI logic in `src/renderer`.
- Keep IPC surface small and explicit in `preload.cjs`.
- Prefer focused changes over broad refactors.
- Do not commit generated folders such as `node_modules`, `dist`, or `release`.

## Pull Request Checklist

- Explain what changed and why.
- Include screenshots for UI changes.
- Mention the validation commands you ran.
- Update user or developer docs when behavior changes.
