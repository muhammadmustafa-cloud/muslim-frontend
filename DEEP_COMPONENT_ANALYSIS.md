# Deep Component Analysis — Muslim Daal Mill (Frontend)

**Full tree: from HTML root to every UI and page component.**

---

## 1. Entry & Root (Outermost Layer)

### `index.html`
- **Role:** Single HTML shell. No components.
- **Key:** `<div id="root">` is the only mount target; `<script type="module" src="/src/main.jsx">` loads the app.
- **Title:** "Muslim Daal Mill - Management System".

### `main.jsx`
- **Role:** React entry. Renders the app into `#root`.
- **Tree:** `ReactDOM.createRoot(...).render(<React.StrictMode><App /></React.StrictMode>)`
- **Imports:** `App.jsx`, `index.css`. No other providers or routers here.

**Flow:** `index.html` → `main.jsx` → `StrictMode` → `App`.

---

## 2. App.jsx — Top-Level React Tree

**Parent:** Rendered by `main.jsx` (no parent in React tree).

**Children (in order):**
1. `AuthProvider` (wraps everything)
2. Inside provider: `Router` (React Router)
3. Inside router: `Toaster` (react-hot-toast), `Routes`

**Route structure:**
- **Public:** `/login` → `Login`
- **Protected (layout):** `/` → `ProtectedRoute` → `Layout`  
  - Index `/` → `Dashboard`  
  - `/customers` → `Customers`  
  - `/suppliers` → `Suppliers`  
  - `/items` → `Items`  
  - `/inventory` → `Inventory`  
  - `/expenses` → `Expenses`  
  - `/mazdoors` → `Mazdoors`  
  - `/transactions` → `Transactions`  
  - `/accounts` → `Accounts`  
  - `/payments` → `Payments`  
  - `/daily-cash-memo` → `DailyCashMemo`  
  - `/labour` → `LabourRates`  
  - `/labour-expenses` → `LabourExpenses`  
  - `/users` → `Users`
- **Catch-all:** `*` → `Navigate to="/"`

**Data/context:** All authenticated UI is under `AuthProvider`, so any component can use `useAuth()`.

---

## 3. Auth Layer

### `AuthContext.jsx`
- **Exports:** `AuthProvider`, `useAuth`.
- **State:** `user`, `loading`.
- **Effects:** On mount, reads `localStorage` token/user and validates with `api.get('/auth/me')`; on 401 or missing token, clears storage and sets `user = null`.
- **API:** `login(email, password)` → POST `/auth/login`, stores token + user in localStorage and state; `logout()` clears storage and state.
- **Context value:** `{ user, login, logout, loading, isAuthenticated: !!user }`.
- **Children:** Whatever is passed to `AuthProvider` (in practice: Router and full app).

### `ProtectedRoute.jsx`
- **Parent:** Used by `App.jsx` as wrapper for layout route.
- **Uses:** `useAuth()` → `isAuthenticated`, `loading`.
- **Behavior:**
  - If `loading` → spinner (single div with border animation).
  - If `!isAuthenticated` → `Navigate to="/login" replace`.
  - Else → renders `children` (here: `Layout`); also supports `Outlet` if used as wrapper without explicit children.
- **Children:** When authenticated, `Layout` (and thus the whole dashboard tree).

---

## 4. Layout (Every Protected Page)

### `Layout.jsx`
- **Parent:** Rendered by `ProtectedRoute` when authenticated.
- **Structure:** Flex container, full height, `bg-gray-50`.
  - **Sidebar:** `<Sidebar />` (fixed width 72, border-r).
  - **Main area:** flex-1 column:
    - **Header:** `<Header />`
    - **Content:** `<main><Outlet /></main>` — the matched route’s page component.
- **No props.** All layout is structural.

### `Sidebar.jsx`
- **Parent:** `Layout`.
- **Uses:** `useAuth()` (user, logout), `NavLink`, `cn` (utils), `Button`.
- **Structure:**
  - **Header block:** Logo (Package icon), "Muslim Daal Mill", "Management System".
  - **Nav:** `menuGroups` (Main: Dashboard; People: Customers, Suppliers, Mazdoors; Inventory: Items, Stock; Financial: Transactions, Expenses, Payments, Accounts, Labour Expenses, Labour, Daily Cash Memo). If `user?.role === 'admin'`, adds Settings → Users.
  - **Footer:** Logged-in user name/email, Logout `Button`.
