# Tryora — Next.js Web Client TODO

> This file tracks all frontend tasks for the Next.js web app, which serves as the **PWA Client** — handling UI, image uploads, 3D avatar viewing, dress discovery, try-on result display, and full offline support via a Service Worker.
> Legend: `[x]` = Done · `[ ]` = Pending

---

## Module Breakdown (Granular)

> This section breaks frontend work into smaller tasks. Keep this in sync with the phase plan below.
> Priority labels: `P0` = critical path, `P1` = high impact, `P2` = polish/backlog.

### Module 1 (P0) — Auth UX & Session

- [x] Build sign-up page + form action wiring
- [x] Build sign-in page + form action wiring
- [x] Add Google sign-in redirect flow
- [x] Add session utilities (`createSession`, `getSession`)
- [x] Add authenticated fetch helper (`authFetch`)
- [x] Add sign-out API route
- [ ] Add protected-route middleware (`middleware.ts`)
- [ ] Add verify-email, forgot-password, reset-password pages
- [ ] Polish form loading/error states

### Module 2 (P0) — Onboarding Upload Flow

- [x] Configure UploadThing API route (`imageUploader`)
- [x] Add UploadThing provider in root providers
- [x] Add reusable uploader component
- [ ] Create 3-step onboarding page (front/side/back uploads)
- [ ] Collect all 3 uploaded URLs in client state
- [ ] Submit URLs to backend `/api/avatar/generate`
- [ ] Complete server-side `onUploadComplete` persistence logic
- [ ] Add upload previews, validation hints, and progress indicator
- [ ] Redirect user to avatar status page after submit

### Module 3 (P1) — Avatar Status & 3D Viewer

- [ ] Create avatar status polling page
- [ ] Stop polling safely on unmount
- [ ] Persist `jobId` to Zustand store for resume support
- [ ] Create 3D avatar viewer with `react-three-fiber` + `drei`
- [ ] Add offline banner and cached model experience

### Module 4 (P1) — Discovery & Saved Dresses

- [ ] Build discovery page + prompt submission flow
- [ ] Create reusable dress card with Save + Try On actions
- [ ] Add `useDiscovery` hook for request state management
- [ ] Add debounced search input behavior
- [ ] Persist discovery results in IndexedDB
- [ ] Build saved-dresses page with optimistic remove behavior
- [ ] Sync saved dresses between API and IndexedDB

### Module 5 (P1) — Try-On & Gallery

- [x] Base Zustand scene store exists
- [ ] Extend store for `currentJobId`, `selectedDressId`, `scenePrompt`, `resultUrl`, `status`
- [ ] Build try-on initiation page/flow
- [ ] Build try-on status polling page
- [ ] Build try-on result presentation page/modal
- [ ] Build gallery page with pagination/infinite loading
- [ ] Add optimistic delete from gallery

### Module 6 (P1) — PWA & Offline

- [x] Add web app manifest
- [ ] Register service worker in app layout/provider
- [ ] Configure `next-pwa` (or custom worker generation)
- [ ] Add icon set for installable PWA
- [ ] Add cache versioning and stale cache cleanup
- [ ] Add Background Sync queue for offline mutations
- [ ] Add online/offline detection hook and global banner

### Module 7 (P2) — Shell, Profile, API Layer, Security

- [x] Root providers + app shell scaffolded
- [x] Base Header, Footer, Logo, Theme toggle present
- [ ] Expand authenticated navigation links + user menu
- [ ] Add mobile navigation pattern
- [ ] Build profile page with update + account actions
- [ ] Create centralized typed API client (`lib/api.ts`)
- [ ] Standardize API error handling + optimistic updates
- [ ] Verify CSRF/CSP/sanitization/cooldown protections

---

## Phase 0 — Project Bootstrap & Infrastructure

