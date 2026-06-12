# AI_USAGE.md - AI Usage Report

This file documents how AI tools were used during the Splitwise Clone project, including prompts, useful outputs, incorrect outputs, and corrections.

## AI Tools Used

| Tool | Usage |
| --- | --- |
| ChatGPT / Codex | Planning, architecture guidance, backend implementation, frontend scaffolding, documentation drafting, and debugging support. |

## Main Areas Where AI Helped

1. Creating the initial full-stack project plan.
2. Designing the MongoDB/Mongoose schema.
3. Structuring Express routes for authentication, groups, expenses, settlements, and comments.
4. Implementing split calculation logic for equal, unequal, percentage, and share splits.
5. Implementing greedy debt simplification.
6. Creating React frontend structure with pages, modals, Zustand state, and React Query.
7. Drafting documentation files such as setup guides, API notes, build plan, and architecture notes.

## Key Prompts Used

### Prompt 1: Initial Project Specification

```text
Build a full-stack Splitwise clone with JWT authentication, group management,
expense splitting, balance calculation, settlement tracking, and real-time
expense chat.
```

### Prompt 2: Database Change

```text
Instead of PostgreSQL, can we use MongoDB?
```

### Prompt 3: Split Logic Requirement

```text
Implement expense splitting for equal, unequal, percentage, and share-based
splits. Make sure financial rounding is handled correctly.
```

### Prompt 4: Real-Time Feature

```text
Add real-time expense comments and balance updates using Socket.io.
```

### Prompt 5: Documentation

```text
Create documentation for setup, API endpoints, build plan, architecture,
and AI usage for the project.
```

## Incorrect AI Outputs and Corrections

### Case 1: Wrong Initial Database Direction

AI initially planned the project around PostgreSQL and Prisma.

Why it was wrong:

The project requirement/preference changed to MongoDB. PostgreSQL also required a different schema and setup flow.

How it was caught:

The mismatch was noticed when reviewing the planned database setup against the requested MongoDB stack.

Correction made:

The backend was implemented with MongoDB and Mongoose. Models were created for `User`, `Group`, `Expense`, `Settlement`, and `Comment`.

### Case 2: Money Calculation Risk

AI initially suggested normal decimal arithmetic for splitting money.

Why it was wrong:

JavaScript decimal arithmetic can cause floating-point rounding errors, especially for money.

How it was caught:

Split examples showed that totals could become slightly inaccurate when divided among participants.

Correction made:

The split engine converts amounts to cents using `Math.round(amount * 100)`, calculates splits in cents, then converts back to decimal amounts. Remainders are assigned carefully so the final split total equals the original expense amount.

### Case 3: Real-Time Events Were Too Broad

AI initially described real-time updates without clearly isolating events by group or expense.

Why it was wrong:

Broadcasting too broadly could send updates to users who are not viewing the relevant group or expense.

How it was caught:

While designing Socket.io behavior, it became clear that expense events and comment events needed different scopes.

Correction made:

Socket.io rooms were used:

1. Group rooms for expense and balance updates.
2. Expense rooms for expense-specific chat comments.

### Case 4: CSV Import Assumption

AI initially treated the assignment questions as if this project had a CSV import pipeline.

Why it was wrong:

The repository is a Splitwise clone with API/form-based data entry. It does not include CSV ingestion.

How it was caught:

The project files were reviewed and no CSV parser, import route, import script, or generated CSV report existed.

Correction made:

The documentation now clearly states that CSV import is not applicable and explains the equivalent validation handled through the backend APIs and Mongoose schemas.

## Human Review and Final Changes

AI-generated suggestions were reviewed against the actual repository before being accepted. The final implementation uses:

1. MongoDB and Mongoose for persistence.
2. JWT and bcryptjs for authentication.
3. Cent-based split calculations for financial accuracy.
4. Greedy debt simplification for settlement suggestions.
5. Socket.io rooms for scoped real-time updates.
6. React Query and Zustand for frontend data/state management.

## Disclosure

AI was used as a development assistant, but final decisions, validation rules, schema choices, and corrections were reviewed and adapted to match the actual Splitwise Clone project.
