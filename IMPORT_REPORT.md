# IMPORT_REPORT.md - Import Report

This file documents import behavior and anomaly handling for the Splitwise Clone project.

## Import Summary

CSV import is not implemented in this project. The application does not currently ingest data from a CSV file.

Data is created through:

1. User registration and login forms
2. Group creation forms
3. Member invitation by email
4. Expense creation and update forms
5. Settlement forms
6. Expense comment/chat forms

Because there is no CSV ingestion pipeline, there is no generated runtime CSV import report. Instead, the application performs validation during API requests and returns errors immediately when invalid data is submitted.

## Equivalent Validation Report

The table below lists the anomalies the application can detect during normal data entry and the action taken.

| Input Area | Anomaly Detected | Action Taken |
| --- | --- | --- |
| Registration | Missing name, email, or password | Reject request and return validation error. |
| Registration | Duplicate email | Reject duplicate user because email is unique. |
| Registration/Login | Email case or extra spaces | Normalize email using lowercase and trim. |
| Authentication | Missing/invalid JWT token | Reject protected API request. |
| Group creation | Missing group name | Reject request through schema validation. |
| Group members | Invited email does not exist | Do not add member; return an error. |
| Expense creation | Missing expense title | Reject request through schema validation. |
| Expense creation | Amount is zero or negative | Reject request because amount must be at least `0.01`. |
| Expense creation | No participants selected | Reject request because at least one participant is required. |
| Expense creation | Invalid split type | Reject request unless split type is supported. |
| Equal split | Total cannot divide equally by participants | Distribute penny remainder safely after cent conversion. |
| Unequal split | Split amounts do not equal total expense | Reject request and ask user to correct split amounts. |
| Percentage split | Percentages do not add to 100% | Reject request and ask user to correct percentages. |
| Percentage split | Rounding creates small cent difference | Assign remaining cents to the last participant. |
| Share split | Total share units are zero or invalid | Reject request because shares must be greater than zero. |
| Share split | Rounding creates small cent difference | Assign remaining cents to the last participant. |
| Debt calculation | Floating-point precision drift | Round final net balances to two decimal places. |
| Comments | Empty chat message | Reject request through required message validation. |

## Sample Import-Style Result

If the project had to report one API data-entry session in import-report format, the result would look like this:

| Record | Status | Message |
| --- | --- | --- |
| User registration | Accepted | User created after normalizing email. |
| Group creation | Accepted | Group saved with creator as admin member. |
| Expense with equal split | Accepted | Split calculated in cents and saved. |
| Expense with unequal split mismatch | Rejected | Split total did not match expense total. |
| Expense with percentage total 95% | Rejected | Percentage split must total 100%. |
| Settlement with amount 0 | Rejected | Settlement amount must be at least `0.01`. |

## Final Note

The Drive assignment mentions an import report produced after CSV ingestion. For this specific project, the correct interpretation is:

`CSV import is not applicable. The application validates user-entered data through backend APIs and Mongoose schemas instead of importing CSV rows.`
