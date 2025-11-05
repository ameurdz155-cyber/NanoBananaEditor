# Header Component Architecture

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                            Header.tsx                                │
│  (Main Orchestrator - State Management & Business Logic)            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐       ┌───────────────┐
│  Left Section │         │ Center Section│       │ Right Section │
└───────────────┘         └───────────────┘       └───────────────┘
        │                         │                         │
        │                         │                         │
  ┌─────┴─────┐           ┌───────────────┐       ┌─────────┴──────┐
  ▼           ▼           │               │       ▼                 ▼
┌──────┐  ┌────────┐      │               │  ┌──────────┐    ┌──────────┐
│ Logo │  │Iteration│     │               │  │  Theme   │    │   Menu   │
│Section│  │Control │     │               │  │  Toggle  │    │  Button  │
└──────┘  └────────┘      │               │  └──────────┘    └──────────┘
                           │               │
                           ▼               │
                    ┌──────────────┐       │
                    │   Canvas     │       │
                    │   Controls   │       │
                    └──────────────┘       │
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │   Header     │
                                    │   Modals     │
                                    └──────────────┘
```

## Data Flow

```
┌──────────────┐
│  App Store   │──────────────┐
│  (Zustand)   │              │
└──────────────┘              │
                              ▼
┌──────────────┐         ┌─────────┐
│  Auth Store  │────────▶│ Header  │
│  (Zustand)   │         └─────────┘
└──────────────┘              │
                              │
                    ┌─────────┼──────────┐
                    │         │          │
                    ▼         ▼          ▼
              ┌─────────┬─────────┬─────────┐
              │ Props   │ Props   │ Props   │
              ▼         ▼         ▼         
        ┌──────────┬────────┬──────────┐
        │Component │Component│Component │
        └──────────┴────────┴──────────┘
              │         │          │
              └─────────┼──────────┘
                        │
                   ┌────▼─────┐
                   │ Callbacks│
                   └────┬─────┘
                        │
                        ▼
                  ┌──────────┐
                  │  Window  │
                  │  Events  │
                  └──────────┘
```

## Component Responsibilities

```
┌────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐        │
│  │ LogoSection │  │ ThemeToggle  │  │  MenuButton   │        │
│  │             │  │              │  │               │        │
│  │ • Display   │  │ • UI only    │  │ • Dropdown    │        │
│  │   logo      │  │ • Theme btn  │  │ • Menu items  │        │
│  │ • Version   │  └──────────────┘  │ • Positioning │        │
│  └─────────────┘                    └───────────────┘        │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                    INTERACTION LAYER                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐         ┌────────────────────┐           │
│  │IterationControl │         │  CanvasControls    │           │
│  │                 │         │                    │           │
│  │ • Input fields  │         │ • Zoom controls    │           │
│  │ • Generate btn  │         │ • Reset button     │           │
│  │ • Mode switch   │         │ • Mask tools       │           │
│  │ • Validation    │         │ • Save button      │           │
│  └─────────────────┘         └────────────────────┘           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATION LAYER                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │                   Header.tsx                         │      │
│  │                                                      │      │
│  │  • State management                                  │      │
│  │  • Event handling                                    │      │
│  │  • Business logic                                    │      │
│  │  • Component composition                             │      │
│  │  • Store integration                                 │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                       MODAL LAYER                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │                  HeaderModals                        │      │
│  │                                                      │      │
│  │  • InfoModal                                         │      │
│  │  • SettingsModal                                     │      │
│  │  • SaveSuccessModal                                  │      │
│  │  • CategoryManagementModal                           │      │
│  │  • TemplateManagementModal                           │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    External State                            │
│                   (Zustand Stores)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Header Component                           │
│                                                              │
│  Local State:                                                │
│  • isDarkMode                                                │
│  • showInfoModal                                             │
│  • showSettingsModal                                         │
│  • showSaveSuccessModal                                      │
│  • showCategoryModal                                         │
│  • showTemplateModal                                         │
│  • savedGalleryName                                          │
│  • savedImagePath                                            │
│  • savedImageData                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               Child Components (Props)                       │
│                                                              │
│  • Receive data via props                                    │
│  • Emit events via callbacks                                 │
│  • No direct state mutation                                  │
│  • Pure functions preferred                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 User Interactions                            │
│                                                              │
│  • Click events                                              │
│  • Input changes                                             │
│  • Form submissions                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Callback Handlers                               │
│                                                              │
│  • handleZoom()                                              │
│  • handleSave()                                              │
│  • handlePrimaryAction()                                     │
│  • toggleTheme()                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Side Effects                                    │
│                                                              │
│  • Window events                                             │
│  • LocalStorage updates                                      │
│  • Store mutations                                           │
│  • API calls                                                 │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Patterns

### 1. **Container/Presenter Pattern**
- **Header.tsx** = Container (logic)
- **Sub-components** = Presenters (UI)

### 2. **Props Drilling Prevention**
- Only relevant props passed to each component
- No unnecessary prop chains

### 3. **Single Responsibility**
- Each component has ONE job
- Easy to understand and modify

### 4. **Composition over Inheritance**
- Components composed together
- No complex inheritance hierarchies

### 5. **Unidirectional Data Flow**
- Data flows down (props)
- Events flow up (callbacks)
