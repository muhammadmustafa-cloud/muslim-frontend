# Ultra-Deep Analysis — Muslim Daal Mill (Full Stack)

**Every file, every component, every state variable, every handler, every API, and every backend route/model/controller/validator.**

---

# PART A — FRONTEND

---

## A1. Entry & Build

| File | Purpose | Details |
|------|---------|--------|
| `index.html` | HTML shell | `<div id="root">`, title "Muslim Daal Mill - Management System", script `/src/main.jsx`. |
| `main.jsx` | React entry | `createRoot(#root).render(StrictMode > App)`. Imports App, index.css. No router/provider here. |
| `vite.config.js` | Build config | React plugin; optimizeDeps include jspdf, jspdf-autotable; build commonjs for jspdf-autotable; server port 5173, proxy `/api` → `http://localhost:5000`. |
| `postcss.config.js` | PostCSS | tailwindcss, autoprefixer. |
| `tailwind.config.js` | Tailwind | content: index.html, src **/*.{js,ts,jsx,tsx}; theme extend: primary 50–900 (sky blue). |

---

## A2. App.jsx — Exact Tree & Routes

**Component tree (top to bottom):**
1. `AuthProvider` (wraps all)
2. `Router`
3. `Toaster` (position="top-right")
4. `Routes`
   - `Route path="/login"` → **Login** (no Layout)
   - `Route path="/" element={ProtectedRoute > Layout}` (nested):
     - `Route index` → **Dashboard**
     - `Route path="customers"` → **Customers**
     - `Route path="suppliers"` → **Suppliers**
     - `Route path="items"` → **Items**
     - `Route path="inventory"` → **Inventory**
     - `Route path="expenses"` → **Expenses**
     - `Route path="mazdoors"` → **Mazdoors**
     - `Route path="transactions"` → **Transactions**
     - `Route path="accounts"` → **Accounts**
     - `Route path="payments"` → **Payments** (from `pages/vouchers/Payments.jsx`)
     - `Route path="daily-cash-memo"` → **DailyCashMemo**
     - `Route path="labour"` → **LabourRates**
     - `Route path="labour-expenses"` → **LabourExpenses**
     - `Route path="users"` → **Users**
   - `Route path="*"` → **Navigate to="/" replace**

**Not in routes:** There is no `/vouchers` or `/vouchers/bank-payment`, `/vouchers/bank-receipt`, etc. So **Vouchers.jsx**, **BankPayment.jsx**, **BankReceipt.jsx**, **CashPayment.jsx**, **CashReceipt.jsx**, **BankTransfer.jsx**, **JournalEntry.jsx** are never rendered by the app. Any navigation to `/vouchers` or `/vouchers/*` goes to catch-all and redirects to `/`.

---

## A3. Auth Layer — Line-by-Line

### AuthContext.jsx
- **createContext(null)** → context for auth.
- **useAuth()** → throws if used outside AuthProvider.
- **AuthProvider state:** `user`, `loading` (both useState).
- **useEffect (mount):** reads `localStorage` token + user; if present, `api.get('/auth/me')`; on success sets user from response; on error clears localStorage and sets user null; then `setLoading(false)`.
- **login(email, password):** POST `/auth/login`, stores token + JSON user in localStorage, setUser(userData), returns userData.
- **logout():** removeItem token & user, setUser(null).
- **Context value:** `{ user, login, logout, loading, isAuthenticated: !!user }`.

### ProtectedRoute.jsx
- **Props:** `children` (Layout when used in App).
- **useAuth()** → isAuthenticated, loading.
- If **loading** → div with spinner (h-12 w-12 border animation).
- If **!isAuthenticated** → `<Navigate to="/login" replace />`.
- Else → `children || <Outlet />` (here always children = Layout).

---

## A4. Layout — Every Child

### Layout.jsx
- **Structure:** flex h-screen bg-gray-50 overflow-hidden.
  - **Sidebar** (w-72, border-r).
  - **div flex-1 flex flex-col:** Header, then **main** with **Outlet** (p-6, overflow-y-auto).

### Sidebar.jsx
- **Imports:** NavLink, lucide icons (LayoutDashboard, Users, ShoppingBag, Package, etc.), useAuth, cn, Button.
- **State from useAuth:** logout, user.
- **menuGroups array:** Main (Dashboard), People (Customers, Suppliers, Mazdoors), Inventory (Items, Stock), Financial (Transactions, Expenses, Payments, Accounts, Labour Expenses, Labour, Daily Cash Memo). If `user?.role === 'admin'` push Settings with Users.
- **Markup:** aside with logo block, nav (map groups → NavLink per item with icon, label, active pill), footer block (user name/email, Logout Button).

### Header.jsx
- **useAuth:** user.
- **Markup:** "Welcome back, {user?.name}", role; Bell Button (no handler); DropdownMenu (Trigger = Button with User icon + email), Content: My Account, Profile (no onClick), Settings (no onClick).

---

## A5. Login.jsx — Every Prop & Handler

- **State:** loading (useState false).
- **Hooks:** useNavigate, useAuth (login), toast.
- **handleFormSubmit(e):** preventDefault, stopPropagation; FormData from e.target; data = { email, password }; await onSubmit(data).
- **onSubmit(data):** setLoading(true); login(data.email, data.password); toast.success, navigate('/'); on 401 toast specific message; else toast error message; finally setLoading(false).
- **Form:** native input email (required), native input password (required), native button submit (disabled when loading, shows spinner + "Signing In..." or "Sign In"). No Input/Button components.

---

## A6. UI Components — Props, Exports, Dependencies

| Component | Deps | Props (key) | Exports / Notes |
|-----------|------|--------------|------------------|
| **utils.js** | clsx, tailwind-merge | — | `cn(...inputs)` = twMerge(clsx(inputs)) |
| **Button** | Radix Slot, cva, clsx, twMerge, cn | variant, size, asChild, loading, disabled, className | forwardRef; Comp = Slot or button; loading → spinner + children |
| **Card** | cn | className, children | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter (all forwardRef divs) |
| **Input** | cn | label, name, id, required, error, placeholder, register, type | Optional label/error; register spread on input; id = id \|\| name |
| **FormInput** | Input | label, name, register, required, error, className | Passes error?.message \|\| error to Input |
| **Select (Radix)** | @radix-ui/react-select, Check, Chevrons, cn | — | Root, Group, Value, Trigger, Content, Label, Item, Separator, ScrollUp/Down |
| **SelectWrapper** | Select primitives | label, name, register, required, error, options, placeholder | Internal state value; syncs to register via onValueChange; default export from Select.jsx |
| **FormSelect** | SelectWrapper | same as SelectWrapper | Thin wrapper, passes ref (SelectWrapper doesn’t forward ref) |
| **Label** | cn | className, htmlFor | forwardRef label |
| **Modal** | — | isOpen, onClose, title, children, size (sm/md/lg/xl) | If !isOpen return null; overlay + backdrop click = onClose; no focus trap |
| **Table** | — | columns[{key, label, render?}], data, actions?, onAction? | table thead/tbody; render(value, row); onAction(action.key, row) |
| **DataTable** | MUI DataGrid, Box, IconButton, Edit/Trash2/Eye | columns, data, onEdit, onView, onDelete, loading, pageSize | Maps columns to MUI; adds actions column; rows need id = _id \|\| id \|\| index |
| **dropdown-menu** | Radix dropdown, Check, ChevronRight, Circle, cn | — | Root, Trigger, Content, Item, Label, Separator, Sub, CheckboxItem, RadioItem, Shortcut |
| **dialog** | Radix dialog, X, cn | — | Dialog (Root), Trigger, Portal, Overlay, Content, Close, Header, Footer, Title, Description; Content has built-in close button |
| **EntriesTable** | Button | entries, entryType, onEdit, onDelete, onViewImage, onPageChange, page, total, limit, showPagination, emptyMessage | Custom table Name/Description/Amount/Image/Actions; pagination first/prev/next/last |

---

## A7. Pages — State, API, Children, Bugs

### Dashboard
- **State:** stats (totals + lowStockItems), loading.
- **API:** Promise.all customers/suppliers/items/expenses/transactions (limit 1); then items limit 1000 (low stock), expenses 1000 (sum), transactions 1000 (sale total).
- **Children:** title; grid of 6 Card (click → navigate); 1 Card "Quick Actions" with 4 buttons (navigate).
- **Uses:** Card, formatCurrency.

### Customers
- **State:** customers, loading, isModalOpen, editingCustomer, searchTerm. **Form:** useForm (register, handleSubmit, errors, reset, setValue).
- **API:** GET /customers (page 1, limit 1000, search) when searchTerm changes.
- **Children:** title, Button Add; Card (CardHeader, CardTitle, CardDescription, CardContent) with search input, **DataTable** (onEdit, onDelete); **Dialog** with FormInput (name, address, phone), checkbox isActive, DialogFooter Buttons.
- **Pattern:** Create/Edit/Delete with toast and refetch.

### Suppliers
- **State:** suppliers, loading, isModalOpen, editingSupplier, searchTerm, pagination (page, limit, total).
- **API:** GET /suppliers (page, limit, search) when pagination.page or searchTerm change.
- **Children:** title, Button Add; Card with search, loading spinner or **Table** (columns, data, actions, onAction), pagination Buttons; **Modal** with **Input** (name, address, phone), Cancel/Submit Buttons.
- **Uses:** Modal, Table, Input (not Dialog/FormInput/DataTable).

### Items
- **State:** items, loading, isModalOpen, editingItem, searchTerm, pagination. **Form:** useForm + watch('type').
- **API:** GET /items (page, limit, search).
- **Children:** Card with search, **Table** + pagination; **Modal** with Input (many), Select (type, unit), textareas (description, notes), conditional conversionRate when type finished_product.
- **Uses:** Modal, Table, Input, Select (SelectWrapper).

### Inventory
- **State:** stockRecords, items, loading, isModalOpen, searchTerm, pagination. **Form:** useForm, watch('operation').
- **API:** GET /items?limit=1000, GET /inventory (page, limit, search).
- **Children:** Card with search, **Table** (no actions); **Modal** with Select (item, operation), Input (quantity, rate, date), conditional reason when operation adjustment, notes textarea.
- **Create only** (no edit/delete in UI).

### Expenses
- **State:** expenses, mazdoors, suppliers, loading, isModalOpen, editingExpense, searchTerm, pagination. **Form:** useForm, watch('category').
- **API:** GET /mazdoors?limit=1000, GET /suppliers?limit=1000, GET /expenses (page, limit, search).
- **Children:** Card with search, **Table** (actions Edit/Delete); **Modal** with Select (category, paymentMethod, mazdoor when category mazdoor, supplier when raw_material), Input (subCategory, description, amount, date, billNumber), notes textarea.
- **Uses:** Modal, Table, Input, Select.

### Mazdoors
- **State:** mazdoors, loading, isModalOpen, editingMazdoor, searchTerm, pagination. **Form:** useForm.
- **API:** GET /mazdoors (page, limit, search).
- **Children:** Card, **Table** (actions); **Modal** with Input (name, phone, alternatePhone, cnic, address.*, hireDate, salary), Select (salaryType), notes textarea.
- **Uses:** Modal, Table, Input, Select.

### Users
- **State:** users, loading, isModalOpen, editingUser, searchTerm, pagination. **Form:** useForm.
- **API:** GET /users (page, limit, search).
- **Children:** Card, **Table** (actions); **Modal** with Input (name, email disabled when edit, phone), Select (role), Input password required only when !editingUser.
- **Uses:** Modal, Table, Input, Select.

### Accounts
- **State:** accounts, loading, isModalOpen, editingAccount, searchTerm, stats (totalCash, totalBank, totalAccounts). **Form:** useForm, watch('isBankAccount', 'type').
- **API:** GET /accounts (page 1, limit 1000, search, isActive true); stats from response.data.pagination.
- **Children:** 3 Cards (stats); Card with search, **DataTable**; **Dialog** with FormInput (code, name, openingBalance, bankDetails when isBankAccount, notes), FormSelect (type), checkboxes isCashAccount/isBankAccount, DialogFooter.
- **Submit:** Builds bankDetails from flat keys; POST/PUT /accounts.

### Payments (vouchers/Payments.jsx)
- **State:** payments, accounts, mazdoors, customers, suppliers, loading, isModalOpen, paymentType, editingPayment, searchTerm, filterType, stats. **Form:** useForm, watch('paymentMethod', 'category').
- **API:** GET /payments, /accounts, /mazdoors, /customers, /suppliers (params depend on filter/search).
- **Children:** title, filters; Card with **DataTable**; **Dialog** with FormInput/FormSelect and conditional fields by type/category.
- **Uses:** Dialog, DataTable, FormInput, FormSelect. This is the **only** payments/voucher list in the app (real API).

### Transactions
- **State:** transactions, customers, suppliers, items, accounts, loading, searchTerm, pagination, isModalOpen, transactionType, viewingTransaction, isViewModalOpen, filters (type, customer, supplier, paymentStatus, paymentMethod, startDate, endDate), showFilters, selectedItem, itemQuantity, transactionItems. **Form:** useForm, watch discount/tax/paidAmount/account.
- **API:** GET /transactions (with filters), GET /customers, /suppliers, /items, /accounts (limit 1000).
- **Children:** Card with search, filter panel (native select/input), **DataTable** (onView, onDelete); **Dialog** Create Sale/Purchase (FormSelect customer/supplier, account, paymentMethod, FormInput date, paidAmount, discount, tax; native select + input for items, transactionItems list with update qty/remove); **Dialog** View transaction details.
- **Submit:** Builds transaction + optional POST /payments when paidAmount > 0 and account selected.
- **Uses:** Dialog, DataTable, FormInput, FormSelect.

### DailyCashMemo
- **State:** selectedDate, memo, loading, previousBalance, isEntryModalOpen, editingEntry, entryType (credit/debit), isNotesModalOpen, imagePreview, selectedImage, isImageModalOpen. **Form:** useForm (mode onChange), watch('notes').
- **API:** GET /daily-cash-memos/previous-balance?date, GET /daily-cash-memos/date/:date; PUT/POST for memo and notes.
- **Children:** date input, Export PDF/Excel Buttons, Notes Button; 2 Cards (Credit / Debit) with inline tables and Add Entry; Closing Balance Card; **Dialog** Entry (FormInput name/description/amount, file upload image, DialogFooter); **Dialog** Notes (textarea); **Dialog** Image view.
- **Uses:** exportToPDF, exportToExcel from exportUtils; Dialog, FormInput (error passed as errors.name etc. — FormInput accepts error string or object with message, so works).
- **Export:** exportUtils uses jspdf + jspdf-autotable, xlsx.

### LabourRates
- **State:** labourRates, labourExpenses, loading, loadingExpenses, isModalOpen, editingLabourRate, searchTerm, saving, filters (startDate, endDate). **Form:** useForm.
- **API:** GET /labour-rates (page 1, limit 1000, search, startDate, endDate, isActive), GET /labour-expenses (limit 1000).
- **Children:** title, Download PDF Button (jsPDF + autotable in-component), Add Button; Card with date filters + search, Apply Filters Button, **DataTable** (onEdit, onDelete); **Dialog** with native select (labourExpense), **FormInput** (bags) with **errors={errors}**.
- **Bug:** FormInput expects **error** (string), not **errors** (object). LabourRates passes `errors={errors}` so FormInput gets error=undefined; validation message for "bags" won’t show.

### LabourExpenses
- **State:** labourExpenses, loading, isModalOpen, editingLabourExpense, searchTerm. **Form:** useForm.
- **API:** GET /labour-expenses (page 1, limit 1000, search, isActive).
- **Children:** Card with search, **DataTable** (onEdit, onDelete); **Dialog** with **FormInput** (name, rate) with **errors={errors}**.
- **Bug:** Same as LabourRates — FormInput expects `error={errors.name?.message}` not `errors={errors}`; error messages won’t display.

### Vouchers (pages/vouchers/Vouchers.jsx)
- **State:** vouchers (hardcoded array of 6 mock vouchers), searchTerm, filterType.
- **No API.** Filter by search + type.
- **Children:** Buttons that navigate to `/vouchers/bank-payment` etc. (those routes don’t exist → user lands on /); 4 Cards (counts); Card with search, native select filter, **Table** (filteredVouchers).
- **Result:** All voucher-type buttons redirect to Dashboard.

### BankPayment, BankReceipt, CashPayment, CashReceipt, BankTransfer, JournalEntry
- **Not mounted** — no route in App.jsx. BankPayment uses navigate('/vouchers') and mock accounts; others similar. Dead code unless routes added.

---

## A8. Config & Utils (Frontend)

| File | Exports / Behavior |
|------|--------------------|
| **config/api.js** | Axios instance baseURL = VITE_API_BASE_URL \|\| http://localhost:5000/api; request interceptor: Authorization Bearer from localStorage; response interceptor: on 401 clear token & user in localStorage (no redirect). |
| **utils/formatters.js** | formatCurrency (PKR), formatDate, formatDateTime, formatPhone (PK format). |
| **utils/exportUtils.js** | exportToPDF(memo, selectedDate, previousBalance) — jspdf + jspdf-autotable, ledger-style; exportToExcel(...) — xlsx, sheets Credit/Debit/Combined. |
| **utils/pdfHelper.js** | ensureAutoTableLoaded (dynamic import), createPDF () => new jsPDF(). |
| **index.css** | @tailwind base/components/utilities; body styles; .btn, .input, .label, .card, .sidebar-scrollbar. |

---

## A9. Frontend Dependency Summary

- **React 18**, react-dom, react-router-dom, react-hook-form, react-hot-toast.
- **UI:** @radix-ui/react-dialog, dropdown-menu, select, slot, label; @mui/material, @mui/x-data-grid; class-variance-authority, clsx, tailwind-merge; lucide-react.
- **HTTP:** axios.
- **PDF/Excel:** jspdf, jspdf-autotable, xlsx.
- **Build:** vite, @vitejs/plugin-react, tailwindcss, postcss, autoprefixer.

---

# PART B — BACKEND

---

## B1. Server (server.js)

- **Stack:** express, dotenv, cors, helmet, morgan (dev), compression.
- **Body:** express.json({ limit: '10mb' }), urlencoded({ extended: true, limit: '10mb' }).
- **Routes:** GET /api/health → 200 JSON; then:
  - /api/auth → authRoutes
  - /api/customers → customerRoutes
  - /api/suppliers → supplierRoutes
  - /api/items → itemRoutes
  - /api/inventory → inventoryRoutes
  - /api/expenses → expenseRoutes
  - /api/transactions → transactionRoutes
  - /api/users → userRoutes
  - /api/mazdoors → mazdoorRoutes
  - /api/accounts → accountRoutes
  - /api/payments → paymentRoutes
  - /api/daily-cash-memos → dailyCashMemoRoutes
  - /api/labour-rates → labourRateRoutes
  - /api/labour-expenses → labourExpenseRoutes
- **After routes:** notFound, errorHandler.
- **Start:** database.connect(MONGODB_URI \|\| 'mongodb://localhost:27017/muslim-dall-mill'), then listen(PORT \|\| 5000). Unhandled rejection → log and exit(1).

---

## B2. Middleware

| File | Exports | Behavior |
|------|---------|----------|
| **auth.middleware.js** | authenticate, authorize(...roles), authorizeAdminOrManager, authorizeAdmin | authenticate: Bearer token from header → jwt.verify(JWT_SECRET) → User.findById → req.user; check isActive; UnauthorizedError if no token/invalid/inactive. authorize: require req.user, role in allowed roles else ForbiddenError. |
| **error.middleware.js** | errorHandler | Normalize err: CastError → 404, 11000 → 409, ValidationError → 400, JWT/TokenExpired → 401; sendError(res, message, statusCode, stack in dev). |
| **notFound.middleware.js** | notFound | sendError(res, \`Route ${req.originalUrl} not found\`, 404). |
| **validate.middleware.js** | validate | validationResult(req); if !isEmpty return sendError 400 with field/message array; else next(). |

---

## B3. Config & Utils (Backend)

| File | Content |
|------|---------|
| **config/database.js** | Class Database: connect(uri) mongoose.connect with options (maxPoolSize 10, timeouts), disconnect(), isConnected(). Export default new Database(). |
| **utils/response.js** | sendSuccess(res, data, message, statusCode), sendError(res, message, statusCode, errors), sendPaginated(res, data, pagination, message, statusCode). |
| **utils/errors.js** | AppError(message, statusCode), ValidationError, NotFoundError, UnauthorizedError, BadRequestError, ForbiddenError, ConflictError. |
| **utils/constants.js** | USER_ROLES, ITEM_TYPES, TRANSACTION_TYPES, INVENTORY_OPERATIONS, EXPENSE_CATEGORIES, PAYMENT_STATUS, UNITS, ACCOUNT_TYPES, VOUCHER_TYPES, VOUCHER_STATUS, ENTRY_TYPES, HTTP_STATUS. |

---

## B4. Routes Pattern (Example: auth, customer)

- **auth.routes.js:** POST /register (registerValidator, validate, register); POST /login (loginValidator, validate, login); GET /me (authenticate, getMe); PUT /password (authenticate, updatePasswordValidator, validate, updatePassword).
- **customer.routes.js:** router.use(authenticate); GET/POST / (getCustomers, createCustomerValidator+validate+createCustomer); GET/PUT/DELETE /:id (getCustomer, updateCustomer, deleteCustomer with validators).

All other resource routes follow the same pattern: authenticate, then validator + validate + controller for body/params.

---

## B5. Controllers Pattern (Example: auth)

- **auth.controller.js:** register (check existing email, User.create, generateToken, sendSuccess 201); login (findOne email +password, matchPassword, lastLogin save, generateToken, sendSuccess); getMe (findById req.user.id, sendSuccess); updatePassword (verify current, set new, save).
- **customer.controller.js** (and others): get list with pagination/search, get one by id, create (req.body, often set createdBy from req.user), update (findByIdAndUpdate), delete (findByIdAndDelete); use sendSuccess/sendPaginated/sendError; call next(err) for operational errors.

---

## B6. Models Pattern (Example: User, Customer)

- **User.model.js:** Schema name, email (unique), phone, password (select: false, min 6), role (enum USER_ROLES), isActive, lastLogin, createdBy/updatedBy (ref User). Pre-save hash password (bcrypt); methods matchPassword, generateToken (jwt.sign id, JWT_SECRET, expiresIn). Indexes email, phone, role, isActive.
- **Customer.model.js:** Schema name, address, phone (optional validator), isActive, createdBy/updatedBy (ref User). Indexes name, phone, isActive, createdAt.

Other models: Supplier, Item, Stock, Expense, Transaction, Payment, Account, DailyCashMemo, LabourRate, LabourExpense, Mazdoor — same idea (schema, indexes, refs where needed).

---

## B7. Validators Pattern

- **auth.validator.js:** registerValidator, loginValidator, updatePasswordValidator — body(...) with express-validator checks; used in routes before validate middleware.
- **customer.validator.js:** createCustomerValidator, updateCustomerValidator, customerIdValidator (param id). Same for other resources.

---

# PART C — CROSS-CUTTING

---

## C1. Request Flow (Example: Create Customer)

1. **Frontend:** Customers.jsx handleCreate → setIsModalOpen(true). User fills form, submit → onSubmit(data) → api.post('/customers', data). Axios adds Authorization Bearer from localStorage.
2. **Backend:** POST /api/customers → customer.routes: authenticate (JWT → req.user), createCustomerValidator, validate → customer.controller createCustomer (req.body, set createdBy: req.user.id), Customer.create, sendSuccess/sendPaginated or next(err).
3. **Frontend:** Response success → toast.success, setIsModalOpen(false), reset(), fetchCustomers().

---

## C2. Critical Findings Summary

1. **Vouchers routes missing:** Vouchers.jsx and all voucher sub-pages (BankPayment, BankReceipt, etc.) are never rendered. Add routes under /vouchers or remove/repurpose those components and fix navigation.
2. **LabourRates / LabourExpenses FormInput bug:** They pass `errors={errors}`; FormInput expects `error={errors.field?.message}`. Fix: pass `error={errors.bags?.message}` and `error={errors.name?.message}` / `error={errors.rate?.message}` respectively.
3. **Modal vs Dialog:** Items, Suppliers, Mazdoors, Users, Inventory, Expenses use **Modal**; Customers, Accounts, Payments, Transactions, DailyCashMemo, LabourRates, LabourExpenses use **Dialog**. Inconsistent; Dialog has focus trap and a11y.
4. **Table vs DataTable:** Simple **Table** in Items, Suppliers, Mazdoors, Users, Inventory, Expenses, Vouchers; **DataTable** (MUI) in Customers, Accounts, Payments, Transactions, LabourRates, LabourExpenses.
5. **Login form:** Raw HTML inputs/button; rest of app uses Input/Button — consider refactoring for consistency.
6. **Header dropdown:** Profile and Settings have no onClick.
7. **DataTable searchPlaceholder:** LabourExpenses passes searchPlaceholder to DataTable; data-table.jsx does not use that prop (no search UI in DataTable).
8. **Backend sendSuccess data shape:** Some controllers return { data: ... }, others may wrap differently; frontend expects response.data.data or response.data.pagination for lists.

---

## C3. File Count Summary

- **Frontend:** 47 JS/JSx files (main, App, contexts, components, pages, config, utils).
- **Backend:** 61 JS files (server, config, middleware, controllers, models, routes, validators, utils, scripts).
- **Voucher pages:** 7 files (Vouchers + BankPayment, BankReceipt, CashPayment, CashReceipt, BankTransfer, JournalEntry); only Payments.jsx is used via route /payments.

This document is the **ultra-deep** reference: every component from root to leaf, every page’s state and API, every UI component’s props, and every backend layer, with noted bugs and inconsistencies.
