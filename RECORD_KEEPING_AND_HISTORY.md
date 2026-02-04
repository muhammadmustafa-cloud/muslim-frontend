# How the App Maintains Records and History

This document explains **what happens when you add an amount (e.g. 8000)** and **what kind of history records** the system keeps. It covers where data is stored, how balances are updated, and what you can see as “history” in the UI.

---

## 1. High-Level: Two Kinds of “Records”

| Type | What it is | Example |
|------|------------|--------|
| **Ledger / history** | Each “event” (payment, expense, sale, etc.) is stored as **one document** in a collection. The list of these documents **is** the history. | Add 8000 as a payment → one new **Payment** document; list of all Payment documents = payment history. |
| **Running balance / current state** | Some entities keep a **single current value** that is updated when events happen. The “history” of how it changed is **not** stored on that entity; it’s implied by the ledger. | **Account** has `currentBalance`; when you add a payment, the Payment is saved and the account’s `currentBalance` is updated. There is **no** separate “account transaction history” table—you get history by querying Payments that reference that account. |

So: **records are maintained as collections of documents (payments, expenses, transactions, stock movements, etc.).** There is **no** separate “audit log” or “history table” that duplicates every change; the main collections themselves are the history, and Mongoose `timestamps: true` adds `createdAt` / `updatedAt` on each document.

---

## 2. When You Add “8000” (or Any Amount)—Where It Goes

Depending on **where** you enter the amount in the app, the following happens.

### 2.1 Payments (Payments page: “Add Payment” / “Add Receipt”)

- **Where you enter it:** Payments page → Add Payment or Add Receipt → amount field (e.g. 8000).
- **What is stored:**
  - **One new document** in the **Payment** collection with:
    - `type`: `'payment'` or `'receipt'`
    - `amount`: 8000 (and date, description, paymentMethod, fromAccount/toAccount, category, paidTo/receivedFrom, mazdoor/customer/supplier refs if applicable)
    - `voucherNumber`: auto-generated (e.g. PAY-000001, REC-000002)
    - `status`: `'posted'`
    - `createdBy` / `updatedBy`, `createdAt` / `updatedAt`
  - **Account balance update (automatic):**
    - **Payment (money out):** `fromAccount.currentBalance` is **decreased** by 8000 (in Payment model’s `post('save')` hook).
    - **Receipt (money in):** `toAccount.currentBalance` is **increased** by 8000.
  - If a payment is **deleted**, the model’s `post('findOneAndDelete')` **reverses** the balance change (adds back for payment, subtracts for receipt).
- **History:** “History” of payments/receipts = **all documents in the Payment collection** (shown on Payments page with filters/search). There is **no** separate “payment history” table—**Payment is the history**.

### 2.2 Expenses (Expenses page: “Add Expense”)

- **Where you enter it:** Expenses page → Add Expense → amount (e.g. 8000), plus category, description, date, payment method, mazdoor/supplier if applicable.
- **What is stored:**
  - **One new document** in the **Expense** collection: amount (8000), category, description, date, paymentMethod, mazdoor/supplier refs, billNumber, notes, createdBy, timestamps.
  - **Account:** Expense does **not** automatically update any Account balance. (Only Payment/Receipt do that.) So 8000 is recorded as “expense happened” but no cash/bank balance is changed by the Expense model.
- **History:** “Expense history” = **all Expense documents** (Expenses page list). Again, **Expense collection = history**; no extra history table.

### 2.3 Transactions – Sales / Purchases (Transactions page: “New Sale” / “New Purchase”)

