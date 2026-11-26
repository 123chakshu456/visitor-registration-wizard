# Visitor Management — Approval State Machine & Registration Wizard

An Angular application implementing the Frontend Coding Assignment: **Visitor Registration Wizard with Status Board**.

Built with standalone Angular components, reactive Angular signals, typed reactive forms, and a strictly enforced finite state machine (FSM).

---

## 🚀 Live Demo & Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- npm (v9+)

### 2. Install & Run
```bash
# Install dependencies
npm install

# Start the development server
npm start
# or: npx ng serve
```
Open [http://localhost:4200/](http://localhost:4200/) in your browser.

### 3. Run Automated Tests
```bash
# Run Vitest unit tests (all 32 tests passing)
npm test -- --watch=false
# or: npx ng test --watch=false
```

### 4. Build for Production
```bash
npm run build
```

---

## 📋 Features Implemented (Core & Stretch)

### 1. Multi-Step Registration Wizard (`WizardComponent`)
- **Step 1 — Visitor details**:
  - `name`: Required, minimum 3 characters. Inline validation error `"min 3 characters"`.
  - `contact`: Required, accepts 10 digits with optional `+91` prefix. Strictly rejects invalid formats like `98123-41234` or 9 digits, displaying the format hint on error.
  - "Next" button remains disabled until both name and contact are valid.
- **Step 2 — Visit details**:
  - `purpose`: Required dropdown selection (`Meeting`, `Interview`, `Delivery`, `Maintenance`, `Vendor meeting`).
  - Searchable Host Picker: Type-to-filter query over seed hosts (`EMP-77: Manish R`, `EMP-31: Sricharan`, `EMP-52: Dheeraj S`).
  - Edge case handled: When query doesn't match any host, shows `"no hosts found"` empty state.
  - "Back" button preserves Step 1 data intact.
  - "Next" button disabled until purpose and host are selected.
- **Step 3 — Review & submit**:
  - Read-only summary displaying all visitor and visit fields.
  - Per-section `✎ Edit` links jumping back directly to Step 1 or Step 2.
  - **Round-trip state preservation**: Editing from Step 3 back to Step 1, updating the name, and returning preserves Step 2 data completely.
  - "Submit → PENDING": Simulates async dispatch via `Promise/setTimeout`, records the visit as `PENDING` on the Status Board, and resets the wizard to Step 1.

---

### 2. Status Board with Finite State Machine (`StatusBoardComponent`)
- **Strict Legal Transitions**:
  $$\text{PENDING} \longrightarrow \text{APPROVED} \longrightarrow \text{CHECKED\_IN} \longrightarrow \text{CHECKED\_OUT}$$
  $$\text{PENDING} \longrightarrow \text{DENIED}$$
- **State Chips**:
  - `PENDING`: Amber (`#b45309`, bg `#fffbeb`)
  - `APPROVED`: Green (`#15803d`, bg `#f0fdf4`)
  - `DENIED`: Red (`#b91c1c`, bg `#fef2f2`)
  - `CHECKED_IN`: Blue (`#1d4ed8`, bg `#eff6ff`)
  - `CHECKED_OUT`: Gray (`#475569`, bg `#f8fafc`)
- **Action Buttons Governed by State Only**:
  - `PENDING`: **[✓ Approve]** (green) and **[✕ Reject]** (red).
  - `APPROVED`: **[📥 Check in]** (blue).
  - `CHECKED_IN`: **[📤 Check out]** (slate).
  - `DENIED` & `CHECKED_OUT`: Terminal states — no action buttons remain.
  - **Illegal transitions are strictly impossible through the UI and service guards**.

---

### 3. Stretch Goal: Filter Tab Bar with Live Counts
- Tabs above the board:
  - **All (`<count>`)**
  - **Pending (`<count>`)**
  - **On premises (`<count>`)** — filters specifically for visitors with state `CHECKED_IN`.
- Live computed signal counts update dynamically whenever state transitions occur or new visitors are registered.

---

### 4. Interactive Wireframe Enhancements
- **Host Notification Portal Simulation**: Simulates the host's perspective with real-time approval/rejection triggers.
- **Pre-approval Pass Preview**: Generates QR pass badge preview upon approval with time window and visitor status.
- **Visual State Diagram**: Interactive architectural state machine visualizer matching the assignment wireframe.

---

## 🏛️ Architecture & Component Boundaries

```
src/app/
├── models/
│   └── visit.model.ts          # Strongly typed interfaces, seed hosts, FSM transition matrix
├── services/
│   ├── visit.service.ts        # Signal-based centralized store, FSM validation, async dispatch
│   └── visit.service.spec.ts   # 12 unit tests validating FSM and live counts
├── components/
│   ├── wizard/                 # 3-step registration wizard
│   │   ├── wizard.component.ts
│   │   ├── wizard.component.html
│   │   ├── wizard.component.css
│   │   └── wizard.component.spec.ts  # 11 unit tests for validation & roundtripping
│   ├── status-board/           # Table, state chips, action buttons, stretch filter tabs
│   │   ├── status-board.component.ts
│   │   ├── status-board.component.html
│   │   ├── status-board.component.css
│   │   └── status-board.component.spec.ts  # 6 unit tests for UI transitions & filters
│   ├── state-diagram/          # Visual FSM architecture card
│   └── host-notification/      # Host alert simulation & QR pass preview
├── app.ts                      # Top-level dashboard layout
├── app.html
├── app.css
└── app.spec.ts                 # 3 root smoke & integration tests
```

---

## 💡 Architectural Decisions & Trade-offs (Interview Walkthrough Notes)

1. **State Machine Placement**:
   - Transition rules are defined in a declarative mapping (`ALLOWED_TRANSITIONS`) in `visit.model.ts` and enforced inside `VisitService.transition()`.
   - The UI template independently derives which buttons to render based on the current state (`@switch (visit.state)`), ensuring zero unauthorized transitions can be triggered from the interface.

2. **Form State Preservation**:
   - Rather than creating separate forms per step, a single unified `FormGroup` with nested subgroups (`visitor`, `visit`) is maintained at the wizard root.
   - This ensures that jumping back and forth across steps (Step 3 ↔ Step 1 ↔ Step 2) never loses field state or touch status.

3. **Trade-offs & Production Next Steps**:
   - **Persistence**: Kept in memory via Angular `signal()` state as requested. In a production environment, `localStorage` / `IndexedDB` caching and WebSocket/SSE push notifications would sync host approvals across disparate devices.
   - **Host Search Debounce**: Seed hosts are filtered synchronously using computed signals. For a directory of 50,000+ employees, an RxJS `debounceTime(300)` with server-side pagination would be preferred.
   - **Badge Photo**: Displayed as an auto-capture kiosk mock. A live webcam feed using HTML5 `navigator.mediaDevices.getUserMedia` could be plugged in.
