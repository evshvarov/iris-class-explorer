# Welcome to your Lovable project

TODO: Document your project here

## Build and package flow

- `npm run build` compiles the frontend into `dist/`.
- `docker compose build` now runs a frontend build stage first, then copies `dist/` into the IRIS image before `zpm load`.
- `module.xml` deploys the compiled static files from `dist/` as the CSP application at `/iris-table-stats-ui`.
