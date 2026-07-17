## 4.0.3

* Defer socket emissions to a macrotask + force root detectChanges (Angular 22 CD)

## 4.0.2

* Force UI refresh with root `detectChanges()` after socket responses (Angular 22; `tick`/`markForCheck` insufficient)

## 4.0.1

* Restore Sails virtual requests over the socket (get/post/put/patch/delete) — no HTTP fetch / CORS
* Keep socket.io-client v4 connect helper
* Force Angular CD after socket responses (PendingTasks + MarkForCheck + ApplicationRef.tick on macrotask)

# @aloreljs/ngx-sails (fork)

## 4.0.0

- Require `socket.io-client` >= 4 (Engine.IO v4).
- Resolve `io()` correctly for socket.io-client v4 ESM/CJS shapes.
- Keep HTTP fetch for get/post/put/patch/delete; socket for on()/emit() realtime.
- Drop `@types/socket.io-client` (types ship with v4).

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
