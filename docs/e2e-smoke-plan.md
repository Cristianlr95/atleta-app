# Atleta E2E Smoke Plan

## Automated suite (Playwright)

Scripts:
- `npm run e2e`
- `npm run e2e:headed`

Environment variables required for smoke with backend real:
- `E2E_BASE_URL` (default: `http://localhost:8100`)
- `E2E_API_URL` (default: `http://localhost:8080/api/v1`)
- `E2E_USER_A_EMAIL`
- `E2E_USER_A_PASSWORD`
- `E2E_USER_B_EMAIL`
- `E2E_USER_B_PASSWORD`

If credentials are missing, smoke specs are marked as skipped.

## Preconditions
- Backend running at `http://localhost:8080`
- Frontend running at `http://localhost:8100`
- Test users with at least one team and players

## Smoke 1: Auth and onboarding
1. Open `/login`.
2. Login with valid credentials.
3. Expect redirect to `/player/profile` (or `/player/onboarding` if missing profile).
4. Logout/login cycle keeps stable navigation without duplicate requests.

## Smoke 2: Create match and send invites
1. Go to `/sessions/create` -> `Crear partido`.
2. Complete wizard:
   - Tipo
   - Fecha/hora/cancha
   - Jugadores
3. Send invitations.
4. Expect redirect to `/matches/:id`.
5. Expect progress card to show invited count > 0.

## Smoke 3: Accept/reject invitation and consistency
1. Open `/social?tab=matches` as invited user.
2. Accept invite.
3. Open `/matches/:id`.
4. Expect participant moved from pending to confirmed.
5. Return to social and verify no stale status.

## Smoke 4: Back navigation stability
1. From `/matches/:id`, go back to `/social`.
2. Reopen same match.
3. Expect data refresh (no infinite spinner, no frozen state).
4. Repeat quickly (tap stress) and ensure app remains responsive.

## Smoke 5: Live updates
1. User A opens `/matches/:id`.
2. User B accepts invite from another session.
3. User A sees updated counts without manual refresh.
4. Confirm status transitions and participants list updates.

## Smoke 6: MVP vote post-cierre
1. Seed match via API and accept at least one invitation.
2. Transition match `CREADO -> INICIADO -> FINALIZADO`.
3. Open `/matches/:id/mvp-vote` with confirmed participant.
4. Submit MVP vote and verify "Tu voto actual".
5. Validate API returns `myVote` for current user.

## Pass criteria
- No infinite loading.
- No duplicate action execution on fast taps.
- Match detail, invitations and social show consistent confirmation counts.
- Back navigation always returns to a valid screen.
