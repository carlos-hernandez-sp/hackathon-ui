# SailPoint Visual Connector Builder

> **Hackathon prototype** — build SailPoint SaaS connectors visually and export a deployable connector ZIP from the browser.

[![Node.js](https://img.shields.io/badge/Node.js-22%20recommended-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Drag nodes onto a canvas, configure them in a properties panel, wire the flow together, and download a real `custom-sailpoint-connector.zip` — no backend required.

**Live demo (local):** [http://localhost:4200/#/visual-connector-builder](http://localhost:4200/#/visual-connector-builder)

---

## Overview

The **Visual Connector Builder** is a client-side prototype built on the [SailPoint UI Development Kit](https://github.com/sailpoint-oss/ui-development-kit). It turns connector authoring from a code-first workflow into a guided visual experience while still producing standards-compliant SailPoint connector artifacts.

### The problem

Building a SailPoint SaaS connector today requires deep knowledge of the Connector SDK, `connector-spec.json`, STD commands, account/entitlement schemas, and manual TypeScript for auth, HTTP, pagination, and mappings. That creates a high barrier to entry and slow iteration.

### What this prototype does

- Provides a **visual flow canvas** for designing connector logic
- Offers **10 configurable node types** covering the full connector pipeline
- Generates a **buildable connector ZIP** aligned with `sail conn init` / NERM patterns
- Runs **entirely in the browser** — no SailPoint login needed for the demo route

---

## Quick start

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | v20.19+ or **v22.12+** (v22 recommended) |
| npm | Bundled with Node.js |
| Git | Any recent version |

### Install and run

```bash
git clone https://github.com/carlos-hernandez-sp/hackathon-ui.git
cd hackathon-ui

nvm use 22          # recommended
npm install
npm run build:components
npm run ng:serve:web
```

Open **http://localhost:4200/#/visual-connector-builder** (hash routing — include the `#`).

> No authentication is required for the Visual Connector Builder route.

For a full teammate setup guide, see **[SETUP.md](./SETUP.md)**.

---

## Demo walkthrough

1. **Add nodes** — click or drag from the left palette onto the canvas
2. **Select a node** — click it; the properties panel opens on the right
3. **Configure** — edit auth, endpoints, mappings, schemas, commands, etc.
4. **Wire the flow** — drag from an output handle (right) to an input handle (left)
5. **Export** — click **Generate Connector ZIP** in the top bar

### Suggested demo pipeline

```
Authentication → API Request → Response Parser → Pagination → Data Transform
  → Account Schema → Commands → Entitlements → Account Lifecycle → Stateful Aggregation
```

### Example pitch flow

1. Add **API Request** → `GET` + `https://api.example.com/users`
2. Add **Pagination** → offset strategy, page size `100`
3. Add **Data Transform** → map `id → identity`, `email → email`
4. Wire: API → Pagination → Transform
5. Click **Generate Connector ZIP**
6. Unzip and run `npm install && npm run build` inside the extracted folder

---

## Features

| Panel | Description |
|-------|-------------|
| **Top bar** | Title, PROTOTYPE badge, Generate Connector ZIP button |
| **Left palette** | 10 draggable node types |
| **Center canvas** | ngx-vflow grid with pan/zoom, node linking, drag-and-drop |
| **Right properties** | Context-aware forms synced to the selected node |

### Node types

| Node | Configures |
|------|------------|
| **Authentication** | API key, OAuth2, basic auth, bearer token |
| **API Request** | HTTP method, endpoint, headers |
| **Response Parser** | JSON paths for records, cursors, entitlements |
| **Pagination** | Offset or cursor strategy, page size |
| **Data Transform** | Source → target attribute mappings |
| **Account Schema** | Identity/display/group attributes and schema definitions |
| **Commands** | 14 STD command toggles |
| **Entitlements** | Groups endpoint and entitlement schema |
| **Account Lifecycle** | Create/update/delete/enable/disable/unlock/password endpoints |
| **Stateful Aggregation** | Stateful command support and state field |

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Backspace` / `Delete` | Remove selected node (when not focused in a form field) |

---

## Generated connector ZIP

Clicking **Generate Connector ZIP** downloads `custom-sailpoint-connector.zip`:

```
custom-sailpoint-connector.zip
├── connector-spec.json           # SailPoint connector specification
├── package.json                  # @sailpoint/connector-sdk dependencies
├── tsconfig.json
├── config.json.example           # Sample runtime configuration
├── .gitignore
└── src/
    ├── index.ts                  # STD command handlers
    └── custom-sailpoint-connector-client.ts   # Auth-aware HTTP client
```

The generated code is driven by the canvas — endpoints, auth, pagination, mappings, schemas, and lifecycle operations are reflected in the output.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Angular 21 + Angular Material |
| Canvas | [ngx-vflow](https://www.ngx-vflow.org/) (signal-based node editor) |
| State | Angular Signals |
| Export | JSZip + UI Kit `ConnectorCodeGenerator` |
| Base project | [sailpoint-oss/ui-development-kit](https://github.com/sailpoint-oss/ui-development-kit) |

---

## Project structure

```
projects/sailpoint-components/src/lib/visual-connector-builder/
├── visual-connector-builder.component.*   # Main 3-panel layout
├── components/
│   ├── top-bar.component.ts
│   ├── node-palette.component.ts
│   ├── properties-panel.component.ts
│   ├── flow-canvas.component.ts
│   └── nodes/                             # Custom ngx-vflow node components
├── models/                                # Node types and defaults
├── services/                              # Canvas store + ZIP export
└── utils/                                 # Canvas → WizardState mapper + client generator
```

For deeper architecture notes, see **[VISUAL-CONNECTOR-BUILDER.md](./VISUAL-CONNECTOR-BUILDER.md)**.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build:components` | Build the component library (required before serve) |
| `npm run ng:serve:web` | Start the browser demo on port 4200 |
| `npm run build:prod` | Production build of the full app |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Angular CLI requires Node v20.19+ | Run `nvm use 22` |
| Port 4200 in use | `npx ng serve -c web --port 4201` |
| Left sidebar blank | Hard-refresh; confirm URL has `#/visual-connector-builder` |
| Changes not showing after pull | `npm install && npm run build:components` |

More troubleshooting: **[SETUP.md](./SETUP.md)**

---

## Roadmap (post-hackathon)

- [ ] Flow validation before export (required nodes, incomplete config warnings)
- [ ] Save/load canvas projects
- [ ] Live API connection testing from the canvas
- [ ] Template library for common integration patterns
- [ ] Integration with Armada UI and NERM deployment pipeline

---

## References

- [SailPoint UI Development Kit](https://github.com/sailpoint-oss/ui-development-kit)
- [SailPoint Connector SDK docs](https://developer.sailpoint.com/docs/connectivity/saas-connectivity/)
- [NERM connector guide (Confluence)](https://sailpoint.atlassian.net/wiki/spaces/NSS/pages/3979379062/Building+and+Deploying+NERM+Connectors)

---

## License

MIT — based on [sailpoint-oss/ui-development-kit](https://github.com/sailpoint-oss/ui-development-kit).
