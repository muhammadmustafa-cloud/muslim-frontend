# Daily Cash Memo – Deep Analysis

## 1. Purpose

The **Daily Cash Memo** page (`/daily-cash-memo`) is a day-wise cash register:

- **Credit entries** = cash in (receipts, customer payments, etc.) → linked to an **Account** and optional **Customer**.
- **Debit entries** = cash out (expenses by category: mazdoor, electricity, rent, etc.) → linked to **Category** and optional **Mazdoor** / **Supplier**.
- Each day has one memo with **opening balance** (previous day’s closing), **total credit**, **total debit**, and **closing balance**.
- Memo can be **draft** or **posted** (finalized). Posted memos are read-only.

---

## 2. Backend

### 2.1 Model (`DailyCashMemo.model.js`)

- **Document**: One per calendar day (`date` unique).
- **Embedded subdocuments** (no separate collection):
  - `creditEntries[]`: `name`, `description`, `amount`, `account` (ref Account), `customer` (ref Customer), `paymentMethod`, `image`, `entryType`, `paymentReference` (ref Payment), `createdAt`.
  - `debitEntries[]`: same plus `category`, `mazdoor` (ref Mazdoor), `supplier` (ref Supplier), `expenseReference` (ref Expense).
- **Top-level**: `date`, `previousBalance`, `openingBalance`, `closingBalance`, `status` (draft/posted/closed), `notes`, `postedAt`, `postedBy`, `createdBy`, `updatedBy`.
- **Pre-save**: `closingBalance = totalCredit - totalDebit`; when `status` becomes `posted`, `postedAt` is set.

### 2.2 Routes (`/api/daily-cash-memos`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/previous-balance?date=YYYY-MM-DD` | Previous day’s closing balance |
| GET | `/accounts` | Active accounts for dropdown (returns `{ data: { accounts } }`) |
| GET | `/` | List memos (paginated, optional date range) |
| GET | `/date/:date` | Memo for a specific date (or empty structure) |
| GET | `/:id` | Memo by ID |
| POST | `/` | Create memo (date, openingBalance, creditEntries, debitEntries, notes) |
| PUT | `/:id` | Update memo (entries, notes, previousBalance) |
| DELETE | `/:id` | Delete memo |
| POST | `/:id/credit` | Add one credit entry to memo |
| POST | `/:id/debit` | Add one debit entry to memo |
| POST | `/:id/post` | Set status to `posted` |

### 2.3 Controller behaviour

- **getMemoByDate**: Returns memo for that date (or empty `creditEntries`/`debitEntries`/`previousBalance`). Entries sorted by `createdAt` desc.
- **getPreviousBalance**: Uses **query** `date`; previous day = `date - 1`; returns that day’s `closingBalance`.
- **addCreditEntry** / **addDebitEntry**:
  - **Fixed**: They now resolve the memo by **`req.params.id`** (the memo for the selected date). If not found, return 404. If memo is already `posted`, return validation error. No longer use “today” for resolution.
  - Side effects: credit creates a **Payment** (receipt); debit creates a **Payment** and, for certain categories, an **Expense**.
- **getAccounts**: Returns `{ accounts }`; frontend reads `response.data.data.accounts` (because of `sendSuccess(res, { accounts }, ...)` → `data.accounts`).

---

## 3. Frontend

### 3.1 State

- **selectedDate**: Current day (date input); drives which memo is shown.
- **memo**: Current memo for `selectedDate` (from `GET /date/:date`) or `null`.
- **previousBalance**: From `GET /previous-balance?date=selectedDate`.
- **accounts, mazdoors, customers, suppliers**: Dropdown data (accounts from `GET /daily-cash-memos/accounts`; rest from `/mazdoors`, `/customers`, `/suppliers`).
- Modals: entry add/edit, notes, bulk entry, image preview.

### 3.2 API usage

- **Fetch memo**: `GET /daily-cash-memos/date/${selectedDate}` → sets `memo` and notes.
- **Previous balance**: `GET /daily-cash-memos/previous-balance?date=selectedDate`.
- **Dropdowns**: On date change, `fetchDropdownData()` calls accounts, mazdoors, customers, suppliers.
- **Add entry** (single):
  - If `memo._id`: `POST /daily-cash-memos/${memo._id}/credit` or `.../debit`.
  - Else: `POST /daily-cash-memos` with `date: selectedDate`, `openingBalance: previousBalance`, and one entry in the right array.
