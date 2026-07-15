# SailPoint Visual Connector Builder [PROTOTYPE]

A fully client-side, visual prototype for building SailPoint SaaS connectors. Built on the [SailPoint UI Development Kit](https://github.com/sailpoint-oss/ui-development-kit) (Armada ecosystem) with **Angular 21**, **ngx-vflow**, and **JSZip**.

Drag nodes onto a canvas, wire them together, configure properties, and download a real `custom-sailpoint-connector.zip` — no backend required.

## Quick Start

**Requirements:** Node.js v20.19+ or v22.12+ (v22 recommended)

```bash
# Use Node 22 if available (required by Angular CLI 21)
nvm use 22

# Install dependencies (includes ngx-vflow + d3 peer deps)
npm install

# Build the component library (required once)
npm run build:components

# Start the browser demo (no Electron)
npm run ng:serve:web
```

Open [http://localhost:4200/#/visual-connector-builder](http://localhost:4200/#/visual-connector-builder)

> **No authentication required** — the Visual Connector Builder bypasses SailPoint login entirely.

## Demo Script (Executive Pitch)

1. Open the app — three-panel builder loads with an empty canvas
2. Click or drag **API Request** from the palette → set `GET` + `https://api.example.com/users`
3. Add **Data Transform** → map `id → identity`, `email → email`
4. Add **Pagination** → set offset strategy, page size 100
5. Wire nodes: API → Pagination → Transform (drag from output handle to input handle)
6. Click **Generate Connector ZIP** — browser downloads `custom-sailpoint-connector.zip`
7. Unzip to show `connector-spec.json` + `src/index.ts` with your configured endpoints and mappings

## Features

| Panel | Description |
|-------|-------------|
| **Top Bar** | Title, PROTOTYPE badge, Generate Connector ZIP button |
| **Left Palette** | Draggable API Request, Data Transform, Pagination nodes |
| **Center Canvas** | ngx-vflow grid with pan/zoom, edge wiring, node selection |
| **Right Properties** | Context-aware forms synced instantly to selected node |

## Generated ZIP Structure

```
custom-sailpoint-connector.zip
├── connector-spec.json      # SailPoint connector specification
├── package.json             # @sailpoint/connector-sdk dependencies
├── tsconfig.json
└── src/
    ├── index.ts             # Connector SDK boilerplate with your config
    └── custom-sailpoint-connector-client.ts
```

## Tech Stack

- **Angular 21** + Angular Material (Armada-adjacent styling)
- **ngx-vflow** — signal-based node canvas (React Flow equivalent)
- **Angular Signals** — canvas state management
- **JSZip** — client-side ZIP generation
- **ConnectorCodeGenerator** — reused from UI Kit's SaaS Connectivity Creator

## Keyboard Shortcuts

- **Backspace / Delete** — remove selected node (when not focused in a form field)

## Project Structure

```
projects/sailpoint-components/src/lib/visual-connector-builder/
├── visual-connector-builder.component.*   # Main 3-panel layout
├── components/
│   ├── top-bar.component.ts
│   ├── node-palette.component.ts
│   ├── properties-panel.component.ts
│   ├── flow-canvas.component.ts
│   └── nodes/                             # Custom ngx-vflow node components
├── models/                                # Node types and canvas state
├── services/                              # Store + ZIP export
└── utils/                                 # Canvas → WizardState mapper
```

## Hackathon Notes

- Built for the Mexico Engineering Hackathon — 100% frontend, demo-ready
- Uses public SailPoint UI Development Kit components (Armada design language)
- Internal Armada `slpt-*` components can be swapped in post-hackathon if registry access is available

## License

MIT — based on [sailpoint-oss/ui-development-kit](https://github.com/sailpoint-oss/ui-development-kit)
