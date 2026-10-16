# Acceptance Criteria

## Foundation (must pass before M01 is built on top)
1. User in Organization A cannot read or change Organization B data, including by editing IDs in requests.
2. Team Member cannot see events they are not assigned to.
3. Signed-out visitors cannot open /dashboard.
4. Suspended members lose access immediately.
5. Admins cannot create or remove owners.
6. A module that is unpurchased or unreleased is rejected by the server.
7. No passwords or secret keys appear in code, emails or logs.

## M01 Event Operations
- Event dashboard shows status, dates, team and next tasks.
- Run sheet: date/time, location, owner, status, notes; dependencies and milestones.
- Tasks: assignee, priority, due date, progress; Team Member can update only their own.
- Printable PDF run sheet that is legible and exports reliably.
- Phone-friendly event-day view.
- Event templates.
- Times correct across time zones and daylight saving.
- Automated tests for create/edit/delete flows; clear error messages.

## Payment (Phase 3, not started)
- Invalid webhook signature creates nothing.
- Same webhook twice grants one entitlement.
- Purchase -> activation -> login -> use -> export passes on staging before live sales.
