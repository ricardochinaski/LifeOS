# LifeOS — Phase 3 multi-device synchronization acceptance

## Scope

Phase 3 adds deterministic integration coverage for the synchronization algorithm and defines the acceptance procedure for a real Web + Android session using the same Google account.

The automated suite does **not** pretend to be a physical-device Firebase test. It validates the same collection upsert/delete reconciliation semantics in memory, without storing Firebase credentials in CI.

## Automated integration scenarios

`tests/sync-multidevice.integration.test.ts` covers:

1. Two devices start from the same cloud snapshot.
2. Device A edits an existing task and creates a reading session while offline.
3. Device B deletes a different task and creates a reading group.
4. Both deltas are replayed and the resulting snapshot keeps all independent changes.
5. An offline deletion survives while another device creates an unrelated cloud entity.
6. A same-entity concurrent edit has explicit deterministic semantics: the last device whose delta is replayed wins that entity.

This last rule is current LifeOS behavior. Phase 3 documents it rather than hiding it. A future conflict-resolution layer can replace this policy if field-level merge or user-visible conflict resolution is required.

## Manual Web + Android acceptance test

Use disposable entities prefixed with `E2E-` so production personal data is not confused with test data.

### Preparation

1. Open the production or preview Web app and sign in with the same Google account used on Android.
2. Open LifeOS on Android and sign in with that account.
3. Keep both online until the same test task is visible on both devices.
4. Confirm there is no active sync error on either device.

### Independent offline changes

1. Put Android offline (airplane mode or disable Wi-Fi/mobile data).
2. On Android:
   - create task `E2E-ANDROID-TASK`;
   - create a reading group `E2E-ANDROID-GROUP` linked to a disposable book;
   - start and finish one reading session;
   - delete a disposable note named `E2E-DELETE-ME` if present.
3. Keep Android offline.
4. On Web, while still online:
   - create task `E2E-WEB-TASK`;
   - create note `E2E-WEB-NOTE`.
5. Reconnect Android.
6. Wait for synchronization to finish on Android and Web.

### Expected result

Both clients must show:

- `E2E-ANDROID-TASK`;
- `E2E-WEB-TASK`;
- `E2E-ANDROID-GROUP`;
- the Android reading session;
- `E2E-WEB-NOTE`;
- absence of `E2E-DELETE-ME`.

Reload the Web app and fully close/reopen Android. The result must remain identical after both cold starts.

## Same-entity conflict test

This test verifies the currently documented conflict policy.

1. Create `E2E-CONFLICT` and wait until both clients have the same version.
2. Disconnect Android.
3. Edit the same entity on Web to `E2E-CONFLICT-WEB`.
4. Edit its offline Android copy to `E2E-CONFLICT-ANDROID`.
5. Reconnect Android after the Web edit has already reached Firestore.

### Current expected behavior

The Android replay is the later replay, so its version is expected to become the final value for that entity. This is **last-replayed-device wins**, not field-level conflict resolution.

## Cleanup

Delete all `E2E-` entities after the test and verify their deletion appears on both clients.

## Acceptance criteria

Phase 3 multi-device sync is accepted when:

- all automated synchronization tests pass in CI;
- the Web + Android manual scenario passes with cold-start persistence;
- no unrelated cloud entity is lost;
- offline deletions are reproduced;
- same-entity conflict behavior matches the documented last-replayed-device rule.