- **Children (conceptual):** Each menu item is a `NavLink` with icon and label; active state uses `cn` and a small right accent bar.

### `Header.jsx`
- **Parent:** `Layout`.
- **Uses:** `useAuth()` (user), `Button`, Radix `DropdownMenu` (Trigger, Content, Item, Label, Separator).
- **Structure:**
  - Left: "Welcome back, {user?.name}", role.
  - Right: Bell icon `Button` (notification placeholder), user dropdown (avatar + email) with "My Account", Profile, Settings (no handlers yet).
- **Children:** `Button`(s), `DropdownMenu` and its Radix subcomponents.

---

## 5. Auth Page (Outside Layout)

### `Login.jsx`
- **Parent:** Rendered by `Routes` for `/login` (no Layout).
- **State:** `loading`.
- **Uses:** `useNavigate`, `useAuth()` (login), `toast`.
- **Behavior:** Form submit → `login(email, password)`; success → toast + `navigate('/')`; 401 → specific toast; other errors → generic toast. No client-side validation beyond `required`.
- **Markup:** Centered card, gradient background, title "Muslim Daal Mill", native `<input>` for email/password, submit button with loading spinner. No `Input` or `Button` components here (intentional or legacy).

---

## 6. UI Primitives (Shared Components)

Used by layout and/or pages. Listed by dependency and usage.

### `lib/utils.js`
- **Exports:** `cn(...inputs)` = `twMerge(clsx(inputs))`.
- **Used by:** Almost every UI component for conditional class names.

### `Button.jsx`
- **Deps:** `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `cn`.
- **API:** `variant` (primary, default, destructive, danger, success, outline, secondary, ghost, link), `size` (default, sm, lg, icon), `asChild`, `loading`, `disabled`, `className`, rest to root.
- **Implementation:** `cva()` for variants; root is `<Slot>` or `<button>`; when `loading`, shows spinner + children; `disabled` when `disabled || loading`.
- **Used by:** Header, Sidebar, Customers, Items, Accounts, Payments, Dashboard, EntriesTable, etc.

### `Card.jsx`
- **Deps:** `cn`.
- **Exports:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` — all forwardRef divs with specific padding/borders.
- **Used by:** Dashboard (stat cards, quick actions), Customers, Accounts, Items, Payments, Vouchers, etc.

### `Input.jsx`
- **Deps:** `cn`.
- **API:** `label`, `name`, `id`, `required`, `error`, `placeholder`, `register` (react-hook-form), `type`, rest. Optional label and error message below.
- **Used by:** FormInput, Items, and any form that needs a labeled input with validation display.

### `form-input.jsx`
- **Parent usage:** Form pages (Customers, Accounts, Payments, etc.).
- **Implementation:** Thin wrapper over `Input`; maps `error` to `error?.message || error` and passes through label, name, register, required, etc.

### `Select.jsx` (Radix Select + SelectWrapper)
- **Deps:** `@radix-ui/react-select`, `lucide-react` (Check, Chevrons), `cn`.
- **Exports:** Select primitives (Root, Group, Value, Trigger, Content, Label, Item, Separator, Scroll buttons) and **SelectWrapper**.
- **SelectWrapper:** Accepts `label`, `name`, `register`, `required`, `error`, `options`, `placeholder`; internal state for value; syncs with `register` via `onValueChange` and optional `onChange` target. Renders Trigger + Content + options as SelectItems.
- **Used by:** FormSelect, Items (type, unit), Accounts (type), Payments (many dropdowns).

### `form-select.jsx`
- **Implementation:** Wrapper around `SelectWrapper`; passes label, name, register, required, error, options, placeholder to SelectWrapper.
- **Used by:** Accounts, Payments, and any form with dropdowns.

### `label.jsx`
- **Implementation:** Radix-style label with `cn` and optional `htmlFor`. Not used everywhere; some pages use raw `<label>` or `Input`’s built-in label.

