# AI Prompts & Specifications Log

This document lists the core specifications and user requirements that guided the generation of the Splitwise Clone application.

---

## 1. Initial Specification Prompt

The initial implementation plan requested a full-stack Splitwise Clone with:
* Token-based authentication (JWT + bcrypt).
* Group management (create group, invite/remove members).
* Expense core (split equal, unequal, %, share; balance calculations).
* Real-time expense chat (Socket.io).
* Debt settlement (settlement records, balance summaries, debt simplification).
* Premium frontend (React + Vite + TailwindCSS, Zustand + React Query).

### Architecture Rules
* Keep code modular.
* Ensure floating-point precision in financial transactions (DECIMAL(12,2) or cent-based integer conversion, adjusting remainders on the last split item).
* Protect secure private pathways.
* Provide Socket.io rooms for isolated, real-time messaging feeds.

---

## 2. MongoDB Switch Recommendation

**User Request**:
> "instead of postgreecan we use mongodb??"

**Response Approach**:
* Recommend switching database ORM from Prisma to **Mongoose** for simpler setup.
* Map relational tables to MongoDB collections:
  * Users: distinct collection.
  * Groups: collection holding members as embedded document arrays.
  * Expenses: collection holding splits as embedded document arrays (insulates splits database lookups).
  * Settlements: distinct collection.
  * Comments: distinct collection referencing specific expenses.
* Re-factor implementation plan to match document schema paradigms.

---

## 3. Git Commits Instructions

**User Request**:
> "put atleast 10 commit after completing any meaning task"

**Response Approach**:
* Make periodic commits upon finishing logical build segments.
* Segment commits:
  1. Add docker-compose helper
  2. Implement backend structure & auth
  3. Untrack node_modules and add gitignore
  4. Implement split calculations and core APIs
  5. Scaffolder React Vite frontend
  6. Configure Tailwind CSS variables
  7. Add Zustand state store
  8. Build layout sidebar
  9. Build dashboard, login and group details pages
  10. Build modals (add expense, settle, chat)
  11. Final documentation