- [x] **Next.js 15 app initialized** — App Router structure under `app/`, TypeScript configured via `tsconfig.json`
- [x] **Tailwind CSS + PostCSS** — Configured via `postcss.config.mjs`; global styles in `app/globals.css`
- [x] **shadcn/ui component library** — `components.json` configured; base components (Button, Input, Label, DropdownMenu) scaffolded under `components/ui/`
- [x] **ESLint configured** — `eslint.config.mjs` set up
- [x] **Environment variable management** — `.env`, `.env.example`, and `scripts/env.sh` created; `BACKEND_URL` and `NEXT_PUBLIC_*` vars externalized
- [x] **Dockerfile** — Production-ready Dockerfile written
- [x] **Constants file** — `constants/constants.ts` centralizes `BACKEND_URL` and other shared values
- [x] **`manifest.json`** — PWA web app manifest created at `app/manifest.json`
- [ ] **Service Worker registration** — Register a Service Worker in `app/layout.tsx` or a dedicated `providers/ServiceWorkerProvider.tsx` to enable offline caching
- [ ] **`next-pwa` or custom Service Worker** — Configure `next.config.ts` to include PWA plugin (`next-pwa` / `@ducanh2912/next-pwa`) with `dest: "public"` so the SW is auto-generated during build
- [ ] **PWA icons** — Add multiple icon sizes (192×192, 512×512 maskable) to `public/icons/` and reference in `manifest.json`
- [ ] **Docker Compose integration** — Verify `docker-compose.yml` correctly builds and serves the Next.js container on the expected port with correct env vars

---

## Phase 1 — Authentication (Completed Core / Pending Polish)

### 1.1 Sign Up

- [x] **Sign-up page** — `app/auth/signup/page.tsx` + `SignUpFrom.tsx` form component
- [x] **Sign-up server action** — `lib/auth/action.ts` `signUp()` validates with Zod, posts to `BACKEND_URL/api/auth/signup`, redirects to `/auth/signin` on success
- [x] **Sign-up Zod validation** — `validation/auth.valid.ts` — `SignupFormSchema` validates name, email, password

### 1.2 Sign In

- [x] **Sign-in page** — `app/auth/signin/page.tsx` + `signupInFrom.tsx` form component
- [x] **Sign-in server action** — `lib/auth/action.ts` `signIn()` validates with Zod, posts to `BACKEND_URL/api/auth/signin`
- [x] **Sign-in with Google button** — `app/auth/signin/page.tsx` links to `BACKEND_URL/api/auth/google` for OAuth2 redirect
- [x] **Google OAuth callback handling** — `app/api/auth/google/` API route handles the redirect back from Express with tokens

### 1.3 Session Management

- [x] **Session creation** — `lib/auth/session.ts` `createSession()` encrypts and stores session in `HttpOnly` cookie
- [x] **`getSession()` utility** — Returns decrypted session data server-side
- [x] **Sign-out API route** — `app/api/signout/route.ts` clears the session cookie and calls Express signout endpoint
- [x] **`authFetch` utility** — `lib/auth/authFetch.ts` wraps `fetch` with the session token automatically added to `Authorization` header

### 1.4 Auth Polish

- [ ] **Email verification flow** — Add a `/auth/verify-email?token=...` page that calls the Express `POST /api/users/verify-email` endpoint and shows success/error state
- [ ] **Forgot password page** — `app/auth/forgot-password/page.tsx` with email input; calls `POST /api/users/forgot-password`
- [ ] **Reset password page** — `app/auth/reset-password/page.tsx` with new password input; reads `token` from URL query param; calls `POST /api/users/reset-password`
- [ ] **Auth layout protection** — Add a middleware (`middleware.ts` at root) that redirects unauthenticated users away from protected routes (`/dashboard`, `/try-on`, etc.)
- [ ] **Loading states on auth forms** — The `submitButton.tsx` component has a Loader; ensure it's properly wired to `useFormStatus` on sign-in and sign-up forms
- [ ] **Error message display** — Show field-level and global API error messages (e.g., "Email already exists") in a styled error component on auth forms

---

## Phase 2 — Onboarding: Avatar Photo Upload

- [x] **UploadThing integration** — `app/api/uploadthing/core.ts` defines `imageUploader` file route; `app/api/uploadthing/route.ts` exposes the UploadThing API handler; `utils/uploadthing.ts` exports typed client helpers
- [x] **UploadThing provider** — `providers/UploadThing-provider.tsx` wraps the app with the UploadThing context
- [x] **`Uploader.tsx` component** — `components/utility/Uploader.tsx` base uploader UI component scaffolded
- [ ] **3-photo upload flow** — Build a dedicated onboarding page `app/(root)/onboarding/page.tsx`:
  - Step 1: Upload **front-facing** photo (full body, neutral pose)
  - Step 2: Upload **side-view** photo
  - Step 3: Upload **back-view** photo
  - Each step uses UploadThing `imageUploader`; uploaded URLs are collected in component state