- **Delete entry**: In-memory filter of `creditEntries`/`debitEntries`, then `PUT /daily-cash-memos/${memo._id}` with updated arrays.
- **Notes**: `PUT /daily-cash-memos/${memo._id}` (notes + existing entries) or `POST /daily-cash-memos` if no memo.
- **Post**: `POST /daily-cash-memos/${memo._id}/post`.

### 3.3 Calculations (client-side)

- **Total credit** = `previousBalance + sum(creditEntries.amount)`.
- **Total debit** = `sum(debitEntries.amount)`.
- **Closing balance** = total credit − total debit.

### 3.4 Entry form (add/edit)

- **Credit**: Name*, Amount*, Account*, Customer (optional), Payment method, optional image.
- **Debit**: Name*, Amount*, Category*, Mazdoor (if category mazdoor), Supplier (if supplier_payment/raw_material), Payment method, optional image.
- **Edit behaviour**: “Edit” only prefills the form; **submit still calls the add (POST credit/debit) endpoint**. So **edit creates a duplicate entry** and does not remove the old one. True “update entry” is not implemented.

### 3.5 Other UI

- **Bulk add**: Multiple rows; each row is sent as a separate `POST .../credit` or `.../debit` (or one `POST /` when there is no memo).
- **Export**: PDF and Excel using `memo`, `selectedDate`, `previousBalance`.
- **Image**: Stored as base64 on the entry; view in modal.
- **Console**: Several `console.log`s (suppliers, customers, mazdoors, memo response) that can be removed for production.

---

## 4. Issues and recommendations

### 4.1 Add entry uses correct memo (fixed)

- **Was**: Backend ignored `req.params.id` and always used today’s date for the memo.
- **Fixed**: Backend now finds the memo by `req.params.id`, returns 404 if not found, and rejects adding entries if the memo is already posted.

### 4.2 Edit entry is not implemented

- **Issue**: Edit opens the form with the entry data but submit calls the same add endpoint → duplicate entry; original is unchanged.
- **Fix**: Either:
  - Implement update (e.g. `PATCH /daily-cash-memos/:memoId/credit/:entryId` and same for debit), then have the form submit call update when `editingEntry` is set, or
  - Remove edit and only allow delete + add new.

### 4.3 Response shape for accounts

- Backend: `sendSuccess(res, { accounts }, ...)` → `data.accounts`.
- Frontend: `accountsRes.data.data.accounts` → correct. If backend ever changes to `sendSuccess(res, accounts, ...)`, frontend would need to use `response.data.data` (array) or adjust.

### 4.4 createDailyCashMemo vs model

- Controller uses `previousBalance` from body; model has both `previousBalance` and `openingBalance`. Create does not set `openingBalance`; pre-save uses `totalCredit` (virtual), which uses `this.openingBalance` in the virtual. Check that virtual and create/update semantics match (e.g. whether “previous” and “opening” are the same for the day).

### 4.5 Cleanup

- Remove `console.log`s in DailyCashMemo.jsx.
- Consider removing duplicate `validateEntry` if validation is fully handled in `onEntrySubmit`.
- Use a single “View” icon for view image and a distinct “Edit” icon for edit to avoid confusion (both currently use FileText).

---

## 5. Data flow summary

1. User picks **date** → frontend loads memo for that date and previous day’s closing balance.
2. **Add credit**: Frontend sends `POST /daily-cash-memos/:id/credit` with account, amount, etc. Backend should add to memo `id`; currently it adds to today’s memo (bug).
3. **Add debit**: Same idea; backend also creates Payment and optionally Expense.
4. **Delete entry**: Frontend updates arrays and `PUT`s the whole memo.
5. **Post**: One-time finalize; memo becomes read-only (status `posted`).

Fixing the add-credit/add-debit resolution to use `req.params.id` will align behaviour with the selected date and the memo the user sees on the Daily Cash Memo page.
