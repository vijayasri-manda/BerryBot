# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
# Vercel deployment

Set the Vercel project Root Directory to `frontend`, use the Vite framework
preset, Build Command `npm run build`, and Output Directory `dist`.

The application calls `/api` on its own origin. `vercel.json` forwards those
requests to `https://berrybot-1-oafp.onrender.com/api`, including authentication,
resume uploads, interview operations, and PDF downloads. Vite's development
proxy applies only when running locally; Vercel needs this separate rewrite.

After changing the configuration, deploy the latest `main` commit and check
`https://berry-bot-xi.vercel.app/api/health`. It should return JSON containing
`"status": "healthy"`, rather than HTML or a Vercel 404 response.

If the Render service URL changes, update the rewrite destination and redeploy.
No frontend API URL environment variable is required for this configuration.