- [ ] **Send to Express** — After all 3 photos are uploaded, `POST` the 3 S3 URLs to `BACKEND_URL/api/avatar/generate`; receive `{ jobId }` in response
- [ ] **Post-upload logic** — Complete the `onUploadComplete` TODO in `app/api/uploadthing/core.ts`: save the uploaded image URL and associate it with the user in the session
- [ ] **Upload validation** — Enforce that only JPEG/PNG files are accepted; show preview thumbnails before confirming upload; show a file-size warning if image exceeds 16 MB
- [ ] **Onboarding progress indicator** — Show a 3-step progress bar (Step 1 / 2 / 3) so the user understands the upload flow
- [ ] **Onboarding completion redirect** — After submitting all 3 photos, redirect the user to the avatar status/polling page

---

## Phase 3 — Avatar Generation Status Polling

- [ ] **Avatar status page** — `app/(root)/avatar/status/page.tsx`:
  - Accept `jobId` from URL query param or session state
  - Poll `GET BACKEND_URL/api/avatar/status/:jobId` every 3 seconds using `setInterval` or `react-query` with `refetchInterval`
  - Show a full-page loading animation ("Creating your 3D avatar…")
  - Show estimated queue position if returned by the server
  - On `status === "completed"`: stop polling, redirect to `app/(root)/avatar/page.tsx` with the `modelUrl`
  - On `status === "failed"`: show an error state with a retry button
- [ ] **Stop polling on unmount** — Clear the polling interval in the `useEffect` cleanup function to prevent memory leaks
- [ ] **Persist `jobId` in session/store** — Save the `jobId` in Zustand store (`store/useSceneStore.ts`) so the user can close the tab and resume polling on return

---

## Phase 4 — 3D Avatar Viewer

- [ ] **`react-three-fiber` + `@react-three/drei`** — Add to `package.json`; configure in `app/(root)/avatar/page.tsx`
- [ ] **`AvatarViewer` component** — `components/avatar/AvatarViewer.tsx`:
  - Load the `.glb` model from `modelUrl` using `useGLTF` from `@react-three/drei`
  - Enable orbit controls (mouse rotate/zoom)
  - Add ambient + directional lighting
  - Show a loading spinner while the model is being fetched
- [ ] **Service Worker: cache the `.glb` file** — In the Service Worker, intercept fetch requests for `.glb` files and use a **Cache-First** strategy:
  ```js
  // sw.js
  self.addEventListener("fetch", (event) => {
  	if (event.request.url.endsWith(".glb")) {
  		event.respondWith(
  			caches.match(event.request) ||
  				fetch(event.request).then((res) => {
  					const clone = res.clone();
  					caches
  						.open("avatar-cache-v1")
  						.then((cache) => cache.put(event.request, clone));
  					return res;
  				}),
  		);
  	}
  });
  ```
- [ ] **Offline banner** — Show a toast or banner when the user is offline but still viewing their cached 3D model

---

## Phase 5 — Dress Discovery (Search)

- [ ] **Discovery page** — `app/(root)/discovery/page.tsx`:
  - Text input for event/occasion prompt (e.g., "summer beach wedding")
  - Submit button triggers `POST BACKEND_URL/api/discovery/search` with `{ prompt }`
  - Show a loading skeleton while Express checks Redis and FastAPI processes the search
  - Render returned dresses as a responsive grid of cards
- [ ] **`DressCard` component** — `components/discovery/DressCard.tsx`:
  - Show dress thumbnail image (from S3), name, price, and store link
  - "Save" button calls `POST /api/discovery/save` to save the dress to the user's favorites
  - "Try On" button navigates to the try-on flow with the selected `dressId`
- [ ] **`useDiscovery` hook** — Encapsulate the search state, loading, error, and result list in a custom hook `hooks/useDiscovery.ts`
- [ ] **Debounced search input** — Reuse existing `hooks/useDebounce.ts` to defer the API call until the user stops typing (300–500 ms delay)
- [ ] **IndexedDB for offline dress catalog** — After a successful search, persist the returned dress array to **IndexedDB** using `idb` or `dexie.js`:
  ```ts
  // lib/indexedDB.ts
  await db.garments.bulkPut(dresses);
  ```
