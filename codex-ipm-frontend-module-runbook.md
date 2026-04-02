# Codex Runbook: Convert a Frontend App into an IPM-Installable IRIS Web Module

This file is written for a future Codex agent.

Goal: take an existing frontend app in a repo, make it build into static assets, and package those assets as an IRIS web application installable through IPM/ZPM.

Use this as an operational checklist, not as generic documentation.

## Target outcome

After the change:

- `npm run build` creates a production bundle in `dist/`
- `docker compose build` builds the frontend before IRIS package loading
- the IRIS package creates a web app such as `/my-ui`
- IPM copies `dist/` into the IRIS CSP directory
- opening `http://host:port/my-ui/` or `http://host:port/my-ui/index.html` loads the SPA correctly
- CSS and JS assets resolve under `/my-ui/assets/...`, not `/assets/...`

## What to inspect first

Before editing anything, inspect:

- frontend build system: `package.json`, `vite.config.*` or equivalent
- router setup: `src/App.*`, `src/main.*`
- IRIS package definition: `module.xml`
- container build path: `Dockerfile`, `docker-compose.yml`
- IRIS bootstrap script: `iris.script` or equivalent

You need to know:

- where the frontend currently outputs production assets
- what URL the IRIS web app should use
- whether the router assumes root deployment
- whether IPM/ZPM is already installed in the image

## Required frontend changes

### 1. Build into `dist`

Ensure the frontend emits a static production build into `dist/`.

For Vite:

- set `build.outDir = "dist"`
- keep `emptyOutDir = true`

Example:

```ts
build: {
  outDir: "dist",
  emptyOutDir: true,
}
```

### 2. Add a stable build script

Make sure `package.json` has a script that the Docker build can call consistently.

Example:

```json
"scripts": {
  "build": "vite build",
  "build:dist": "npm run build"
}
```

`build:dist` is useful because it gives Codex a stable integration point even if the frontend framework changes later.

### 3. Set the production base path

If the app is served from `/my-ui/` inside IRIS, the production bundle must use that same prefix.

For Vite:

- in development use `/`
- in production use `/<web-app-name>/`

Example:

```ts
export default defineConfig(({ mode }) => {
  const productionBasePath = "/my-ui/";

  return {
    base: mode === "development" ? "/" : productionBasePath,
    // ...
  };
});
```

Without this, generated `index.html` will request `/assets/...` and IRIS will return `404`.

### 4. Fix SPA router basename

If the app uses `BrowserRouter`, it must be told that it is mounted below `/my-ui`.

Example:

```tsx
const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "");

<BrowserRouter basename={routerBasename}>
```

Without this, routes resolve as if the app lived at `/`.

### 5. Handle `/index.html`

IRIS often serves the app entrypoint as `/my-ui/index.html`.
React Router then sees `/index.html` inside the basename-scoped app.

Add an explicit route:

```tsx
<Route path="/" element={<Index />} />
<Route path="/index.html" element={<Index />} />
```

If this is not added, the app may render the Not Found page even though assets load correctly.

## Required IRIS/IPM packaging changes

### 6. Do not use deprecated `CSPApplication` for this

Avoid relying on:

```xml
<CSPApplication ... SourcePath="dist" ... />
```

This is deprecated and can behave unexpectedly. In this repo it tried to resolve `.DIST/` and failed.

Use `WebApplication` plus `FileCopy` instead.

### 7. Create the IRIS web app with `WebApplication`

In `module.xml`, define the web app explicitly.

Example:

```xml
<WebApplication
  Name="/my-ui"
  NameSpace="USER"
  Path="${cspdir}my-ui/"
  Recurse="1"
  ServeFiles="1"
  CookiePath="/my-ui"
/>
```

Important:

- `Name` is the URL path
- `Path` is the filesystem target inside IRIS CSP storage
- `CookiePath` must also be the URL path, not the filesystem path

### 8. Copy `dist/` with `FileCopy`

Still in `module.xml`, add:

```xml
<FileCopy Name="dist/" Target="${cspdir}my-ui/" Defer="1"/>
```

This is the actual static file deployment step.

Expected IPM log during activation:

```text
Copying /home/irisowner/dev/dist/ to /usr/irissys/csp/my-ui/ as directory
```

### 9. Keep the module metadata minimal and valid

A working minimal shape is:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Export generator="Cache" version="25">
  <Document name="my-module.ZPM">
    <Module>
      <Name>my-module</Name>
      <Version>1.0.0</Version>
      <Description>Frontend module</Description>
      <Packaging>module</Packaging>

      <FileCopy Name="dist/" Target="${cspdir}my-ui/" Defer="1"/>

      <WebApplication
        Name="/my-ui"
        NameSpace="USER"
        Path="${cspdir}my-ui/"
        Recurse="1"
        ServeFiles="1"
        CookiePath="/my-ui"
      />
    </Module>
  </Document>
</Export>
```

## Required Docker/build integration changes

### 10. Build the frontend before IRIS package loading

Use a multistage Dockerfile.

Pattern:

1. Node stage installs frontend dependencies
2. Node stage runs `npm run build:dist`
3. IRIS stage copies the repo
4. IRIS stage copies built `dist/` from the Node stage
5. IRIS bootstrap loads the package with IPM/ZPM

Example:

```Dockerfile
FROM node:20-alpine AS frontend-build

WORKDIR /frontend
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build:dist

FROM containers.intersystems.com/intersystems/iris-community:2025.3

WORKDIR /home/irisowner/dev/
USER ${ISC_PACKAGE_MGRUSER}

