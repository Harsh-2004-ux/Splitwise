# DECISIONS.md - Decision Log

## 1. Add CSV Import Without Rewriting the App

Options: rewrite the backend around a relational DB now, or add the missing import/report workflow to the existing app first.

Decision: add CSV import to the current Mongo/Mongoose app and document the relational DB gap.

Why: the existing product already had auth, groups, expenses, settlements, and balances. The assignment's largest missing behavior was deliberate CSV handling, so I prioritized a traceable importer. A final submission should still migrate persistence to PostgreSQL/SQLite.

## 2. Store Import Reports

Options: return a one-time response only, write a Markdown file, or persist import runs.

Decision: persist `ImportRun` records and show the latest report in the group page.

Why: reviewers can reopen the exact anomaly/action list after import and trace each row.

## 3. Currency Conversion

Options: treat USD as INR, block USD rows, or convert at a fixed documented rate.

Decision: convert USD to INR at `83`, preserve original amount/currency/rate.

Why: balances need one currency, but Priya's concern requires no silent one-to-one conversion.

## 4. Membership Dates

Options: include everyone in every group expense, rely only on CSV participants, or enforce dated membership windows.

Decision: keep dated memberships and remove participants outside their active window during import.

Why: Sam should not pay March expenses, and Meera should not pay April expenses after moving out.

## 5. Duplicate Handling

Options: delete duplicates silently, reject all duplicates, or skip with report.

Decision: skip duplicate rows and surface them in the import report.

Why: Meera asked to approve changes; the app does not hide or destroy the original CSV facts.

## 6. Settlements vs Expenses

Options: import repayment rows as normal expenses or convert them to settlements.

Decision: convert repayment/deposit rows into settlements.

Why: repayments change balances differently from shared expenses.

## 7. Bad Percentages

Options: reject percentage rows, use raw percentages even if they overcharge, or normalize.

Decision: normalize totals proportionally and report.

Why: the row intent is clear, and the anomaly remains visible for review.

## 8. Negative Amounts

Options: reject negative rows or treat them as refunds.

Decision: import negative amounts as refunds.

Why: the CSV note says one parasailing slot was cancelled, so the negative amount is meaningful balance data.
