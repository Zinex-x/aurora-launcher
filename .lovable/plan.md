# Minecraft Launcher UI — Plan

A desktop-style single-page web app with a glassmorphic dark/light theme, RU/EN localization, and a sidebar-driven layout. Pure frontend (no backend) — instances and auth are stored in `localStorage` and mocked.

## Visual Direction

- **Default theme:** Dark glass. Deep gradient backdrop (indigo → near-black) with a blurred Minecraft-style scene image behind frosted panels.
- **Glass panels:** `bg-white/5` (dark) / `bg-white/60` (light), `backdrop-blur-xl`, hairline `border-white/10`, soft inset highlight, large rounded corners (`rounded-2xl`/`rounded-3xl`), soft elevation shadow.
- **Accent:** Minecraft-grass green (`oklch` token) for primary actions (PLAY, Create), with a subtle glow.
- **Type:** Display heading font (Space Grotesk) + body (Inter). All tokens defined in `src/styles.css` under `@theme inline`.
- **Motion:** Framer Motion for view transitions, modal, progress bar, and hover lifts on instance cards.

## Layout

```text
┌──────────────────────────────────────────────────────────┐
│ Sidebar (glass, 88px)  │  Top Navbar (glass)             │
│  • Home                 │  Title          [ Auth Zone ]  │
│  • Instance cards…      ├─────────────────────────────────┤
│                         │                                 │
│                         │  Main content (Home /           │
│                         │  Create / Instance Detail)      │
│  + Create               │                                 │
│  ⚙ Settings popover     │                                 │
└──────────────────────────────────────────────────────────┘
```

## Screens

1. **Home** — Welcome headline + "Recent Instances" grid. Cards have hover lift and a translucent "Quick Play" overlay button.
2. **Create Instance** — Form: name input, version dropdown (1.20.1, 1.19.4, 1.18.2, 1.16.5, 1.12.2), modloader as 3 role-tinted glass badges (Vanilla=stone, Forge=amber, Fabric=violet). Submit → animated progress bar (0→100% with stage labels: Downloading → Installing → Finalizing) → success toast → instance added to sidebar → auto-navigate to its detail page.
3. **Instance Detail** — Large hero header with instance icon, name, version + loader chips. Massive glass "ИГРАТЬ / PLAY" button with green glow. Tab strip below: Mods, Settings, Skin (each a placeholder empty-state panel).

## Auth Zone (top-right)

- Guest: "Войти / Log In" glass button → opens modal "Ожидание авторизации в браузере…" with spinner and a "[Тест] Вход / [Test] Login" button that sets a mock user `{ nickname: "Steve", uuid }` in localStorage.
- Logged in: rounded avatar (via `https://mc-heads.net/avatar/{nickname}`), nickname, muted "Выйти / Log Out".

## Settings Popover (bottom-left of sidebar)

- Theme toggle: Dark ↔ Light (toggles `.dark` class on `<html>`, persisted).
- Language toggle: RU ↔ EN segmented control (persisted). All UI strings re-render via i18n context.

## Internationalization

- Lightweight custom i18n: `src/i18n/strings.ts` exports `{ ru: {...}, en: {...} }` keyed dictionaries.
- `LanguageProvider` (React context) + `useT()` hook returning `t(key)`.
- Default language: RU (matches the brief's primary copy).

## Theming

- `ThemeProvider` toggles `.dark` on `<html>`; both palettes defined as `oklch` tokens in `src/styles.css`.
- Background uses layered gradients + an absolutely-positioned blurred scene image (generated once, reused for both themes with different overlay opacity).

## State

- `LauncherProvider` holds: `currentView` (`home | create | instance:{id}`), `instances[]`, `user`, plus actions. Backed by `localStorage`.

## File Plan

```text
src/styles.css                        # tokens, dark/light glass palette, fonts
src/routes/__root.tsx                 # add font <link>, providers
src/routes/index.tsx                  # mounts <LauncherShell />
src/components/launcher/
  LauncherShell.tsx                   # sidebar + navbar + view switch
  Sidebar.tsx
  SettingsPopover.tsx
  TopNavbar.tsx
  AuthZone.tsx
  AuthModal.tsx
  views/HomeView.tsx
  views/CreateInstanceView.tsx
  views/InstanceDetailView.tsx
  InstanceCard.tsx
  ModloaderBadge.tsx
  GlassPanel.tsx
  ProgressInstall.tsx
src/context/
  ThemeProvider.tsx
  LanguageProvider.tsx
  LauncherProvider.tsx
src/i18n/strings.ts
src/assets/launcher-bg.jpg            # generated blurred Minecraft scene
```

## Dependencies

- `framer-motion` (animations) — add via `bun add`.
- shadcn primitives already present (Dialog, Button, Input, Select, Tabs, Popover, Switch) — reuse.

## Out of Scope

- No real Minecraft auth, no real downloads, no Tauri/Electron packaging. Pure web preview only. (Ask if you want me to also package as Electron after the UI is built.)

## Acceptance

- Toggling language updates every visible string immediately.
- Toggling theme swaps glass palette without layout shift.
- Creating an instance shows the progress animation and the new card appears in the sidebar + Recent Instances.
- Clicking a sidebar card opens its detail view with a working (visual) PLAY button.
