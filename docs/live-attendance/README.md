# HRMS Live Attendance v3

This bundle adds the missing background-presence layer to the existing HRMS.

## Behavior
- Browser heartbeat: 30 seconds.
- Desktop agent heartbeat: 30 seconds.
- Desktop idle classification: configurable, default 5 minutes.
- Windows lock/unlock and suspend/resume via Electron `powerMonitor`.
- Closing the browser tab does NOT check the employee out.
- If the browser heartbeat expires while the desktop agent is alive, admin sees `TAB CLOSED / WEB OFFLINE`.
- If the desktop heartbeat expires, admin sees `OFFLINE`.
- Typed breaks: Tea, Lunch, Namaz, Bio, Personal, Meeting, Other.
- Breaks are persisted with start/end/duration and are closed before checkout.
- Presence events are append-only for state transitions.

## Privacy
This tracks system presence only. It does not collect keystrokes, screenshots, browser history, or private application contents.

## Important production note
The included Electron agent uses Firebase email/password authentication for staging/demo deployment.
Do not ship employee passwords in a managed desktop configuration. Production should replace this
with device pairing plus short-lived/custom tokens issued by a trusted backend.

## Integration
Load `integration/presenceService.js` before views, and load the attendance/presence integration
after `ess-view.js`. Mount `LivePresenceView.mount('live-presence-container')` from the existing
admin/HR dashboard.
