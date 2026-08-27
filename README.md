# Campus Circular

Campus Circular is a frontend-only campus resource-sharing app for moving from ownership to access. It uses realistic mocked campus data, a deterministic simulated clock, explainable matching, and browser-local persistence so the complete demo works without a backend.

## Functionality

1. **Discover** (`/`) — Search, filter, sort, and browse approved nearby resources.
2. **Need-based discovery** (`/need`) — Parse a natural-language need into an explainable resource kit.
3. **Item preview** (`/item/:id`) — Review availability, owner trust, usage history, charges, and request an item.
4. **Borrowing agreement** (`/agreement/:resourceId`) — Review responsibilities and consent before requesting an exchange.
5. **My exchanges** (`/exchanges`) — See borrowing, lending, and community requests.
6. **Exchange lifecycle** (`/exchanges/:id`) — Manage handover, return, inspection, disputes, settlement, and ratings.
7. **List a resource** (`/list`) — Submit a multi-step resource listing for approval.
8. **Trust profile** (`/profile/:id`) — Review member trust, activity, listings, and reviews.
9. **Community requests** (`/requests`) — Ask the campus for an item or offer a resource to a requester.
10. **Impact dashboard** (`/impact`) — View state-derived sharing, savings, reuse, return, category, and lender metrics.
11. **Admin login** (`/admin/login`) — Enter the mock operations console.
12. **Admin dashboard** (`/admin`) — Moderate users/resources, monitor exchanges, resolve disputes, and edit fee settings.
13. **Demo controls** — Switch personas, advance simulated time, and reset the local demo from the header.

## Mock data and persistence

All seed data lives in `src/data/seed.ts`. The app includes users, resources, requests, exchange lifecycle examples, disputes, ratings, and varied availability. State is persisted in `localStorage` under `cc.state.v1` with a version guard; incompatible or malformed saved data automatically falls back to the seed.

No network images are used. Resource imagery is deterministic category-based CSS artwork. Uploaded condition and dispute photos are resized into capped data URLs before local persistence.

The **Demo** menu provides `+1h`, `+1d`, and `+3d` controls. Advancing the simulated clock transitions borrowed exchanges to `Return Due` and recalculates late fees. Admin demo credentials are:

```text
username: admin
password: campus123
```

## Local development

Requirements: Node.js 20+ and npm.

```bash
npm ci
npm run dev -- --host --port 5173
```

Open <http://localhost:5173/>. Hash routing keeps every route refresh-safe in local development and on GitHub Pages.

Quality checks:

```bash
npm run lint
npm run test
npm run build
```

## GitHub Pages deployment

The Vite base is configured for `/campus-circular/`, and the app uses `HashRouter`, so deep links survive hard refreshes on Pages. The workflow in `.github/workflows/pages.yml` runs lint, tests, and build on pushes to `main`, then deploys `dist` through the official Pages artifact and deployment actions.

After enabling GitHub Pages with **GitHub Actions** as the source, the site is available at:

<https://SHASHANK-scent.github.io/campus-circular/>
