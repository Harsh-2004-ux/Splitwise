# SCOPE.md - Anomaly Log and Database Schema

This file documents the scope, validation/anomaly handling, and database schema for the Splitwise Clone project.

## Project Scope

The project is a full-stack Splitwise-style expense sharing application. It allows users to register, log in, create groups, add members, record expenses, split expenses in multiple ways, simplify debts, record settlements, and discuss expenses through real-time chat.

The application does not currently ingest CSV files. Instead, data is entered through the frontend forms and validated by backend APIs before being saved to MongoDB.

## Data Anomalies Handled

Because this project uses API/form input instead of CSV import, anomalies are handled during user input and API request validation.

| Data Problem / Anomaly | Where It Can Happen | Action Taken |
| --- | --- | --- |
| Missing user name, email, or password | User registration | Request is rejected by validation. |
| Duplicate email address | User registration | MongoDB unique email constraint prevents duplicate users. |
| Email with inconsistent casing/spaces | User registration/login | Email is lowercased and trimmed before storage. |
| Invalid or missing JWT token | Protected routes | Request is rejected and user must log in again. |
| Empty group name | Group creation | Request is rejected by schema validation. |
| Adding a non-existing user to a group | Group member invite | Backend checks email/user existence before adding. |
| Invalid expense title | Expense creation/update | Required title validation prevents blank expense records. |
| Expense amount is zero or negative | Expense creation/update | Rejected because amount must be greater than 0. |
| No split participants | Expense creation/update | Rejected because at least one user must be included. |
| Invalid split type | Expense creation/update | Rejected unless split type is one of `EQUAL`, `UNEQUAL`, `PERCENTAGE`, or `SHARE`. |
| Equal split causes rounding remainder | Equal split engine | Amount is converted to cents and remaining cents are distributed safely. |
| Unequal split total does not match expense amount | Unequal split engine | Request is rejected with an error. |
| Percentage split does not total 100% | Percentage split engine | Request is rejected unless total percentage is within allowed tolerance. |
| Percentage/share split causes penny remainder | Percentage/share split engine | Remaining cents are assigned to the final participant to preserve the total. |
| Share split has zero or invalid total shares | Share split engine | Request is rejected because total shares must be greater than zero. |
| Floating-point money precision issues | Split and debt calculations | Money is rounded to cents during calculations. |
| Unauthorized group/expense access | Private APIs | Protected routes require authentication and group/member checks. |
| Empty chat message | Expense comments | Required message validation prevents empty comments. |

## Database Schema

Database: MongoDB  
ODM: Mongoose

### Users Collection

Model file: `backend/src/models/User.js`

| Field | Type | Rule |
| --- | --- | --- |
| `name` | String | Required, trimmed |
| `email` | String | Required, unique, lowercase, trimmed |
| `passwordHash` | String | Required |
| `createdAt` | Date | Defaults to current date |

### Groups Collection

Model file: `backend/src/models/Group.js`

| Field | Type | Rule |
| --- | --- | --- |
| `name` | String | Required, trimmed |
| `description` | String | Trimmed |
| `createdBy` | ObjectId -> User | Required |
| `members` | Array | Embedded group member records |
| `createdAt` | Date | Defaults to current date |

Group member subdocument:

| Field | Type | Rule |
| --- | --- | --- |
| `user` | ObjectId -> User | Required |
| `role` | String | `admin` or `member`, default `member` |
| `joinedAt` | Date | Defaults to current date |

### Expenses Collection

Model file: `backend/src/models/Expense.js`

| Field | Type | Rule |
| --- | --- | --- |
| `groupId` | ObjectId -> Group | Required |
| `paidBy` | ObjectId -> User | Required |
| `title` | String | Required, trimmed |
| `amount` | Number | Required, minimum `0.01` |
| `splitType` | String | `EQUAL`, `UNEQUAL`, `PERCENTAGE`, or `SHARE` |
| `splits` | Array | Embedded expense split records |
| `createdAt` | Date | Defaults to current date |

Expense split subdocument:

| Field | Type | Rule |
| --- | --- | --- |
| `user` | ObjectId -> User | Required |
| `owedAmount` | Number | Required, minimum `0` |
| `shareUnits` | Number | Optional; used for share split |

### Settlements Collection

Model file: `backend/src/models/Settlement.js`

| Field | Type | Rule |
| --- | --- | --- |
| `groupId` | ObjectId -> Group | Required |
| `payerId` | ObjectId -> User | Required |
| `payeeId` | ObjectId -> User | Required |
| `amount` | Number | Required, minimum `0.01` |
| `note` | String | Trimmed |
| `settledAt` | Date | Defaults to current date |

### Comments Collection

Model file: `backend/src/models/Comment.js`

| Field | Type | Rule |
| --- | --- | --- |
| `expenseId` | ObjectId -> Expense | Required |
| `userId` | ObjectId -> User | Required |
| `message` | String | Required, trimmed |
| `createdAt` | Date | Defaults to current date |

## Notes

The assignment mentioned CSV anomalies, but this implementation does not include a CSV import pipeline. The project handles equivalent data quality issues through backend validation, schema constraints, and split-calculation checks.
