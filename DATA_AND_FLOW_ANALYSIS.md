# Data & Flow Analysis – Muslim Daal Mill Management

This document describes **what data exists**, **where it is saved**, **how one entry updates the whole app**, and **what was improved** for history and Entries Report.

---

## 1. Where data lives (database / models)

| Data / Concept | Stored in | Purpose |
|----------------|-----------|---------|
| **Daily cash in/out** | `DailyCashMemo` | One memo per day: `creditEntries` (money in), `debitEntries` (money out), opening/closing balance |
| **Each credit entry** | `DailyCashMemo.creditEntries[]` | Name, amount, account, customer (optional), receiptType, paymentMethod, link to `Payment` |
| **Each debit entry** | `DailyCashMemo.debitEntries[]` | Name, amount, category, mazdoor/supplier (optional), paymentMethod, link to `Payment` and optionally `Expense` |
| **Payments & receipts** | `Payment` | Every credit/debit from Daily Cash Memo creates a Payment (receipt) or Payment (payment) for audit and account movement |
| **Expenses** | `Expense` | Debit entries with category mazdoor, electricity, rent, transport, raw_material, maintenance, other, supplier_payment create an `Expense` record (sync to Expenses page + history) |
| **Account balances** | `Account.currentBalance` | Updated when a Payment (receipt/payment) is saved: receipt adds to `toAccount`, payment deducts from `fromAccount` |
| **Customer balance** | `Customer.currentBalance` | Credit entry with customer → balance **decreases** (they paid us, receivable goes down) |
| **Mazdoor balance** | `Mazdoor.currentBalance` | Debit entry category mazdoor + mazdoor selected → balance **decreases** (we paid salary) |
| **Supplier balance** | `Supplier.currentBalance` | Debit entry supplier_payment/raw_material + supplier selected → balance **decreases** (we paid them) |
| **Item sales / purchases** | `Transaction` | Sales and purchases (items, amounts) with customer/supplier; updates stock and customer/supplier balance |
| **Stock** | `Stock` (per item) | Updated by Transactions (purchase/sale) and inventory adjustments |

So: **one action in Daily Cash Memo can update** DailyCashMemo, Payment, Account, Customer/Mazdoor/Supplier, and Expense. Same data is reflected across the app and in history.

---

## 2. What happens when you do an entry (flow)

### Credit entry (money received)

1. **Daily Cash Memo** – Push to `memo.creditEntries`: name, amount, account, customer (optional), receiptType, paymentMethod.
2. **Payment** – Create `type: 'receipt'`, `toAccount`, amount, customer, `receivedFrom: name`, status `posted`.
3. **Account** – Payment post-save hook: `Account.currentBalance` for `toAccount` **increases** by amount.
4. **Customer** – If customer selected: `Customer.currentBalance` **decreases** by amount (receivable reduced).

So: credit entry → memo + receipt + account balance up + customer balance down (if customer). Data is consistent across memos, payments, accounts, and customers.

### Debit entry (money paid)

1. **Daily Cash Memo** – Push to `memo.debitEntries`: name, amount, category, mazdoor/supplier (optional), paymentMethod.
2. **Payment** – Create `type: 'payment'`, `fromAccount` (cash account), amount, mazdoor/supplier, category, `paidTo: name`, status `posted`.
3. **Account** – Payment post-save hook: `Account.currentBalance` for `fromAccount` **decreases** by amount.
4. **Mazdoor** – If category mazdoor and mazdoor selected: `Mazdoor.currentBalance` **decreases** by amount.
5. **Supplier** – If category supplier_payment or raw_material and supplier selected: `Supplier.currentBalance` **decreases** by amount.
6. **Expense** – For categories mazdoor, electricity, rent, transport, raw_material, maintenance, other, supplier_payment: create `Expense` with category, description, amount, date, paymentMethod, mazdoor/supplier. So Expenses page and history show these.