### `Modal.jsx`
- **API:** `isOpen`, `onClose`, `title`, `children`, `size` (sm/md/lg/xl).
- **Implementation:** If !isOpen returns null. Otherwise fixed overlay, backdrop (click = onClose), centered panel with title row (title + X button) and children. No Radix; no focus trap.
- **Used by:** Items (add/edit item form). Other pages use Dialog instead.

### `Table.jsx`
- **API:** `columns` (array of `{ key, label, render? }`), `data`, `actions?`, `onAction?`.
- **Implementation:** `<table>` with thead from columns (+ optional Actions column), tbody: either "No data available" or rows; each cell uses `column.render(value, row)` if present else `row[column.key]`. Actions column calls `onAction(action.key, row)`.
- **Used by:** Items, Vouchers, and any page that needs a simple table without pagination/sorting.

### `data-table.jsx`
- **Deps:** `@mui/x-data-grid`, `@mui/material` (Box, IconButton), `lucide-react` (Edit, Trash2, Eye).
- **API:** `columns`, `data`, `onEdit`, `onView`, `onDelete`, `loading`, `pageSize`, ...props.
- **Implementation:** Maps columns to MUI grid format; adds actions column with View/Edit/Delete icon buttons if handlers provided; maps data to rows with `id: row._id || row.id || index`. Renders MUI `DataGrid` inside Box (height 600).
- **Used by:** Customers, Accounts, Payments — pages that want DataGrid + CRUD actions.

### `dropdown-menu.jsx`
- **Deps:** `@radix-ui/react-dropdown-menu`, `lucide-react`, `cn`.
- **Exports:** Root, Trigger, Content, Item, Label, Separator, Sub, CheckboxItem, RadioItem, Shortcut, etc. All styled with `cn` and primary/gray theme.
- **Used by:** Header (user menu).

### `dialog.jsx`
- **Deps:** `@radix-ui/react-dialog`, `lucide-react` (X), `cn`.
- **Exports:** Dialog (Root), Trigger, Portal, Overlay, Content, Close, Header, Footer, Title, Description.
- **Implementation:** Content = Portal + Overlay + positioned panel + close button; controlled via `open` / `onOpenChange`.
- **Used by:** Customers, Accounts, Payments (add/edit forms in modal).

### `EntriesTable.jsx`
- **API:** `entries`, `entryType`, `onEdit`, `onDelete`, `onViewImage`, `onPageChange`, `page`, `total`, `limit`, `showPagination`, `emptyMessage`.
- **Implementation:** Custom table (Name, Description, Amount, Image, Actions); Image cell has view button if `entry.image`. Pagination: first/prev/next/last with Button components.
- **Used by:** Expenses (and any similar list with image + amount + pagination).

---

## 7. Pages (Outlet Content) — Parent → Child

Each page is rendered as `<Outlet />` inside `Layout`. Only key parent→child and component usage is listed.

### `Dashboard.jsx`
- **State:** `stats`, `loading`.
- **Fetches:** Parallel API calls (customers, suppliers, items, expenses, transactions); then items for low stock count, expenses sum, transactions (sales) sum. Sets stats and lowStockItems.
- **Children:** 
  - Title + subtitle.
  - Grid of **Card** (x6) for Total Customers, Suppliers, Items, Revenue, Expenses, Low Stock; each card onClick navigates to the right route.
  - One **Card** for "Quick Actions" (4 buttons: Add Customer, Add Supplier, Stock Entry, Add Expense) → `navigate(path)`.
- **Uses:** Card, api, toast, formatCurrency, lucide icons.

### `Customers.jsx`
- **State:** customers, loading, isModalOpen, editingCustomer, searchTerm. **Form:** react-hook-form (register, handleSubmit, errors, reset, setValue).
- **Fetches:** GET /customers (page 1, limit 1000, search) on mount and when searchTerm changes.
- **Children:**
  - Page title + "Add Customer" **Button**.
  - **Card** (CardHeader, CardTitle, CardDescription, CardContent): search input, **DataTable** (columns, data, onEdit, onDelete).
  - **Dialog** (open, onOpenChange): DialogHeader (Title, Description), form with **FormInput** (name, address, phone), checkbox (isActive), DialogFooter with Cancel **Button** and Submit **Button**.
