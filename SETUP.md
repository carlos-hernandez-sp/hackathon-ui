# Team Setup Guide — Visual Connector Builder

Instructions for teammates to clone, install, and run the hackathon demo locally.

**Repo:** https://github.com/carlos-hernandez-sp/hackathon-ui

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| **Node.js** | v20.19+ or **v22.12+** (v22 recommended) |
| **npm** | Comes with Node.js |
| **Git** | Any recent version |

Check your Node version:

```bash
node -v
```

If you use **nvm**, switch to Node 22 before installing:

```bash
nvm install 22
nvm use 22
```

> **Important:** Angular CLI 21 will fail on older Node versions (e.g. v20.15).

---

## 1. Clone the repository

```bash
git clone https://github.com/carlos-hernandez-sp/hackathon-ui.git
cd hackathon-ui
```

---

## 2. Install dependencies

```bash
npm install
```

This may take a few minutes on first run.

---

## 3. Build the component library (required once)

```bash
npm run build:components
```

Run this again if you pull changes that touch files under `projects/sailpoint-components/`.

---

## 4. Start the app

```bash
npm run ng:serve:web
```

Wait until you see:

```
✔ Compiled successfully.
** Angular Live Development Server is listening on localhost:4200 **
```

---

## 5. Open the demo

In your browser, go to:

**http://localhost:4200/#/visual-connector-builder**

> Use the `#` in the URL — the app uses hash-based routing.

### No authentication required

You do **not** need to log in to SailPoint for this demo. If you land on a login/home page, go directly to the URL above.

---

## Quick demo walkthrough

1. **Left panel** — click or drag a node (API Request, Data Transform, Pagination) onto the canvas
2. **Center canvas** — connect nodes by dragging from an output handle (right) to an input handle (left)
3. **Right panel** — select a node and configure it (endpoint, mappings, pagination)
4. **Top bar** — click **Generate Connector ZIP** to download `custom-sailpoint-connector.zip`

Example flow for the pitch:

1. Add **API Request** → set `GET` + `https://api.example.com/users`
2. Add **Pagination** → offset, page size `100`
3. Add **Data Transform** → map `id → identity`, `email → email`
4. Wire: API → Pagination → Transform
5. Click **Generate Connector ZIP**

---

## Troubleshooting

### `The Angular CLI requires a minimum Node.js version of v20.19`

Upgrade Node or use nvm:

```bash
nvm install 22
nvm use 22
```

### `Port 4200 is already in use`

Stop the other process or run on a different port:

```bash
npx ng serve -c web --port 4201
```

Then open `http://localhost:4201/#/visual-connector-builder`.

### `Module not found: d3-selection` / `d3-zoom` / `d3-drag`

Reinstall dependencies:

```bash
npm install
```

### Left sidebar looks blank or white

Hard-refresh the browser (`Cmd+Shift+R` on Mac, `Ctrl+Shift+R` on Windows) and confirm you are on:

`http://localhost:4200/#/visual-connector-builder`

### App asks for SailPoint authentication

Skip it — open the Visual Connector Builder URL directly (step 5). Auth is only needed for other UI Kit features, not this prototype.

### Changes not showing after a git pull

```bash
npm install
npm run build:components
npm run ng:serve:web
```

---

## Project path (local)

After cloning, the project lives in whatever folder you cloned into, for example:

```bash
cd hackathon-ui
```

---

## Need more detail?

See [VISUAL-CONNECTOR-BUILDER.md](./VISUAL-CONNECTOR-BUILDER.md) for architecture, tech stack, and generated ZIP structure.
