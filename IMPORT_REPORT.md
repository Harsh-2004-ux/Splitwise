# Import Report

This is the human-readable version of the report produced by the app after uploading `expenses_export.csv` from a group page. The API also stores the same row-level report in the `ImportRun` collection and exposes it in the Import report tab.

## Summary

| Metric | Value |
| --- | ---: |
| CSV data rows | 42 |
| Accepted or adjusted expenses | 37 |
| Recorded settlements | 2 |
| Skipped duplicate/zero rows | 3 |
| Rejected rows | 1 |

## Policies Applied

- USD rows are converted to INR at `1 USD = INR 83`; original amount/currency are preserved.
- Repayments and deposit transfers are settlements, not expenses.
- `Priya S`, lowercase `priya`, and spaced `rohan ` are normalized to known members.
- Meera is active through `2026-03-31`; Sam starts on `2026-04-10`; Dev and Kabir are guests for trip rows.
- Inactive members listed in a split are removed and the split is recalculated.
- Negative amounts are refunds and reverse the original debt.
- Percent totals that are not 100 are normalized proportionally and reported.
- Missing payer is rejected because the payer credit cannot be traced.
- Duplicate rows are skipped in import and listed for review.

## Row-Level Anomalies

| Row | Problem | Action |
| ---: | --- | --- |
| 6 | Duplicate Marina Bites dinner | Skipped; row 5 kept. |
| 7 | Amount contains comma formatting | Parsed as `1200`. |
| 9 | Payer casing `priya` | Normalized to Priya. |
| 10 | Amount has 3 decimals | Rounded `899.995` to `900.00`. |
| 11 | Alias `Priya S` | Normalized to Priya. |
| 13 | Missing payer | Rejected. |
| 14 | Repayment logged as expense | Recorded as Rohan paying Aisha. |
| 15 | Percent split totals 110 | Normalized to 100. |
| 20 | USD villa booking | Converted `540 USD` to INR. |
| 21 | USD lunch | Converted `84 USD` to INR. |
| 23 | Extra guest Kabir | Created/imported Kabir as guest participant. |
| 24/25 | Near duplicate Thalassa dinner | Skipped row 24; kept row 25 because notes say Aisha's entry is wrong. |
| 26 | Negative USD amount | Imported as refund using INR conversion. |
| 27 | Non-standard date `Mar-14` and spaced payer | Parsed as `2026-03-14`; normalized Rohan. |
| 28 | Missing currency | Defaulted to INR. |
| 31 | Zero amount | Skipped. |
| 32 | Percent split totals 110 | Normalized to 100. |
| 34 | Ambiguous `04-05-2026` | Parsed as DD-MM-YYYY, so `2026-05-04`. |
| 36 | Meera listed after moving out | Removed Meera from split and recalculated. |
| 38 | Sam deposit logged as expense | Recorded as Sam paying Aisha. |
| 42 | Equal split with share details | Used declared `equal` split and reported conflicting details. |
