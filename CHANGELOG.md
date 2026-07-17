# @aloreljs/ngx-sails (fork)

## 3.2.0

- Route SailsClient get/post/put/patch/delete over HTTP fetch so Angular zone CD updates templates.
- Keep socket.io for on()/emit() realtime events.

## 3.1.2

- Force change detection via `setTimeout` macrotask after socket responses.
- Fixes stale loading spinners when socket.io callbacks already run inside NgZone
  (Zone-patched WebSocket) and microtask `ApplicationRef.tick()` is skipped.
- Refresh UI after each `on()` event (streams that never complete).

## 3.1.1

- Avoid synchronous `ApplicationRef.tick()` (prevents recursive CD that can blank UI / hide POS sidenav).
- Do not register `PendingTasks` for long-lived `on()` event streams.
- Resolve `PendingTasks` optionally so construction never throws.

## 3.1.0

- Deliver `SailsClient` Observable notifications inside Angular's change-detection cycle
  (`NgZone`, `PendingTasks`, `ɵChangeDetectionScheduler`, `ApplicationRef.tick()`).
- Fixes UI that stayed stale until user interaction when socket.io callbacks ran outside the zone.
- Relax Angular peerDependencies to `>=15.0.0`.

## 3.0.0

- Previous published build from Alorel/ngx-sails.