- **Handlers:** handleCreate, handleEdit (setValue + open modal), handleDelete (confirm + DELETE), onSubmit (POST/PUT + toast + close + refetch).

### `Items.jsx`
- **State:** items, loading, isModalOpen, editingItem, searchTerm, pagination. **Form:** react-hook-form + watch('type').
- **Fetches:** GET /items with page, limit, search; pagination in state.
- **Children:**
  - Title + "Add Item" **Button**.
  - **Card:** search input, loading spinner or **Table** (columns, data, actions, onAction), then pagination **Button**s (Prev/Next).
  - **Modal** (isOpen, onClose, title, size): form with **Input** (name, code if edit, category, prices, stock levels, reorder, conversionRate when type finished_product), **Select** (type, unit), textareas (description, notes), Cancel/Submit **Button**s.
- **Uses:** Select from ui/Select (SelectWrapper), Modal, Table, Button, Input, formatCurrency, formatDate.

### `Accounts.jsx`
- **State:** accounts, loading, isModalOpen, editingAccount, searchTerm, stats (totalCash, totalBank, totalAccounts). **Form:** react-hook-form + watch('isBankAccount', 'type').
- **Fetches:** GET /accounts (search, isActive); stats from pagination.
- **Children:**
  - Title + "Add Account" **Button**.
  - Three **Card**s for Total Cash, Total Bank, Total Accounts (stats).
  - **Card** (CardHeader, CardTitle, CardDescription, CardContent): search, **DataTable** (columns, data, onEdit, onDelete).
  - **Dialog:** form with **FormInput** (code, name, openingBalance, bankDetails when isBankAccount, notes), **FormSelect** (type), checkboxes (isCashAccount, isBankAccount), DialogFooter **Button**s.
- **Submit:** Builds bankDetails from flat fields; POST/PUT /accounts.

### `Payments.jsx`
- **State:** payments, accounts, mazdoors, customers, suppliers, loading, isModalOpen, paymentType, editingPayment, searchTerm, filterType, stats. **Form:** react-hook-form + watch('paymentMethod', 'category').
- **Fetches:** GET /payments, /accounts, /mazdoors, /customers, /suppliers (used for dropdowns and stats).
- **Children:** Similar pattern: title, filters, **Card**s for stats, **Card** with **DataTable**, **Dialog** with **FormInput** / **FormSelect** and conditional fields. Uses formatCurrency, formatDate.

### `Vouchers.jsx`
- **State:** vouchers (hardcoded mock array), searchTerm, filterType. No API.
- **Children:** Title, many **Button**s (Bank Payment, Bank Receipt, etc.) that `navigate('/vouchers/bank-payment')` etc., four **Card**s (counts by type), **Card** with search, type filter, **Table** (columns, filteredVouchers).
- **Note:** Routes `/vouchers/*` are not defined in App.jsx; those navigations will send user to catch-all then `/` (Dashboard). Payments at `/payments` is the real payments/voucher list.

### Other pages (same idea)
- **Suppliers, Mazdoors, Users:** Same CRUD + DataTable + Dialog + FormInput/FormSelect pattern as Customers/Accounts.
- **Inventory:** Stock management; uses api, Card, Table or similar.
- **Expenses:** Uses **EntriesTable**, api, form for expense entries (with image).
- **Transactions, DailyCashMemo, LabourRates, LabourExpenses:** Follow the same layout (Card, table/grid, modals, api, formatters).

---

## 8. Config & Utils

### `config/api.js`
- **Axios instance:** baseURL from `VITE_API_BASE_URL` or `http://localhost:5000/api`.
- **Request:** Interceptor adds `Authorization: Bearer <token>` from localStorage.
- **Response:** Interceptor on 401 clears token and user from localStorage (no redirect; AuthContext re-renders and ProtectedRoute can send to login).
- **Used by:** AuthContext, all pages that fetch data.

