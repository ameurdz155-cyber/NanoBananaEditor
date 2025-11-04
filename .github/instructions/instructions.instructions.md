---
applyTo: '**'
description: Project-wide Copilot instructions: context, coding standards, PR/testing rules,
---

# 🧠 Project Context
This project is a **modern web application** built using technologies such as **Next.js / React / Node.js / TypeScript / PostgreSQL**.  
The goal is to maintain high code quality, scalability, and readability, following clean architecture principles.

Copilot should prioritize:
- Maintainable and modular code
- Clear logic and consistent naming
- Secure coding practices
- Reasonable performance for mid-scale usage
- Writing unit/integration tests when appropriate

---

# 🧩 Coding Guidelines
- Follow strict TypeScript rules (`"strict": true`) and adhere to ESLint + Prettier configs.  
- Use **camelCase** for variables/functions and **PascalCase** for classes/components.  
- Avoid “quick hacks” — explain trade-offs if a temporary solution is used.  
- Validate dependencies before suggesting new libraries.  
- Add JSDoc or comments for complex logic and public functions.

---

# 🧪 Pull Request Requirements
- Each PR must include:
  - A clear description of the change.
  - Testing or validation steps.
  - Notes on performance or security implications (if relevant).
- Include **unit or integration tests** for new features (reasonable coverage based on impact).
- When proposing changes, guide the reviewer by highlighting critical logic or architectural decisions.

---

# ⏱️ Task Categories & Time Estimates (for a Middle Engineer)
> Copilot should use these averages when estimating or breaking down tasks.

| Task Type                              | Estimated Hours (Middle Engineer) |
|---------------------------------------:|:----------------------------------|
| Simple frontend page (form, list)      | 2 – 6 hrs                         |
| Frontend with state & API integration  | 6 – 12 hrs                        |
| Simple backend API (CRUD)              | 3 – 8 hrs                         |
| Integration with external service (OAuth, API, etc.) | 8 – 20 hrs         |
| Small bug fix                          | 1 – 4 hrs                         |
| Complex bug fix / deep investigation   | 4 – 12 hrs                        |
| Complex feature + DB schema updates    | 12 – 40 hrs                       |
| Writing or improving test coverage     | 2 – 8 hrs                         |

---

# ⏳ Remaining Time Calculation
Each task (or GitHub Issue) may include:
- `estimated_hours`: total expected time
- `spent_hours`: total logged work time

**Formula:**  
`remaining_hours = max(0, estimated_hours - spent_hours)`

When assisting with time tracking or project summaries, Copilot should:
- Update `estimated_hours` if the scope changes, explaining why.
- Suggest splitting tasks into subtasks if `estimated_hours > 16` to reduce uncertainty.

---

# 💬 Communication Rules
When Copilot generates comments, summaries, or task updates:
- Provide concise, professional explanations (2–3 sentences).
- Mention blockers or reasons for time changes.
- Prefer action-oriented phrasing (e.g., *“Next step: Add API validation layer”*).

---

# ⚙️ Tooling Notes
- All tasks should align with the repository’s CI/CD setup and linting standards.
- If additional setup scripts or dependencies are needed, include them in `.github/workflows/copilot-setup-steps.yml`.
- Copilot may propose workflow or script improvements if they align with the project’s toolchain.

---
