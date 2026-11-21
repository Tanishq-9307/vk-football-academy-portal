import { supabase } from './supabase'
import type {
  Announcement,
  AttendanceRecord,
  Coach,
  FeeRecord,
  FeeStructure,
  Match,
  ParentLink,
  Player,
  PlayerReport,
  Profile,
  Team,
  TrainingSession,
} from './types'

/** The coach record linked to the signed-in user (null for admins / unlinked). */
export async function fetchMyCoach(userId: string): Promise<Coach | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('coaches')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return (data as Coach | null) ?? null
}

/**
 * Teams visible to the signed-in user.
 * Admin: every team. Coach: only teams they are assigned to coach.
 */
export async function fetchVisibleTeams(
  profile: Profile,
  coach: Coach | null,
): Promise<Team[]> {
  if (!supabase) return []
  let query = supabase
    .from('teams')
    .select('*, coach:coaches(*)')
    .order('age_group')
    .order('name')
  if (profile.role === 'coach' && coach) {
    query = query.eq('coach_id', coach.id)
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Team[]
}

/** All players of one team (via team_players). */
export async function fetchTeamPlayers(teamId: string): Promise<Player[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('team_players')
    .select('player:players(*)')
    .eq('team_id', teamId)
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as unknown as { player: Player | null }[]
  return rows
    .map((row) => row.player)
    .filter((p): p is Player => p !== null)
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
}

/** Sessions visible to the signed-in user, newest first. */
export async function fetchVisibleSessions(
  profile: Profile,
  _coach: Coach | null,
  teamIds: string[],
): Promise<TrainingSession[]> {
  if (!supabase) return []
  let query = supabase
    .from('training_sessions')
    .select('*, team:teams(*)')
    .order('session_date', { ascending: false })
    .order('start_time', { ascending: false })
  if (profile.role === 'coach') {
    if (teamIds.length === 0) return []
    query = query.in('team_id', teamIds)
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as TrainingSession[]
}

/** Attendance rows for a set of session ids. */
export async function fetchAttendanceForSessions(
  sessionIds: string[],
): Promise<AttendanceRecord[]> {
  if (!supabase || sessionIds.length === 0) return []
  const { data, error } = await supabase
    .from('attendance')
    .select('*, player:players(*)')
    .in('training_session_id', sessionIds)
  if (error) throw new Error(error.message)
  return (data ?? []) as AttendanceRecord[]
}

/** Attendance rows for one session. */
export async function fetchAttendanceForSession(
  sessionId: string,
): Promise<AttendanceRecord[]> {
  return fetchAttendanceForSessions([sessionId])
}

/** Signed download URL for a private session-plan file (valid 1 hour). */
export async function getPlanFileUrl(
  filePath: string,
): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.storage
    .from('session-plans')
    .createSignedUrl(filePath, 3600)
  if (error) return null
  return data.signedUrl
}

/* ------------------------------ Parent portal ----------------------------- */

/** Children linked to the signed-in parent, with their teams. */
export async function fetchMyChildren(userId: string): Promise<Player[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('parents')
    .select('player:players(*)')
    .eq('parent_id', userId)
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as unknown as { player: Player | null }[]
  return rows
    .map((row) => row.player)
    .filter((p): p is Player => p !== null)
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
}

/** Teams a set of players belong to. */
export async function fetchTeamsForPlayers(
  playerIds: string[],
): Promise<Team[]> {
  if (!supabase || playerIds.length === 0) return []
  const { data, error } = await supabase
    .from('team_players')
    .select('team:teams(*)')
    .in('player_id', playerIds)
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as unknown as { team: Team | null }[]
  const seen = new Map<string, Team>()
  for (const row of rows) {
    if (row.team) seen.set(row.team.id, row.team)
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/** Attendance rows for one player, newest session first. */
export async function fetchAttendanceForPlayer(
  playerId: string,
): Promise<AttendanceRecord[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('player_id', playerId)
    .order('marked_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as AttendanceRecord[]
}

/* --------------------------------- Matches -------------------------------- */

/** Matches for a set of teams, newest first. RLS further restricts parents. */
export async function fetchMatchesForTeams(
  teamIds: string[],
): Promise<Match[]> {
  if (!supabase || teamIds.length === 0) return []
  const { data, error } = await supabase
    .from('matches')
    .select('*, team:teams(*)')
    .in('team_id', teamIds)
    .order('match_date', { ascending: false })
    .order('start_time', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Match[]
}

/** All matches (admin) — newest first. */
export async function fetchAllMatches(): Promise<Match[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('matches')
    .select('*, team:teams(*)')
    .order('match_date', { ascending: false })
    .order('start_time', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Match[]
}

/* ------------------------------ Announcements ----------------------------- */

/** Announcements visible to a role: admins see all, others by audience. */
export async function fetchAnnouncementsForRole(
  role: 'admin' | 'coach' | 'parent',
): Promise<Announcement[]> {
  if (!supabase) return []
  let query = supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
  if (role === 'coach') query = query.in('audience', ['all', 'coaches'])
  if (role === 'parent') query = query.in('audience', ['all', 'parents'])
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Announcement[]
}

/* ----------------------------------- Fees --------------------------------- */

export async function fetchFeeStructures(): Promise<FeeStructure[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('fee_structures')
    .select('*')
    .order('due_date', { ascending: true })
    .order('name')
  if (error) throw new Error(error.message)
  return (data ?? []) as FeeStructure[]
}

/** Fee records for a set of players, with structure + player joined. */
export async function fetchFeeRecordsForPlayers(
  playerIds: string[],
): Promise<FeeRecord[]> {
  if (!supabase || playerIds.length === 0) return []
  const { data, error } = await supabase
    .from('fee_records')
    .select('*, player:players(*), structure:fee_structures(*)')
    .in('player_id', playerIds)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as FeeRecord[]
}

/* --------------------------- Player development --------------------------- */

/** Reports for one player, newest assessment first. */
export async function fetchReportsForPlayer(
  playerId: string,
): Promise<PlayerReport[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('player_reports')
    .select('*, player:players(*), coach:coaches(*), session:training_sessions(*)')
    .eq('player_id', playerId)
    .order('assessment_date', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as PlayerReport[]
}

/** Reports for a set of players (coach's teams / admin overview). */
export async function fetchReportsForPlayers(
  playerIds: string[],
): Promise<PlayerReport[]> {
  if (!supabase || playerIds.length === 0) return []
  const { data, error } = await supabase
    .from('player_reports')
    .select('*, player:players(*), coach:coaches(*), session:training_sessions(*)')
    .in('player_id', playerIds)
    .order('assessment_date', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as PlayerReport[]
}

/** Parent links with child + parent profile joined (admin management). */
export async function fetchParentLinks(): Promise<ParentLink[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('parents')
    .select('*, player:players(*), parent:profiles(*)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as ParentLink[]
}

export async function supabaseErrorMessage(error: unknown): Promise<string> {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'Something went wrong. Please try again.'
}