- **Where you enter it:** Transactions page → New Sale or New Purchase → items (qty × rate), discount, tax, **paid amount** (e.g. 8000), date, customer/supplier, payment method, account (to receive money / to pay from).
- **What is stored:**
  - **One new document** in the **Transaction** collection:
    - items (array of { item, quantity, rate, total })
    - subtotal, discount, tax, **total**, **paidAmount** (e.g. 8000), **remainingAmount** (total − paidAmount)
    - paymentStatus: `pending` / `partial` / `paid` (set from paid vs total)
    - customer (sale) or supplier (purchase), date, paymentMethod, notes, createdBy, timestamps
  - **Stock:** For each item in the transaction, **Item.currentStock** is updated (sale → decrease, purchase → increase), and **one Stock** document per item is created (operation in/out, quantity, previousStock, newStock, rate, totalAmount, reference = Transaction).
  - **Payment (optional):** If user selected an account and entered paid amount > 0, the frontend **also** calls **create Payment** (type receipt for sale, payment for purchase) with that amount and account. So 8000 paid on a sale creates:
    - 1 Transaction (sale with paidAmount 8000)
    - 1 Payment (receipt, amount 8000, toAccount) → which then updates **Account.currentBalance** via Payment’s post-save hook.
- **History:**
  - **Transaction history** = all **Transaction** documents (Transactions page).
  - **Stock history** for that item = all **Stock** documents for that item (Inventory/Stock list and item stock summary).
  - **Payment history** = all **Payment** documents (Payments page).

So “8000” on a sale can create both a **transaction record** (sale with paid amount) and a **payment record** (receipt), and the **account balance** is updated only via the Payment.

### 2.4 Daily Cash Memo (Daily Cash Memo page: “Add Entry” under Credit or Debit)

- **Where you enter it:** Daily Cash Memo → pick date → Credit (Cash In) or Debit (Cash Out) → Add Entry → name, description, **amount** (e.g. 8000), optional image.
- **What is stored:**
  - **One document per day:** **DailyCashMemo** with `date` (unique per day).
  - **Embedded entries (no separate collection):**
    - **creditEntries:** array of { name, description, amount, image, createdAt }
    - **debitEntries:** array of { name, description, amount, image, createdAt }
  - When you add “8000” as a credit entry, that 8000 is **appended** to that day’s `creditEntries` (or updated in place if editing). Same for debit.
  - **previousBalance** on the memo is fetched from API (previous day’s closing). **closingBalance** = previousBalance + totalCredit − totalDebit (calculated in pre-save).
  - **No** automatic update to **Account** or **Payment**—Daily Cash Memo is a **separate day-wise cash book** (in/out entries and closing balance). It does **not** drive Account.currentBalance.
- **History:**
  - **Per day:** One DailyCashMemo per date; “history” for that day = the **creditEntries** and **debitEntries** arrays.
  - **Across days:** List of memos by date (and export PDF/Excel from frontend using those entries).

So 8000 here is stored **only** inside the Daily Cash Memo for that date, as one entry in either creditEntries or debitEntries.

### 2.5 Labour / Labour Expenses (Labour page, Labour Expenses page)

- **Labour Expense:** When you add a “labour expense” (name + rate), that’s **one document** in **LabourExpense** (name, rate, isActive, createdBy, timestamps). No “8000” as a transaction—it’s the **rate** definition.
- **Labour Rate (Labour page):** When you add a “labour record” (which labour expense + bags + rate), that’s **one document** in **LabourRate** (labourExpense ref, bags, rate, isActive, createdBy, timestamps). The “record” is “so many bags at this rate”; the effective amount is bags × rate (calculated on read/display).
- **History:** Labour expense “history” = all LabourExpense documents. Labour “records” history = all LabourRate documents (Labour page table). No separate audit log.

### 2.6 Accounts (Accounts page)

- **Account** stores: code, name, type, openingBalance, **currentBalance**, isCashAccount, isBankAccount, bankDetails, etc.
- **currentBalance** is updated **only** when:
  - A **Payment** (type payment) is **saved** → balance of **fromAccount** is decreased by payment.amount.
  - A **Payment** (type receipt) is **saved** → balance of **toAccount** is increased by payment.amount.
  - A payment is **deleted** → the same change is reversed.
- So “8000” is **not** typed into Accounts directly; it enters via **Payments** (or via Transactions + auto-created Payment). The app does **not** keep a separate “account ledger” or “account history” collection—**account history = all Payment documents** that reference that account (fromAccount or toAccount), plus you can derive running balance from those if needed.

---