So: debit entry → memo + payment + account balance down + mazdoor/supplier balance down (when applicable) + Expense record. One entry updates the whole app and leaves a clear history.

---

## 2b. Two-way sync – same data and same numbers everywhere

**From Daily Cash Memo → Payments / Expenses**
- When you add **credit** or **debit** in Daily Cash Memo, a **Payment** (receipt or payment) is created and appears on the **Payments** page. Debit with an expense category also creates an **Expense** and appears on the **Expenses** page.

**From Payments page → Daily Cash Memo**
- When you add a **payment** or **receipt** on the **Payments** page, that same transaction is **automatically added** to the Daily Cash Memo for that date. So the memo list and daily totals include it, and the numbers match.

**From Expenses page → Daily Cash Memo and Payments**
- When you add an **expense** on the **Expenses** page, the system **creates a Payment** (so the cash account balance updates) and **adds a debit entry** to the Daily Cash Memo for that date. So the same amount appears in Expenses, Payments, and Daily Cash Memo.

**Money management – same numbers**
- **Account balance** is updated only by **Payment** (post-save hook). So whether you add from Daily Cash Memo or from the Payments/Expenses page, one Payment is created and the account moves once.
- **Customer / Mazdoor / Supplier** balances are updated when a receipt (customer) or payment (mazdoor/supplier) is recorded, from either Daily Cash Memo or Payments page.
- **Daily Cash Memo** closing balance = opening balance + sum(credit entries) − sum(debit entries). All entries from that day (from memo or synced from Payments/Expenses) are included, so the total is correct.

| You add from | Same data / same numbers appear here |
|--------------|--------------------------------------|
| **Daily Cash Memo** (credit/debit) | **Payments** (receipt/payment), **Expenses** (if debit category), **Daily Cash Memo** totals |
| **Payments** page (payment/receipt) | **Daily Cash Memo** (entry for that date), **Expenses** (if payment has expense category) |
| **Expenses** page (expense) | **Payment** (created automatically), **Daily Cash Memo** (debit entry for that date) |
| **Labour Expenses** page | Catalog of labour types only. Mazdoor salary **payments** are in **Expenses** + **Payments** + **Daily Cash Memo**. |
| **Transactions** page | Item sales/purchases (stock). Not created from Daily Cash Memo or Expenses. |

---

## 3. Kinds of data you have (what is sold, bought, expense, mazdoor, etc.)

| Type | Where recorded | Where it updates / appears |
|------|----------------|---------------------------|
| **Money in (credit)** | Daily Cash Memo → credit entry | Payment (receipt), Account ↑, Customer ↓ (if linked), Entries Report, Payments/Transactions views |
| **Money out (debit)** | Daily Cash Memo → debit entry | Payment (payment), Account ↓, Mazdoor/Supplier ↓ (if linked), **Expense** (for all expense categories), Entries Report, Expenses page |
| **Mazdoor salary** | Debit, category Mazdoor + select mazdoor | Mazdoor.currentBalance ↓, Expense (category mazdoor), Labour/Mazdoor history, Entries Report (filter by mazdoor) |
| **Other expense** (electricity, rent, transport, raw material, maintenance, other, supplier payment) | Debit, category + optional supplier | Expense record, Supplier balance (if supplier), Entries Report (filter by category / description) |
| **Item sold** | Transaction (sale) | Stock ↓, Customer balance ↑ (unpaid part), Transaction history |
| **Item bought** | Transaction (purchase) | Stock ↑, Supplier balance ↑ (unpaid part), Transaction history |

So: **what is sold/bought** (items) is in **Transactions**; **money in/out and expenses** (including mazdoor, gaari kiraya, etc.) are in **Daily Cash Memo + Payment + Expense**, and all of that is reflected in balances and history.

---

## 4. What was missing and what was improved

### 4.1 Entries Report – filter by specific person and by description

