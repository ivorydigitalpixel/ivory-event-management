# Role & Permission Matrix (draft v0.1 — needs owner review)

Roles are stored **per organization**. Event assignment further limits what Project Managers and Team Members see.
Y = allowed, A = only for events they are assigned to, O = only their own items, N = not allowed. "M01" = requires the Event Operations module to be purchased and released.

| Capability | Owner | Admin | Project Manager | Team Member |
|---|---|---|---|---|
| Edit organization settings | Y | Y | N | N |
| Close / delete organization | Y | N | N | N |
| Invite or remove members | Y | Y (not owners) | N | N |
| Change member roles | Y | Y (not to/from owner) | N | N |
| View purchased modules | Y | Y | Y | N |
| Create events | Y | Y | Y | N |
| View all events | Y | Y | A | A |
| Edit / archive events | Y | Y | A | N |
| Assign people to events | Y | Y | A | N |
| M01: edit schedule / run sheet | Y | Y | A | N |
| M01: create and assign tasks | Y | Y | A | N |
| M01: view schedule and tasks | Y | Y | A | A |
| M01: update task status | Y | Y | A | O |
| M01: print / export run sheet | Y | Y | A | A |
| View audit log | Y | Y | N | N |
| Financial data (future M02) | Y | Y | A (if granted) | N |

Platform operator (Ivory staff) is **not** an organization role. It is a separate console using server-only credentials, never reachable from a customer account.

Open questions: can Admins remove other Admins? Can Team Members see the full run sheet or only their own items? (Matrix above assumes the full run sheet for assigned events.)
