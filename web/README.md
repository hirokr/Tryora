# Web Folder Structure

This file documents the current structure of the `web` folder.

Note:
- `node_modules/` and `.next/` are excluded because they are generated dependency/build folders.

```text
web/
|-- app/
|   |-- (root)/
|   |   |-- layout.tsx
|   |   +-- page.tsx
|   |-- api/
|   |   |-- auth/
|   |   |   +-- google/
|   |   |       +-- callback/
|   |   |           +-- route.ts
|   |   |-- signout/
|   |   |   +-- route.ts
|   |   |-- update/
|   |   |   +-- route.ts
|   |   +-- uploadthing/
|   |       |-- core.ts
|   |       +-- route.ts
|   |-- auth/
|   |   |-- signin/
|   |   |   |-- page.tsx
|   |   |   +-- signupInFrom.tsx
|   |   |-- signup/
|   |   |   |-- page.tsx
|   |   |   +-- SignUpFrom.tsx
|   |   |-- layout.tsx
|   |   +-- page.tsx
|   |-- apple-icon.png
|   |-- favicon.ico
|   |-- globals.css
|   |-- icon0.svg
|   |-- icon1.png
|   |-- layout.tsx
|   +-- manifest.json
|-- components/
|   |-- theme/
|   |   +-- toggle-theme.tsx
|   |-- ui/
|   |   |-- button.tsx
|   |   |-- dropdown-menu.tsx
|   |   |-- input.tsx
|   |   |-- label.tsx
|   |   |-- Loader.tsx
|   |   +-- submitButton.tsx
|   |-- utility/
|   |   +-- Uploader.tsx
|   |-- Footer.tsx
|   |-- Header.tsx
|   |-- Logo.tsx
|   +-- SIgnInButton.tsx
|-- constants/
|   +-- constants.ts
|-- hooks/
|   +-- useDebounce.ts
|-- lib/
|   |-- auth/
|   |   |-- action.ts
|   |   |-- auth.ts
|   |   |-- authFetch.ts
|   |   +-- session.ts
|   |-- gsap.ts
|   |-- UserPreference.ts
|   +-- utils.ts
|-- providers/
|   |-- gsapProvider.tsx
|   |-- Provider.tsx
|   |-- theme-provider.tsx
|   +-- UploadThing-provider.tsx
|-- public/
|   |-- HomePage/
|   |   |-- home 1.png
|   |   |-- home 2.png
|   |   |-- home 3.png
|   |   |-- home 4.png
|   |   |-- home 5.png
|   |   +-- home 6.png
|   |-- logo.svg
|   |-- web-app-manifest-192x192.png
|   +-- web-app-manifest-512x512.png
|-- scripts/
|   +-- env.sh
|-- store/
|   +-- useSceneStore.ts
|-- types/
|   |-- auth.d.ts
|   |-- blob.d.ts
|   +-- user.d.ts
|-- utils/
|   |-- test.ts
|   +-- uploadthing.ts
|-- validation/
|   +-- auth.valid.ts
|-- .dockerignore
|-- .env.example
|-- .gitignore
|-- components.json
|-- Dockerfile
|-- eslint.config.mjs
|-- next.config.ts
|-- next-env.d.ts
|-- package.json
|-- package-lock.json
|-- postcss.config.mjs
|-- README.md
|-- todo.md
+-- tsconfig.json
```