### `utils/formatters.js`
- **Exports:** formatCurrency (PKR), formatDate, formatDateTime, formatPhone (PK format).
- **Used by:** Dashboard, Customers, Items, Accounts, Payments, Vouchers, etc.

### `index.css`
- **Tailwind:** base, components, utilities.
- **Base:** body bg and text color.
- **Components:** .btn, .btn-primary, .btn-secondary, .btn-danger, .btn-success, .input, .label, .card, .sidebar-scrollbar (thin scrollbar for nav).
- **Used by:** Global; some forms use .input / .label (e.g. Items textareas).

### `tailwind.config.js`
- **Content:** index.html, src **/*.{js,ts,jsx,tsx}.
- **Theme:** primary palette 50–900 (sky/blue). No extra plugins.

---

## 9. Backend (How Frontend Connects)

### `server.js`
- **Stack:** Express, dotenv, cors, helmet, morgan, compression.
- **Routes:** /api/health, /api/auth, /api/customers, /api/suppliers, /api/items, /api/inventory, /api/expenses, /api/transactions, /api/users, /api/mazdoors, /api/accounts, /api/payments, /api/daily-cash-memos, /api/labour-rates, /api/labour-expenses.
- **Middleware:** notFound, errorHandler after routes. DB connect before listen (MongoDB).
- **Frontend uses:** Same path prefixes via api.js baseURL; auth via Bearer token; all list/create/update/delete go to these routes.

---

## 10. Summary Diagram (Conceptual)

```
index.html
  └── main.jsx
        └── StrictMode
              └── App (AuthProvider)
                    └── Router
                          ├── Toaster
                          └── Routes
                                ├── /login → Login
                                ├── /      → ProtectedRoute
                                │             └── Layout
                                │                   ├── Sidebar (NavLinks, Button logout)
                                │                   ├── Header (Button, DropdownMenu)
                                │                   └── main → Outlet
                                │                                ├── Dashboard (Card×7)
                                │                                ├── Customers (Card, DataTable, Dialog, FormInput, Button)
                                │                                ├── Items (Card, Table, Modal, Input, Select, Button)
                                │                                ├── Accounts (Card×4, DataTable, Dialog, FormInput, FormSelect, Button)
                                │                                ├── Payments (Card, DataTable, Dialog, FormInput, FormSelect, Button)
                                │                                ├── Vouchers (Card, Table, Button) [mock data; /vouchers/* not in routes]
                                │                                └── … (Suppliers, Mazdoors, Inventory, Expenses, Transactions, Users, DailyCashMemo, LabourRates, LabourExpenses)
                                └── * → Navigate to="/"
```

---

## 11. Findings & Inconsistencies

1. **Vouchers vs Payments:** Vouchers.jsx uses mock data and links to `/vouchers/bank-payment` etc.; App.jsx has no `/vouchers` routes. The real payments UI is at `/payments` (Payments.jsx with API). Either add `/vouchers` and sub-routes or point sidebar/links to Payments and remove/repurpose Vouchers.
2. **Modal vs Dialog:** Items uses custom **Modal**; Customers, Accounts, Payments use Radix **Dialog**. Both work; unifying on Dialog would improve accessibility (focus trap, escape) and consistency.
3. **Table vs DataTable:** Items and Vouchers use **Table**; Customers, Accounts, Payments use **DataTable** (MUI). Two table stacks (simple + MUI) are maintained.
4. **Login form:** Uses raw `<input>` and `<button>`; the rest of the app uses **Input**/FormInput and **Button**. Could refactor for consistency and reuse.
5. **Header dropdown:** Profile and Settings items have no `onClick`; they’re placeholders.
6. **SelectWrapper + react-hook-form:** SelectWrapper keeps internal `value` state and tries to sync with `register`; FormSelect passes ref but SelectWrapper doesn’t forward ref. May need care when validating or resetting select fields.
7. **ProtectedRoute:** Renders `children` when authenticated; the layout route passes `<Layout />` as children, so Outlet is inside Layout, which is correct.

---

This document describes every component from the root down and how they connect. If you want, we can next (1) fix the Vouchers routing and data, (2) standardize on Dialog and one table approach, or (3) add the missing Header menu actions.