COPY --chown=${ISC_PACKAGE_MGRUSER}:${ISC_PACKAGE_IRISGROUP} . .
COPY --from=frontend-build --chown=${ISC_PACKAGE_MGRUSER}:${ISC_PACKAGE_IRISGROUP} /frontend/dist ./dist
```

If the lockfile is stale and `npm ci` fails, either:

- refresh `package-lock.json`, then keep `npm ci`, or
- temporarily use `npm install`

Prefer a valid lockfile plus `npm ci` when possible.

### 11. Add `.dockerignore`

Keep the Docker context clean.

Minimum useful entries:

```text
node_modules
dist
dist-ssr
.git
.gitignore
.DS_Store
```

### 12. Install IPM/ZPM before loading the package

If the image does not already have ZPM/IPM available, fetch and load it first.

One workable pattern is:

- in `Dockerfile`, download installer XML to `/tmp/zpm.xml`
- in `iris.script`, load that XML from `%SYS`

Example Docker step:

```Dockerfile
RUN wget https://pm.community.intersystems.com/packages/zpm/0.9.2/installer -O /tmp/zpm.xml
```

Example script shape:

```objectscript
zn "%SYS"
do $system.OBJ.Load("/tmp/zpm.xml", "ck")
zpm "enable -map -globally"
zpm "enable -community"

zn "USER"
zpm "load /home/irisowner/dev/ -v":1:1
halt
```

If ZPM commands fail, inspect the exact shell syntax expected by that image/version. Do not assume every IRIS image behaves identically.

## Validation workflow

Always validate in this order.

### 13. Local frontend build

Run:

```bash
npm run build
```

Check:

- `dist/index.html` exists
- `dist/assets/*` exists
- generated HTML references `/<web-app-name>/assets/...`

For example:

```html
<script type="module" src="/my-ui/assets/index-xxxxx.js"></script>
<link rel="stylesheet" href="/my-ui/assets/index-xxxxx.css">
```

### 14. Docker image build

Run:

```bash
docker compose build
```

Look for:

- frontend build succeeds
- `COPY --from=frontend-build /frontend/dist ./dist` succeeds
- IPM activation logs create/update the web app
- IPM copies `dist/` into the IRIS CSP folder

### 15. Runtime verification

After container start:

- open `http://localhost:<port>/<web-app-name>/`
- open `http://localhost:<port>/<web-app-name>/index.html`

Both should render the app.

If only `/index.html` works, the web app is present but the default path handling is incomplete.
If only `/` works, IRIS may be serving the directory index differently than expected.

## Failure patterns and fixes

### 16. Assets 404 at `/assets/...`

Symptom:

- `index.html` loads
- JS and CSS requests go to `/assets/...`
- browser shows 404

Cause:

- missing production `base` in the frontend config

Fix:

- set production base to `/<web-app-name>/`

### 17. App shows Not Found for `/index.html`

Symptom:

- assets load
- SPA renders a custom 404 or route-not-found screen

Cause:

- router only defines `/`
- IRIS served `/index.html`

Fix:

- add route for `/index.html`

### 18. IPM tries to copy `.DIST/`

Symptom:

- activation fails with a directory like `/home/irisowner/dev/.DIST/ does not exist`

Cause:

- deprecated `CSPApplication` + `SourcePath` behavior

Fix:

- replace it with `FileCopy` and `WebApplication`

### 19. Build works locally but not in Docker

Symptom:

- `npm run build` works locally
- Docker frontend stage fails on dependency install

Cause:

- stale lockfile
- different package manager expectations in the container

Fix:

- refresh `package-lock.json`
- prefer `npm ci` only after the lockfile matches `package.json`

### 20. Router paths still wrong after setting `base`

Symptom:

- assets load correctly
- internal navigation or refresh on nested routes fails

Cause:

- missing `BrowserRouter basename`

Fix:

- derive basename from `import.meta.env.BASE_URL`

## Minimal Codex execution plan

When asked to repeat this work for another frontend repo, do this:

1. Inspect `package.json`, frontend config, router, `module.xml`, `Dockerfile`, and IRIS scripts.
2. Identify the target web app URL, for example `/some-ui`.
3. Configure the frontend to build to `dist/`.
4. Configure production asset base to `/<some-ui>/`.
5. Configure router basename from the build base.
6. Add an `/index.html` route if using React Router and IRIS serves that path.
7. Replace deprecated `CSPApplication` packaging with `FileCopy + WebApplication`.
8. Ensure Docker builds the frontend before `zpm load`.
9. Ensure IPM/ZPM is available before loading the package.
10. Validate with `npm run build` and `docker compose build`.
11. Confirm the build log shows `dist/` copied into IRIS CSP storage.
12. Confirm the app works from both `/<some-ui>/` and `/<some-ui>/index.html`.

## Expected final file touch points

For a typical Vite + React + IRIS repo, expect to edit:

- `vite.config.ts`
- `src/App.tsx`
- `package.json`
- `module.xml`
- `Dockerfile`
- `.dockerignore`
- optionally `iris.script`

## Notes from this repo

These were the concrete decisions that worked here:

- Vite production base: `/iris-table-stats-ui/`
- React Router basename derived from `import.meta.env.BASE_URL`
- explicit route for `/index.html`
- IPM packaging via:
  - `<FileCopy Name="dist/" Target="${cspdir}iris-table-stats-ui/" Defer="1"/>`
  - `<WebApplication Name="/iris-table-stats-ui" ... />`
- frontend build integrated into the Docker build via multistage Node -> IRIS flow

If asked to do this again, start from this runbook rather than rediscovering the failure modes.
