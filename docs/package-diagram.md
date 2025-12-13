# Package Diagram — v0-swimming-lms-demo

This document presents a high-level package diagram for the repository. The diagram shows top-level packages (folders) and major relationships (imports / usage). It's drawn with Mermaid so you can render it in GitHub/VS Code Markdown preview.

Notes / assumptions:

- Diagram captures main front-end app structure from the workspace: `app/`, `components/`, `api/`, `hooks/`, `utils/`, `lib/`, `public/`, `styles/`, and `components/ui`.
- `api/manager/*` contains multiple manager endpoints used by the UI.
- `components/manager` contains manager-specific UI (calendar, modals, forms) which import `api/*`, `utils/*`, `hooks/*`, and `components/ui/*`.

---

```mermaid
%% Package diagram for v0-swimming-lms-demo (high-level)
flowchart LR
  %% Top-level app
  subgraph AppLayer[app/ (Next.js pages and layouts)]
    A_app[app/]
  end

  subgraph UI[UI Components]
    C_components[components/]
    UI_shared[components/ui/]
    C_manager[components/manager/]
    C_optimized[components/optimized/]
  end

  subgraph API[Backend API wrappers]
    API_root[api/]
    API_manager[api/manager/*]
    API_media[api/media-api.ts]
    API_auth[api/auth-utils.ts]
  end

  subgraph Core[Core libs & state]
    HOOKS[hooks/]
    UTILS[utils/]
    LIB[lib/]
    API_CACHE[utils/api-cache.ts]
  end

  subgraph Assets[Static & styles]
    PUBLIC[public/]
    STYLES[styles/]
  end

  %% Edges (high-level)
  A_app -->|"<<import>>"| C_components
  A_app -->|"<<import>>"| API_root
  A_app -->|"<<import>>"| HOOKS
  A_app -->|"<<import>>"| STYLES

  C_components -->|"<<import>>"| UI_shared
  C_components -->|"<<import>>"| C_manager
  C_components -->|"<<import>>"| C_optimized

  C_manager -->|"<<import>>"| API_manager
  C_manager -->|"<<import>>"| API_media
  C_manager -->|"<<import>>"| API_auth
  C_manager -->|"<<import>>"| HOOKS
  C_manager -->|"<<import>>"| UTILS
  C_manager -->|"<<import>>"| UI_shared

  API_root -->|"<<import>>"| API_manager
  API_root -->|"<<import>>"| API_media
  API_root -->|"<<import>>"| API_auth
  API_manager -->|"<<import>>"| UTILS
  API_manager -->|"<<import>>"| API_CACHE

  HOOKS -->|"<<import>>"| API_root
  HOOKS -->|"<<import>>"| UTILS

  UTILS -->|"<<import>>"| LIB
  LIB -->|"<<import>>"| UTILS

  %% Example detailed nodes inside API_manager
  subgraph ManagerAPIs[api/manager]
    courses[ courses-api.ts ]
    classes[ class-api.ts ]
    pools[ pools-api.ts ]
    instructors[ instructors-api.ts ]
    schedule[ schedule-api.ts ]
    slots[ slot-api.ts ]
  end

  API_manager -->|"<<import>>"| ManagerAPIs
  C_manager -->|"<<import>>"| courses
  C_manager -->|"<<import>>"| classes
  C_manager -->|"<<import>>"| pools
  C_manager -->|"<<import>>"| instructors
  C_manager -->|"<<import>>"| schedule
  C_manager -->|"<<import>>"| slots

  %% Additional cross-links
  components_with_forms[components/manager/* (forms, modals)] -->|"<<import>>"| API_manager
  components_with_forms -->|"<<import>>"| UTILS
  components_with_forms -->|"<<import>>"| HOOKS

  %% Styling/UX modules
  UI_shared -->|"<<import>>"| STYLES
  UI_shared -->|"<<import>>"| PUBLIC

  style AppLayer fill:#f3f4f6,stroke:#111827,stroke-width:1px
  style UI fill:#eef2ff,stroke:#4338ca
  style API fill:#ecffe6,stroke:#16a34a
  style Core fill:#fff7ed,stroke:#d97706
  style Assets fill:#fef3c7,stroke:#b45309
```

---

Key file/dir references (quick links):

- App entry and pages: [app/](app/)
- Manager UI components: [components/manager/](components/manager/)
- Shared UI primitives: [components/ui/](components/ui/)
- API wrappers: [api/manager/](api/manager/)
- Utilities: [utils/](utils/), [lib/](lib/)

If you'd like, I can:

- expand the diagram with more packages (e.g., `hooks/` internals or `components/optimized/`),
- generate an SVG file of the diagram,
- or produce a DOT (Graphviz) version.
