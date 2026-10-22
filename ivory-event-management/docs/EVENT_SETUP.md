# Create your first event

After deploying this change, sign in and open **Ivory Digital Pixel** from Your workspaces. Click **Create event**, enter a name, event type, venue, time zone and start date/time. End time and notes are optional. Click **Create event** to open its details. Return to the workspace to see saved events.

This increment uses the existing `events` table and its RLS policies. It needs no schema changes, credentials or new environment variables. Owners and admins can create events in this version. Project managers and team members can view events assigned to them under the existing database rules. Project-manager creation will need atomic event/creator assignment before it can be enabled in the UI; otherwise the existing read policy would hide their newly created event.

Event creation is part of the foundation (see the role matrix). Tasks and the run sheet are not included here, and the Event Operations module remains unreleased. No module entitlement is granted or bypassed.

Dates are stored as UTC instants and displayed in the saved event time zone. The selector supports ten common zones, with Bangkok as the default. Nonexistent or repeated local times during daylight-saving changes are rejected with an error; choose a different time.

Before merging, run `npm test`, `npm run typecheck`, and `npm run build`. After deployment, create a test wedding, refresh the workspace to confirm persistence, and verify the displayed date/time. Use a separate account/workspace to check cross-workspace isolation. Do not create real customer events until these checks pass.