- **Before:** You could filter by category (e.g. Mazdoor) but not “which mazdoor”, and not by description (e.g. “gaari kiraya”).
- **Now:**
  - **Category = Mazdoor** → show **“Which Mazdoor”** dropdown (from API). Choose a mazdoor and Apply → only that mazdoor’s records (dates and amounts) in the report.
  - **Category = Customer Payment / Sale** → show **“Which Customer”** dropdown. Choose a customer → only that customer’s credit entries.
  - **Category = Supplier Payment / Raw Material** → show **“Which Supplier”** dropdown. Choose a supplier → only that supplier’s debit entries.
  - **“Description contains”** → type e.g. **“gaari kiraya”** (or any text). Only entries whose description contains that text are shown (e.g. all transport/other expenses where you wrote “gaari kiraya”), so you can see dates and how much was spent.

So: **select category first, then optionally which mazdoor/customer/supplier**, and optionally **description** – data is fetched from the database and the report shows only the relevant records; that data is the same as in the rest of the app.

### 4.2 No need to type name again when selecting from database

- **Before:** Even after selecting Mazdoor/Customer/Supplier from dropdown, you had to type the name again in the “Name” field.
- **Now:** When you select:
  - **Mazdoor** (debit, category Mazdoor) → **Name** is auto-filled with that mazdoor’s name (from API). You can still edit if needed.
  - **Customer** (credit, receipt type Customer Payment or Sale) → **Name** is auto-filled with that customer’s name.
  - **Supplier** (debit, Supplier Payment or Raw Material) → **Name** is auto-filled with that supplier’s name.

So: **if you selected someone from the database, their name is filled in** and stays in sync with the entity; the same data is used across the app.

### 4.3 Backend support for report filters

- **Entries Report API** now accepts:
  - `mazdoorId` – only debit entries for that mazdoor.
  - `customerId` – only credit entries for that customer.
  - `supplierId` – only debit entries for that supplier.
  - `description` – only entries whose description contains this text (e.g. “gaari kiraya”).
- Report still returns the same structure (date, type, category, name, description, account/customer, mazdoor/supplier, payment, amount); filtering is applied before building the list and totals.

---

## 5. Summary table – one entry, whole app updated

| You do this | Stored / updated |
|-------------|------------------|
| Add **credit** (e.g. Customer Payment, Sale) | DailyCashMemo.creditEntries, Payment (receipt), Account ↑, Customer ↓ (if selected), Entries Report, history |
| Add **debit** Mazdoor salary | DailyCashMemo.debitEntries, Payment (payment), Account ↓, Mazdoor ↓, Expense (mazdoor), Entries Report, Mazdoor/Labour history |
| Add **debit** other expense (e.g. transport, “gaari kiraya”) | DailyCashMemo.debitEntries, Payment (payment), Account ↓, Expense (category + description), Entries Report (filter by category + “description contains”) |
| Add **debit** supplier payment | DailyCashMemo.debitEntries, Payment (payment), Account ↓, Supplier ↓, Expense (supplier_payment), Entries Report (filter by supplier) |
| Sell/buy **items** | Transaction, Stock, Customer/Supplier balance (Transactions + Inventory) |

---

## 6. How to use Entries Report the way you want

1. **Mazdoor-specific:** Category = **Debit: Mazdoor** → **Which Mazdoor** = choose person → Apply. You see only that mazdoor’s records (dates and amounts).
2. **Expense by description (e.g. gaari kiraya):** Choose date range → **Description contains** = “gaari kiraya” → Apply. You see all entries (any category) where description has that text – dates and how much spent.
3. **Transport (or any category):** Category = **Debit: Transport** (or Other, etc.) → optionally **Description contains** to narrow (e.g. “gaari”) → Apply.
4. **Customer receipts:** Category = **Credit: Customer Payment** (or Sale) → **Which Customer** = choose customer → Apply. You see only that customer’s credit entries.

All of this uses the same data that is updated from Daily Cash Memo across the database and the rest of the app.
