# @aloreljs/ngx-sails (fork)

## 3.1.0

- Deliver `SailsClient` Observable notifications inside Angular's change-detection cycle
  (`NgZone`, `PendingTasks`, `ɵChangeDetectionScheduler`, `ApplicationRef.tick()`).
- Fixes UI that stayed stale until user interaction when socket.io callbacks ran outside the zone.
- Relax Angular peerDependencies to `>=15.0.0`.

## 3.0.0

- Previous published build from Alorel/ngx-sails.
