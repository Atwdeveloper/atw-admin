# atw-admin

The Anytime Work admin panel as a standalone Next.js (App Router) app. It was
split out of `atw-frontend`, which still holds the company, worker and agent
panels, and ported from Create React App + react-router to Next.js.

## Getting started

```bash
cp .env.example .env.local   # optional, defaults work for local dev
npm install
npm run dev                  # http://localhost:3000 -> /admin/dashboard
```

`npm run build && npm start` for a production build.

## Backend

- **Java backend**, used by the live screens: `src/api/javaApi.js` (axios client,
  token refresh, error helper `apiError`) plus `src/api/adminV1/*`. New Java
  endpoints go in `src/api/adminV1/`.
- The base path is `ADMIN_API_URL` in `src/api/adminApiUrl.js`
  (`https://api-dev.techagent.co.in/api/v1`).
- The browser calls `/api/v1/*` on this app (in development and production)
  and `src/app/api/v1/[...path]/route.js` relays it to that base path (or
  `ADMIN_API_PROXY_TARGET`, if set), because the backend's CORS list includes
  neither localhost nor the deployed domain. Set `NEXT_PUBLIC_ADMIN_API_URL`
  to call a backend directly instead.
- **Old Laravel API**: `src/api/axiosInstance.js` and `src/api/admin/*`. Only
  the legacy screens use it.

## Live vs legacy screens

Live on the Java backend: login, OTP, forgot/reset password, accept-invite,
dashboard, my account, change password, staff and roles.

Every other admin screen (companies, workers, vacancies, reports, salary, …)
still calls the Laravel API. They are all here, but their pages return 404
and their menu items are hidden until `NEXT_PUBLIC_LEGACY_ADMIN_FEATURES=true`.
When a screen moves to Java, make its page in `src/app/admin/(panel)/…/page.js`
render unconditionally (drop the `notFound()` check) and add its menu id to
`ADMIN_V1_SECTIONS` in `src/modules/admin/components/Sidebar.jsx`.

## Layout

```
src/
  app/                    Next.js routes
    layout.js             <html>, theme-before-paint script, providers
    admin/(auth)/…        login, verify-otp, forgot/reset-password, accept-invite
    admin/(panel)/…       signed-in screens (auth guard + permissions + sidebar layout)
    api/v1/[...path]/     dev proxy to the Java backend
  modules/admin/          screens, components and hooks (the ported CRA code)
  common/                 shared hooks, context and components
  api/                    API clients
  lib/navigation.js       react-router-style navigation on top of next/navigation
```

URLs keep the `/admin/...` prefix so links in backend emails
(`/admin/reset-password`, `/admin/accept-invite`) keep working on the new domain.

## Navigation

Screens import `useNavigate`, `useLocation`, `useParams`, `useSearchParams`,
`Link`, `Navigate`, `useBlocker` and `generatePath` from `@/lib/navigation`.
They have the react-router signatures and run on `next/navigation`:

- `navigate(to, { state })` and `<Link state>` store `state` in sessionStorage
  under the target URL, and `useLocation().state` reads it back.
- `useBlocker` (used by `useUnsavedChangesWarning`) can block navigations made
  through `navigate`/`<Link>`. It can't block browser back/forward, since the
  App Router has no hook for that. Reloads and tab closes are still caught by
  the hook's `beforeunload` listener.

New code can use `next/link` and `next/navigation` directly.

## Environment

See `.env.example`. `NEXT_PUBLIC_*` values are read at build time.