- [ ] **Offline fallback for discovery** — When the user is offline, attempt to load dresses from IndexedDB instead of fetching from the server
- [ ] **Thumbnail image caching** — Use the Service Worker to cache dress thumbnail images (Stale-While-Revalidate strategy) so previously browsed dresses render offline

---

## Phase 6 — Saved Dresses (Favorites)

- [ ] **Saved dresses page** — `app/(root)/saved/page.tsx`:
  - On mount, fetch `GET BACKEND_URL/api/discovery/saved`
  - Render saved dresses in a grid
  - Each card has a "Remove" button (calls `DELETE` or sends unsave request)
  - If offline, read from IndexedDB directly
- [ ] **Sync saved dresses to IndexedDB** — After fetching from server, write to IndexedDB so the list is available offline
- [ ] **Optimistic delete** — When the user removes a saved dress:
  1. Immediately remove it from the UI and IndexedDB
  2. If online: call the Express delete endpoint
  3. If offline: queue the delete in the Service Worker **Background Sync** and replay on reconnect

---

## Phase 7 — Virtual Try-On & Scene Generation

- [ ] **Try-on initiation** — From `DressCard`, clicking "Try On" opens a panel or navigates to `app/(root)/try-on/page.tsx`:
  - Show the selected dress image and user's avatar thumbnail for confirmation
  - Input field for `scenePrompt` (e.g., "standing by the ocean at sunset") — max 300 chars
  - Submit button calls `POST BACKEND_URL/api/try-on/generate` with `{ dressId, scenePrompt }`
  - Receive `202 { jobId }` and redirect/transition to the try-on status page
- [ ] **Try-on status polling page** — `app/(root)/try-on/status/page.tsx`:
  - Poll `GET BACKEND_URL/api/try-on/status/:jobId` every 3 seconds
  - Show animated loading state with copy ("Designing your look…")
  - If server returns `estimatedPosition`, show "Position N in queue…"
  - On `status === "completed"`: display `resultUrl` image (full-screen preview)
  - On `status === "failed"`: show styled error with a retry option
- [ ] **Zustand try-on store** — Extend `store/useSceneStore.ts` to store:
  - `currentJobId`, `scenePrompt`, `selectedDressId`, `resultUrl`, `status`
- [ ] **Try-on result display** — Show a full-screen modal or dedicated page with:
  - The AI-generated composite image (avatar + dress + background)
  - The original store link + price for the dressed item
  - "Save to Gallery" button
  - "Share" button (native share API)

---

## Phase 8 — Try-On History (Gallery)

- [ ] **Gallery page** — `app/(root)/gallery/page.tsx`:
  - Fetch `GET BACKEND_URL/api/try-on/history`
  - Render a masonry or grid layout of all generated images
  - Each image shows the original store link as an overlay
  - Support lazy loading / infinite scroll (pagination: `?page=1&limit=20`)
- [ ] **Delete try-on** — Trash icon on each gallery item; calls `DELETE BACKEND_URL/api/try-on/:id`; use optimistic update to remove immediately from UI
- [ ] **Offline gallery** — Cache the gallery page's image list in IndexedDB so previously loaded results are visible offline

---

## Phase 9 — PWA & Offline Support

- [ ] **Service Worker implementation** — Create `public/sw.js` (or use `next-pwa` auto-generation):
  - **Cache-First** for `.glb` 3D model files (avatar)
  - **Stale-While-Revalidate** for dress thumbnail images
  - **Network-First** for API calls; fall back to IndexedDB on failure
  - **Background Sync** for deferred write operations (unsave dress, delete try-on)
- [ ] **Cache versioning** — Use `CACHE_VERSION = 'v1'` constant; on Service Worker `activate`, delete caches that don't match the current version to prevent stale 3D data
- [ ] **IndexedDB schema** — Define schema in `lib/indexedDB.ts`:
  - `garments` store — dress catalog entries (id, name, imageUrl, storeLink, price)
  - `savedDresses` store — user favorites
  - `pendingActions` store — queued offline actions (deletions, etc.)
- [ ] **Online/offline detection** — Add a global `useOnlineStatus` hook using `navigator.onLine` + `window.addEventListener('online'/'offline')` events; show a persistent banner when offline
- [ ] **Install prompt** — Handle the `beforeinstallprompt` browser event; show a custom "Add to Home Screen" UI at an appropriate moment (e.g., after first successful try-on)