## 3. Summary: What “History” Exists and Where

| Entity | What is stored | Where “history” lives | Balances / state updated by |
|--------|----------------|------------------------|-----------------------------|
| **Payment** | One doc per payment/receipt (amount, date, account, category, etc.) | **Payment** collection (list = history) | Account.currentBalance (on save/delete) |
| **Transaction** | One doc per sale/purchase (items, totals, paidAmount, remainingAmount) | **Transaction** collection | Item.currentStock; optional Payment created by frontend → Account |
| **Expense** | One doc per expense (amount, category, date, etc.) | **Expense** collection | — (no account balance change) |
| **Stock** | One doc per stock in/out/adjustment (item, quantity, previousStock, newStock, rate) | **Stock** collection | Item.currentStock |
| **Item** | One doc per product (includes **currentStock**) | **Item** collection (current state); **Stock** = movement history | Updated when Stock or Transaction is created |
| **Account** | One doc per account (openingBalance, **currentBalance**) | **Account** = current state; **Payment** = history for that account | Payment post-save / post-delete |
| **DailyCashMemo** | One doc per date; **creditEntries** and **debitEntries** arrays (each entry: name, description, amount, image) | **DailyCashMemo** collection; “history” for a day = those arrays | — (separate cash book) |
| **LabourExpense** | One doc per labour type (name, rate) | **LabourExpense** collection | — |
| **LabourRate** | One doc per “bags + rate” record | **LabourRate** collection | — |
| **Customer / Supplier / Mazdoor / User** | One doc per entity; no amount “history” on the entity | Their own collections; “history” of dealings = Transaction/Payment/Expense that reference them | — |

So:

- **Records are maintained** by **creating new documents** in the right collection (Payment, Expense, Transaction, Stock, DailyCashMemo, LabourRate, etc.).
- **History** for that type of event = **the list of those documents** (with timestamps and filters on the UI).
- **Running totals** (account balance, item stock) are **updated in place** when the related event is saved (Payment updates Account; Stock/Transaction updates Item.currentStock).
- There is **no** separate “audit log” or “history table” that stores every change again; the main collections plus `createdAt`/`updatedAt` (and `createdBy`/`updatedBy` where present) are the only history.

---

## 4. Example: Adding 8000 as a “Payment” (Money Out)

1. User goes to **Payments** → Add Payment → selects “From Account” (e.g. Bank), amount **8000**, description, category, etc. → Submit.
2. **Backend** (payment controller):
   - Creates **one Payment** document: type `'payment'`, amount 8000, fromAccount = that account, status `'posted'`, etc.
   - **Payment model post-save:** Finds that account and runs `Account.findByIdAndUpdate(fromAccount, { $inc: { currentBalance: -8000 } })`.
3. **Result:**
   - **Payment collection:** New row (voucher number, 8000, date, account, …). That row **is** the “record” and **is** the history entry.
   - **Account:** That account’s **currentBalance** is 8000 less. No separate “account history” row—if you want “history” for the account, you query **Payment** where fromAccount or toAccount = that account.

So “maintaining records” here = **one new Payment document**; “maintaining history” = **that document plus all previous Payment documents** in the same collection.

---

## 5. What the App Does *Not* Do (As of This Codebase)

- **No dedicated “audit log”** that records “user X changed field Y from A to B” for every field.
- **No “account ledger” collection** that stores each credit/debit line for an account; the ledger is implied by **Payment** (and optionally Transaction-triggered Payment) only.
- **No versioning** of documents (no “v1, v2” of the same payment); you only have the current document and timestamps.
- **Expense** does not update any Account or Payment; it’s a standalone record of “we spent 8000” (category, description, date) without moving money in the Accounts/Payment system.
- **Daily Cash Memo** is a separate day-wise cash book; it does not sync to Accounts or Payment.

If you want “how we maintain records” in one sentence: **the app maintains records by inserting new documents into the right collection (Payment, Transaction, Expense, Stock, DailyCashMemo, LabourRate, etc.); those collections are the history; and running balances (account, item stock) are updated in place when the related event is saved.**
