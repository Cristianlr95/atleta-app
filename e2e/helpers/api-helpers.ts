export interface ApiAuthSession {
  token: string;
  userUuid: string;
  alias: string;
}

export interface MatchSeedResult {
  matchId: number;
  teamId: number;
  invitedUserUuids: string[];
}

export interface MatchInviteSnapshot {
  id: number;
  matchId: number;
  status: string;
  targetUuid: string;
}

export interface MatchMvpSnapshot {
  open: boolean;
  finalizedAt?: string | null;
  closesAt?: string | null;
  myVote?: string | null;
  winnerUserId?: string | null;
  candidates: Array<{ userId: string; alias?: string | null }>;
  tally: Array<{ userId: string; alias?: string | null; votes: number }>;
}

interface TeamSummary {
  id: number;
  nombre: string;
}

interface TeamMember {
  playerUuid: string;
  alias: string;
}

const apiBase = process.env.E2E_API_URL ?? 'http://localhost:8080/api/v1';

export async function apiLogin(email: string, password: string): Promise<ApiAuthSession> {
  const response = await fetch(`${apiBase}/athletes/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`apiLogin failed (${response.status})`);
  }

  const body = (await response.json()) as Record<string, unknown>;
  const token = resolveToken(response, body);
  const userUuid = resolveUserUuid(body);
  const alias = resolveAlias(body);

  if (!token || !userUuid) {
    throw new Error('apiLogin missing token or userUuid');
  }

  return { token, userUuid, alias };
}

export async function createMatchWithInvites(
  creator: ApiAuthSession,
  inviteTargets: ApiAuthSession[],
): Promise<MatchSeedResult> {
  const teams = await authorizedGet<TeamSummary[]>(creator.token, `/teams/by-player/${creator.userUuid}`);
  if (!teams.length) {
    throw new Error('No teams available for creator');
  }
  const teamId = teams[0].id;

  const fields = await authorizedGet<Array<{ latitud?: number; longitud?: number }>>(
    creator.token,
    '/fields?soloActivas=true',
  );

  const firstField = fields[0] ?? {};
  const latitud = Number(firstField.latitud ?? -36.82699);
  const longitud = Number(firstField.longitud ?? -73.04977);

  const scheduledAt = nextFutureDateTimeString();

  const match = await authorizedPost<{ id: number }, Record<string, unknown>>(creator.token, '/matches', {
    creadorUuid: creator.userUuid,
    modalidad: 'CINCO_VS_CINCO',
    fechaHoraProgramada: scheduledAt,
    latitud,
    longitud,
  });

  await authorizedPost<void, null>(creator.token, `/matches/${match.id}/teams/${teamId}?esLocal=true`, null);

  const members = await authorizedGet<TeamMember[]>(creator.token, `/teams/${teamId}/members/active`);
  const invitePool = dedupeInviteTargets(inviteTargets, members, creator.userUuid).slice(0, 10);

  for (const target of invitePool) {
    await authorizedPost(creator.token, '/social/match-invites', {
      matchId: match.id,
      teamId,
      requesterUuid: creator.userUuid,
      targetUuid: target.userUuid,
      message: `Smoke invite ${new Date().toISOString()}`,
    });
  }

  return {
    matchId: match.id,
    teamId,
    invitedUserUuids: invitePool.map((item) => item.userUuid),
  };
}

export async function getMatchInvitesForUser(session: ApiAuthSession): Promise<MatchInviteSnapshot[]> {
  const invites = await authorizedGet<Array<Record<string, unknown>>>(
    session.token,
    `/social/match-invites/${session.userUuid}`,
  );

  return invites.map((item) => ({
    id: Number(item['id']),
    matchId: Number(item['matchId']),
    status: String(item['status'] ?? ''),
    targetUuid: String(item['targetUuid'] ?? ''),
  }));
}

export async function respondMatchInvite(
  session: ApiAuthSession,
  inviteId: number,
  accept: boolean,
): Promise<void> {
  await authorizedPut<void, { actorUuid: string; accept: boolean }>(
    session.token,
    `/social/match-invites/${inviteId}/decision`,
    {
      actorUuid: session.userUuid,
      accept,
    },
  );
}

export async function updateMatchStatus(
  session: ApiAuthSession,
  matchId: number,
  status: 'CREADO' | 'INICIADO' | 'FINALIZADO' | 'INVALIDO',
): Promise<void> {
  await authorizedPut<void, null>(session.token, `/matches/${matchId}/status?status=${status}&actorUuid=${session.userUuid}`, null);
}

export async function getMatchMvp(session: ApiAuthSession, matchId: number): Promise<MatchMvpSnapshot> {
  return authorizedGet<MatchMvpSnapshot>(session.token, `/matches/${matchId}/mvp?voterUserId=${session.userUuid}`);
}

export async function voteMatchMvp(
  session: ApiAuthSession,
  matchId: number,
  votedUserId: string,
): Promise<MatchMvpSnapshot> {
  return authorizedPost<MatchMvpSnapshot, { votedUserId: string }>(
    session.token,
    `/matches/${matchId}/mvp/vote?voterUserId=${session.userUuid}`,
    { votedUserId },
  );
}

async function authorizedGet<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`GET ${path} failed (${response.status})`);
  }

  return (await response.json()) as T;
}

async function authorizedPost<T = unknown, TBody = unknown>(
  token: string,
  path: string,
  body?: TBody,
): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body !== null && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== null && body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new Error(`POST ${path} failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function authorizedPut<T = unknown, TBody = unknown>(
  token: string,
  path: string,
  body?: TBody,
): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body !== null && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== null && body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new Error(`PUT ${path} failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function dedupeInviteTargets(
  explicitTargets: ApiAuthSession[],
  members: TeamMember[],
  creatorUuid: string,
): ApiAuthSession[] {
  const byUuid = new Map<string, ApiAuthSession>();

  for (const target of explicitTargets) {
    if (target.userUuid !== creatorUuid) {
      byUuid.set(target.userUuid, target);
    }
  }

  for (const member of members) {
    if (member.playerUuid === creatorUuid || byUuid.has(member.playerUuid)) {
      continue;
    }

    byUuid.set(member.playerUuid, {
      token: '',
      userUuid: member.playerUuid,
      alias: member.alias,
    });
  }

  return [...byUuid.values()];
}

function resolveToken(response: Response, body: Record<string, unknown>): string | null {
  const authHeader = response.headers.get('Authorization') ?? response.headers.get('authorization');
  if (authHeader) {
    return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  }

  return deepFindString(body, ['accessToken', 'access_token', 'token', 'jwt', 'idToken', 'id_token']);
}

function resolveUserUuid(body: Record<string, unknown>): string | null {
  return deepFindString(body, ['atletaUuid', 'athleteUuid', 'uuid']);
}

function resolveAlias(body: Record<string, unknown>): string {
  return deepFindString(body, ['nombre', 'name', 'alias']) ?? 'Jugador';
}

function deepFindString(value: unknown, keys: string[], depth = 0): string | null {
  if (depth > 4 || value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0 ? value : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = deepFindString(item, keys, depth + 1);
      if (found) {
        return found;
      }
    }
    return null;
  }

  if (typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }

  for (const nested of Object.values(record)) {
    const found = deepFindString(nested, keys, depth + 1);
    if (found) {
      return found;
    }
  }

  return null;
}

function nextFutureDateTimeString(): string {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}