---

## Phase 10 — Navigation & Layout

- [x] **Root layout** — `app/layout.tsx` wraps the app with providers (theme, GSAP, UploadThing, session)
- [x] **Root route layout** — `app/(root)/layout.tsx` for authenticated app shell
- [x] **Header** — `components/Header.tsx` basic header component
- [x] **Footer** — `components/Footer.tsx` basic footer component
- [x] **Logo** — `components/Logo.tsx`
- [x] **Theme toggle** — `components/theme/toggle-theme.tsx` + `providers/theme-provider.tsx` + dark mode support
- [x] **GSAP provider** — `providers/gsapProvider.tsx` + `lib/gsap.ts` for page transition animations
- [ ] **Authenticated navigation** — Expand `Header.tsx` to show: avatar thumbnail, "Discovery", "Gallery", "Saved", and a profile dropdown
- [ ] **Mobile responsive navigation** — Add a hamburger menu / bottom navigation bar for mobile screens
- [ ] **Active route highlighting** — Use `usePathname()` to bold/underline the active nav link
- [ ] **404 page** — Create `app/not-found.tsx` with a branded not-found design

---

## Phase 11 — User Profile

- [ ] **Profile page** — `app/(root)/profile/page.tsx`:
  - Fetch `GET BACKEND_URL/api/users/profile`
  - Show name, email, avatar thumbnail, account created date
  - "Edit Profile" form with name and preference updates (`PATCH /api/users/profile`)
  - "Change Password" section
  - "Delete Account" button (with confirmation modal)
- [ ] **Update profile server action** — `lib/auth/action.ts` `updateProfile()` calls `PATCH BACKEND_URL/api/users/profile`
- [ ] **`UserPreference.ts`** — `lib/UserPreference.ts` exists; wire it up to persist UI preferences (theme, language) to the server via `PUT /api/users/me`

---

## Phase 12 — API Client Layer

- [x] **`authFetch`** — `lib/auth/authFetch.ts` handles authenticated requests
- [ ] **Centralized API client** — Create `lib/api.ts` with typed functions for every Express endpoint:
  ```ts
  export const api = {
    avatar: { generate, getStatus, getMe },
    discovery: { search, save, getSaved },
    tryOn: { generate, getStatus, getHistory, delete },
    user: { getProfile, updateProfile, deleteAccount },
  };
  ```
- [ ] **Error handling** — Wrap all API calls with standardized error handling; display user-friendly toasts on `4xx` / `5xx` errors
- [ ] **Optimistic updates** — Use React's `useOptimistic` hook or SWR `mutate` for immediate UI feedback on saves/deletes

---

## Phase 13 — Security

- [ ] **CSRF protection** — Ensure all state-mutating server actions use Next.js built-in CSRF protection (Server Actions are protected by default in Next.js 14+); verify no custom API routes bypass this
- [ ] **Content Security Policy (CSP)** — Add CSP headers in `next.config.ts` (or via Helmet-equivalent middleware) to restrict script/style sources
- [ ] **`scenePrompt` input sanitization** — Sanitize user input in the try-on form before sending to the server to prevent XSS payloads from being stored
- [ ] **Secure cookie flags** — Verify that the session cookie set by `lib/auth/session.ts` uses `HttpOnly`, `Secure`, and `SameSite=Strict`
- [ ] **Rate limit client-side submissions** — Disable the "Try On" submit button for a cooldown period after submission to prevent accidental double-submissions

---

## Backlog / Future Work

- [ ] **Outfit builder** — Drag-and-drop UI for combining multiple saved garments into a named `Outfit`
- [ ] **Event scheduler** — User can create a named event (e.g., "Sarah's wedding, July 2026") and associate try-on results, saved dresses, and a scene prompt with it
- [ ] **Share / social export** — Generate a shareable link or image card (OG image) from a try-on result
- [ ] **Internationalization (i18n)** — Next.js i18n routing for multi-language support
- [ ] **Accessibility audit** — Run axe-core or Lighthouse accessibility audit; fix contrast ratios, add ARIA labels to icon buttons, ensure keyboard navigation works throughout
- [ ] **E2E tests** — Playwright tests for critical flows: sign-up → onboarding → discovery → try-on
- [ ] **Storybook** — Add Storybook (`npx storybook init`) for isolated component development and visual regression testing
