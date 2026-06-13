# SCOPE.md - Anomaly Log and Database Schema

## Product Scope

The app supports login, groups, members with join/leave dates, expenses, settlements, balances, debt simplification, and CSV import. The import workflow lives on the group page: upload `expenses_export.csv`, then review the generated Import report tab.

Known gap: the original app uses MongoDB/Mongoose. The assignment asks for a relational DB only, so this still needs a future migration to PostgreSQL/SQLite before final submission.

## Import Anomaly Handling

| Anomaly | Policy |
| --- | --- |
| Exact duplicate expense | Skip duplicate and list it in the report. |
| Near duplicate with conflicting amount/payer | Keep the row supported by notes; skip the suspected wrong row. |
| Settlement entered as expense | Store in settlements instead of expenses. |
| Missing payer | Reject row because balances cannot be traced. |
| Missing currency | Default to INR and report. |
| USD amount | Convert to INR with fixed documented rate `83`. |
| Negative amount | Treat as refund and import as negative expense. |
| Zero amount | Skip because it has no balance effect. |
| More than two decimals | Round to two decimals and report. |
| Name aliases/casing/spaces | Normalize to canonical user names. |
| Guest participant | Create/import guest user and mark membership type as guest. |
| Member outside active dates | Remove inactive participant from split and recalculate. |
| Percentage total not 100 | Normalize percentages proportionally. |
| Equal split with share details | Use declared split type and report conflicting details. |
| Ambiguous/non-standard date | Parse with documented policy and report. |

## MongoDB Schema

### User

| Field | Type |
| --- | --- |
| `name` | String |
| `email` | String, unique |
| `passwordHash` | String |
| `createdAt` | Date |

### Group

| Field | Type |
| --- | --- |
| `name` | String |
| `description` | String |
| `createdBy` | ObjectId -> User |
| `members[]` | Embedded member records |

Member fields: `user`, `role`, `joinedAt`, `leftAt`, `membershipType`.

### Expense

| Field | Type |
| --- | --- |
| `groupId` | ObjectId -> Group |
| `paidBy` | ObjectId -> User |
| `title` | String |
| `amount` | Number in INR |
| `originalAmount` | Number |
| `originalCurrency` | String |
| `exchangeRate` | Number |
| `splitType` | `EQUAL`, `UNEQUAL`, `PERCENTAGE`, `SHARE` |
| `splits[]` | Embedded split records |
| `importSource` | `{ rowNumber, rawDescription }` |
| `createdAt` | Expense date |

Split fields: `user`, `owedAmount`, `shareUnits`.

### Settlement

| Field | Type |
| --- | --- |
| `groupId` | ObjectId -> Group |
| `payerId` | ObjectId -> User |
| `payeeId` | ObjectId -> User |
| `amount` | Number in INR |
| `note` | String |
| `settledAt` | Date |
| `importSource` | `{ rowNumber, rawDescription }` |

### ImportRun

| Field | Type |
| --- | --- |
| `groupId` | ObjectId -> Group |
| `importedBy` | ObjectId -> User |
| `fileName` | String |
| `summary` | Counts for rows/anomalies/actions |
| `policies[]` | Strings shown to reviewer |
| `rows[]` | Row status, action, and anomalies |
| `createdAt` | Date |
