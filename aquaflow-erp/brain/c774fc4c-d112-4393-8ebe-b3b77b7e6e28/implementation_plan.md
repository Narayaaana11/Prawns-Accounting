# Edit and Delete Intakes

Implement the ability to safely modify and delete Prawns Intake records. Since an intake modifies inventory and supplier balances upon creation, these actions must reverse those operations to ensure financial and stock integrity.

> [!WARNING]
> Because Prawns Intakes automatically adjust the stock in real-time and update the Farmer's ledger balance (if on Credit), editing or deleting an intake requires reversing these transactions to prevent data corruption.

## Open Questions
> [!IMPORTANT]
> 1. When **deleting** an intake, should the system completely remove the record from the database (hard delete), or just mark it as "Cancelled" so it remains in the history? (My proposal: Mark it as Cancelled to preserve a paper trail).
> 2. If reversing an intake's stock causes the current inventory to drop below zero (e.g. if you already sold the prawns), should the system allow negative stock, or block the deletion? (My proposal: Allow negative stock but show a warning toast on the frontend, as physical counts can be reconciled later).

## Proposed Changes

---

### Backend: Controllers and Routes
We will add new endpoints specifically for Intake reversal and modification, rather than using standard Purchase Order routes, to ensure we correctly handle the "Cash/Credit" logic tied to Supplier balances.

#### [MODIFY] server/src/controllers/intakeController.js
- Add `deleteIntake`: 
  - Fetch the `PurchaseOrder`.
  - Fetch the `Supplier`. Reverse the `totalAmount` from their `outstandingBalance` if the notes indicate `Payment: Credit`.
  - Fetch the `Product`. Subtract the `quantity` from `stock`.
  - Log a new `StockAdjustment` with type `remove` and reason `Intake Reversal / Deletion`.
  - Change `PurchaseOrder` status to `Cancelled`.
- Add `updateIntake`:
  - Execute the deletion/reversal logic on the old data.
  - Execute the creation logic with the new data.
  - Update the existing `PurchaseOrder` document instead of creating a new one.

#### [MODIFY] server/src/routes/intake.js
- Register `PUT /:id` mapped to `updateIntake`.
- Register `DELETE /:id` mapped to `deleteIntake`.

---

### Frontend: State and Hooks

#### [MODIFY] aquaflow-erp/src/hooks/useIntake.ts
- Create `useUpdateIntake` hook calling `PUT /api/intake/:id`.
- Create `useDeleteIntake` hook calling `DELETE /api/intake/:id`.

---

### Frontend: UI Components

#### [MODIFY] aquaflow-erp/src/pages/PrawnsIntake.tsx
- Add "Actions" column to the Recent Intakes table with Edit and Delete icons.
- Add an `AlertDialog` for confirming deletions.
- When "Edit" is clicked, open the Add Intake modal but pre-fill it with the record's existing data and switch the submission handler to use the `useUpdateIntake` mutation.

## Verification Plan
### Automated Tests
- None required; rely on manual end-to-end testing.

### Manual Verification
1. Create a new Credit intake for 100kg of 40c prawns from "Test Farmer".
2. Check stock is +100kg and Farmer balance is increased.
3. Edit the intake to 50kg. Verify stock reduces to 50kg and Farmer balance decreases accordingly.
4. Delete the intake. Verify stock drops to 0 and Farmer balance drops to 0.
5. Verify the PO record shows as "Cancelled" in the database.
