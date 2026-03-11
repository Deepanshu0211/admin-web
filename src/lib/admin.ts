import { supabase } from "./supabase";

export const ADMIN_SESSION_KEY = "legend_admin_session";

const DAY_MS = 24 * 60 * 60 * 1000;

export type Gender = "male" | "female" | "other";
export type MemberStatus = "active" | "expiring" | "expired" | "deleted";
export type MessageType = "message" | "diet_plan";

export interface AdminSession {
  phone: string;
  name: string;
  role: "admin";
}

export interface MemberRecord {
  id: string;
  name: string;
  phoneNumber: string;
  role: "member" | "admin";
  isDeleted: boolean;
  deletedAt: number | null;
  profilePicture: string | null;
  address: string;
  aadharNumber: string;
  alternatePhone: string;
  joiningDate: string;
  gender: Gender | "";
  membershipStartDate: string;
  membershipExpiryDate: string;
  createdAt: string | null;
}

export interface MemberFormData {
  name: string;
  phoneNumber: string;
  address: string;
  aadharNumber: string;
  alternatePhone: string;
  joiningDate: string;
  gender: Gender | "";
  membershipStartDate: string;
  membershipExpiryDate: string;
  profilePicture?: string;
}

export interface GymStatusRecord {
  isOpen: boolean;
  lastUpdated: number;
  updatedBy: string;
}

export interface GymLogRecord {
  timestamp: number;
  action: "open" | "close";
  by: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string | null;
  phoneNumber: string;
  memberName: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  method: string;
  latitude: number | null;
  longitude: number | null;
}

export interface BroadcastMessageRecord {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  sentBy: string;
  targetUser: string | null;
  image: string | null;
  type: MessageType;
  seenBy: string[];
}

export interface DashboardData {
  members: MemberRecord[];
  todayAttendanceCount: number;
  gymStatus: GymStatusRecord;
  recentMembers: MemberRecord[];
  recentLogs: GymLogRecord[];
  recentMessages: BroadcastMessageRecord[];
}

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toLocalDate(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string" && isDateOnly(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function toDbDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(
    date.getTime() - date.getTimezoneOffset() * 60000,
  ).toISOString();
}

function normalizeMillis(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && /^\d+$/.test(value)) {
    return numericValue;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function mapMember(row: any): MemberRecord {
  return {
    id: row.id,
    name: row.name ?? "Unknown",
    phoneNumber: row.phone_number ?? "",
    role: row.role === "admin" ? "admin" : "member",
    isDeleted: Boolean(row.is_deleted),
    deletedAt: row.deleted_at ? normalizeMillis(row.deleted_at) : null,
    profilePicture: row.avatar_url ?? null,
    address: row.address ?? "",
    aadharNumber: row.aadhar_number ?? "",
    alternatePhone: row.alternate_phone ?? "",
    joiningDate: formatDateInput(row.joining_date),
    gender: (row.gender as Gender | null) ?? "",
    membershipStartDate: formatDateInput(row.membership_start_date),
    membershipExpiryDate: formatDateInput(row.membership_expiry_date),
    createdAt: row.created_at ?? null,
  };
}

function mapMessage(row: any): BroadcastMessageRecord {
  return {
    id: row.id,
    title: row.title ?? "Untitled",
    body: row.body ?? "",
    timestamp: normalizeMillis(row.timestamp),
    sentBy: row.sent_by ?? "Admin",
    targetUser: row.target_user ?? null,
    image: row.image_url ?? null,
    type: row.type === "diet_plan" ? "diet_plan" : "message",
    seenBy: Array.isArray(row.seen_by) ? row.seen_by : [],
  };
}

function mapGymLog(row: any): GymLogRecord {
  return {
    timestamp: normalizeMillis(row.timestamp),
    action: row.action === "open" ? "open" : "close",
    by: row.performed_by ?? "Admin",
  };
}

function mapGymStatus(row: any | null): GymStatusRecord {
  return {
    isOpen: Boolean(row?.is_open),
    lastUpdated: normalizeMillis(row?.last_updated) || Date.now(),
    updatedBy: row?.updated_by ?? "Unknown",
  };
}

function mapMemberPayload(member: MemberFormData) {
  return {
    name: member.name.trim(),
    phone_number: member.phoneNumber.trim(),
    address: member.address.trim() || null,
    aadhar_number: member.aadharNumber.trim() || null,
    alternate_phone: member.alternatePhone.trim() || null,
    joining_date: toDbDate(member.joiningDate),
    gender: member.gender || null,
    membership_start_date: toDbDate(member.membershipStartDate),
    membership_expiry_date: toDbDate(member.membershipExpiryDate),
    avatar_url: member.profilePicture || null,
  };
}

async function ensurePhoneAvailable(phoneNumber: string, memberId?: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("phone_number", phoneNumber)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to verify phone number.");
  }

  if (data && data.id !== memberId) {
    throw new Error("A user with this phone number already exists.");
  }
}

export function getLocalDateStr(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateInput(value: string | number | null | undefined) {
  const date = toLocalDate(value);
  return date ? getLocalDateStr(date) : "";
}

export function formatDateLabel(value: string | number | null | undefined) {
  const date = toLocalDate(value);
  if (!date) {
    return "N/A";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const timestamp = normalizeMillis(value);
  if (!timestamp) {
    return "N/A";
  }

  return new Date(timestamp).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(value: string | null | undefined) {
  if (!value) {
    return "Active";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function addMonthsToDate(dateInput: string, months: number) {
  const date = toLocalDate(dateInput);
  if (!date) {
    return "";
  }

  date.setMonth(date.getMonth() + months);
  return getLocalDateStr(date);
}

export function getMemberStatus(
  member: MemberRecord,
  referenceDate = new Date(),
): MemberStatus {
  if (member.isDeleted) {
    return "deleted";
  }

  if (!member.membershipExpiryDate) {
    return "expired";
  }

  const expiryDate = toLocalDate(member.membershipExpiryDate);
  if (!expiryDate) {
    return "expired";
  }

  const compareDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const normalizedExpiry = new Date(
    expiryDate.getFullYear(),
    expiryDate.getMonth(),
    expiryDate.getDate(),
  );
  const diffDays = Math.ceil(
    (normalizedExpiry.getTime() - compareDate.getTime()) / DAY_MS,
  );

  if (diffDays < 0) {
    return "expired";
  }

  if (diffDays <= 7) {
    return "expiring";
  }

  return "active";
}

export function getStoredAdminSession(): AdminSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession =
    localStorage.getItem(ADMIN_SESSION_KEY) ??
    localStorage.getItem("admin_session");
  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as AdminSession;
    if (parsed.phone && parsed.name) {
      return parsed;
    }
  } catch {
    return { phone: rawSession, name: "Admin", role: "admin" };
  }

  return null;
}

export function saveAdminSession(session: AdminSession) {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem("admin_session");
}

export async function fetchAdminByPhone(phoneNumber: string) {
  const { data, error } = await supabase
    .from("users")
    .select("name, phone_number, role, is_deleted")
    .eq("phone_number", phoneNumber.trim())
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to authenticate admin.");
  }

  if (!data || data.role !== "admin" || data.is_deleted) {
    return null;
  }

  return {
    phone: data.phone_number,
    name: data.name ?? "Admin",
    role: "admin" as const,
  };
}

export async function fetchMembers() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "member")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to fetch members.");
  }

  return (data ?? []).map(mapMember);
}

export async function createMember(member: MemberFormData) {
  await ensurePhoneAvailable(member.phoneNumber.trim());

  const payload = {
    ...mapMemberPayload(member),
    role: "member",
  };

  const { data, error } = await supabase
    .from("users")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Unable to create member.");
  }

  return mapMember(data);
}

export async function updateMember(memberId: string, member: MemberFormData) {
  await ensurePhoneAvailable(member.phoneNumber.trim(), memberId);

  const { data, error } = await supabase
    .from("users")
    .update(mapMemberPayload(member))
    .eq("id", memberId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Unable to update member.");
  }

  return mapMember(data);
}

export async function setMemberDeleted(memberId: string, isDeleted: boolean) {
  const { error } = await supabase
    .from("users")
    .update({
      is_deleted: isDeleted,
      deleted_at: isDeleted ? new Date().toISOString() : null,
    })
    .eq("id", memberId);

  if (error) {
    throw new Error(error.message || "Unable to update member state.");
  }
}

export async function fetchGymStatus() {
  const { data, error } = await supabase
    .from("gym_status")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to fetch gym status.");
  }

  return mapGymStatus(data);
}

export async function updateGymStatus(isOpen: boolean, updatedBy: string) {
  const now = Date.now();

  const { error: statusError } = await supabase.from("gym_status").upsert({
    id: 1,
    is_open: isOpen,
    last_updated: now,
    updated_by: updatedBy,
  });

  if (statusError) {
    throw new Error(statusError.message || "Unable to update gym status.");
  }

  const { error: logError } = await supabase.from("gym_logs").insert({
    timestamp: now,
    action: isOpen ? "open" : "close",
    performed_by: updatedBy,
  });

  if (logError) {
    throw new Error(
      logError.message || "Gym status changed but log creation failed.",
    );
  }

  return {
    isOpen,
    lastUpdated: now,
    updatedBy,
  };
}

export async function fetchGymLogs(limit = 120) {
  const { data, error } = await supabase
    .from("gym_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || "Unable to fetch gym logs.");
  }

  return (data ?? []).map(mapGymLog);
}

export async function fetchAttendance(date: string) {
  const { data, error } = await supabase
    .from("attendance")
    .select(
      "id, user_id, phone_number, date, check_in, check_out, method, latitude, longitude, users!inner(name, phone_number, role)",
    )
    .eq("date", date)
    .neq("users.role", "admin")
    .order("check_in", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to fetch attendance.");
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id ?? null,
    phoneNumber: row.phone_number ?? row.users?.phone_number ?? "",
    memberName: row.users?.name ?? "Unknown",
    date: row.date,
    checkIn: row.check_in,
    checkOut: row.check_out ?? null,
    method: row.method ?? "QR",
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
  }));
}

export async function fetchMessages(limit = 100) {
  const { data, error } = await supabase
    .from("broadcast_messages")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || "Unable to fetch messages.");
  }

  return (data ?? []).map(mapMessage);
}

export async function createMessage(message: {
  title: string;
  body: string;
  sentBy: string;
  targetUser: string | null;
  type: MessageType;
  image?: string | null;
}) {
  const { data, error } = await supabase
    .from("broadcast_messages")
    .insert({
      title: message.title.trim(),
      body: message.body.trim(),
      timestamp: Date.now(),
      sent_by: message.sentBy,
      target_user: message.targetUser,
      type: message.type,
      image_url: message.image ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Unable to send message.");
  }

  return mapMessage(data);
}

export async function removeMessage(messageId: string) {
  const { error } = await supabase
    .from("broadcast_messages")
    .delete()
    .eq("id", messageId);

  if (error) {
    throw new Error(error.message || "Unable to delete message.");
  }
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const today = getLocalDateStr();
  const [
    members,
    attendanceCountResult,
    gymStatusResult,
    gymLogsResult,
    messagesResult,
  ] = await Promise.all([
    fetchMembers(),
    supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("date", today),
    supabase.from("gym_status").select("*").eq("id", 1).maybeSingle(),
    supabase
      .from("gym_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(6),
    supabase
      .from("broadcast_messages")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(4),
  ]);

  if (attendanceCountResult.error) {
    throw new Error(
      attendanceCountResult.error.message ||
        "Unable to fetch attendance summary.",
    );
  }

  if (gymStatusResult.error) {
    throw new Error(
      gymStatusResult.error.message || "Unable to fetch gym status.",
    );
  }

  if (gymLogsResult.error) {
    throw new Error(gymLogsResult.error.message || "Unable to fetch gym logs.");
  }

  if (messagesResult.error) {
    throw new Error(
      messagesResult.error.message || "Unable to fetch messages.",
    );
  }

  return {
    members,
    todayAttendanceCount: attendanceCountResult.count ?? 0,
    gymStatus: mapGymStatus(gymStatusResult.data),
    recentMembers: members.slice(0, 5),
    recentLogs: (gymLogsResult.data ?? []).map(mapGymLog),
    recentMessages: (messagesResult.data ?? []).map(mapMessage),
  };
}

export async function fetchLeaderboard() {
  const [membersResult, attendanceResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, gender, avatar_url, role")
      .eq("role", "member")
      .eq("is_deleted", false),
    supabase.from("attendance").select("user_id, date"),
  ]);

  if (membersResult.error) {
    throw new Error(
      membersResult.error.message || "Unable to fetch leaderboard members.",
    );
  }

  if (attendanceResult.error) {
    throw new Error(
      attendanceResult.error.message ||
        "Unable to fetch leaderboard attendance.",
    );
  }

  const groupedAttendance = new Map<string, Set<string>>();
  const monthlyCounts = new Map<string, number>();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (const row of attendanceResult.data ?? []) {
    if (!row.user_id || !row.date) {
      continue;
    }

    const dates = groupedAttendance.get(row.user_id) ?? new Set<string>();
    dates.add(row.date);
    groupedAttendance.set(row.user_id, dates);

    const date = toLocalDate(row.date);
    if (date && date.getTime() >= thirtyDaysAgo.getTime()) {
      monthlyCounts.set(row.user_id, (monthlyCounts.get(row.user_id) ?? 0) + 1);
    }
  }

  const parseDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getCurrentStreak = (dateValues: string[]) => {
    if (dateValues.length === 0) {
      return 0;
    }

    const sortedDates = [...new Set(dateValues)].sort().reverse();
    const latestDate = parseDate(sortedDates[0]);
    const diffToToday = Math.floor(
      (today.getTime() - latestDate.getTime()) / DAY_MS,
    );

    for (let index = 1; index <= diffToToday; index += 1) {
      const checkDate = new Date(latestDate);
      checkDate.setDate(checkDate.getDate() + index);
      if (checkDate.getTime() < today.getTime() && checkDate.getDay() !== 0) {
        return 0;
      }
    }

    let streak = 1;
    for (let index = 0; index < sortedDates.length - 1; index += 1) {
      const currentDate = parseDate(sortedDates[index]);
      const nextDate = parseDate(sortedDates[index + 1]);
      const diffDays = Math.floor(
        (currentDate.getTime() - nextDate.getTime()) / DAY_MS,
      );

      if (diffDays === 1) {
        streak += 1;
        continue;
      }

      let sundayOnlyGap = true;
      for (let gap = 1; gap < diffDays; gap += 1) {
        const gapDate = new Date(nextDate);
        gapDate.setDate(gapDate.getDate() + gap);
        if (gapDate.getDay() !== 0) {
          sundayOnlyGap = false;
          break;
        }
      }

      if (sundayOnlyGap) {
        streak += 1;
      } else {
        break;
      }
    }

    return streak;
  };

  return (membersResult.data ?? [])
    .map((member: any) => {
      const attendanceDates = [
        ...(groupedAttendance.get(member.id) ?? new Set<string>()),
      ];
      const monthly = monthlyCounts.get(member.id) ?? 0;
      return {
        id: member.id,
        name: member.name ?? "Unknown",
        gender: (member.gender as Gender | null) ?? "",
        profilePicture: member.avatar_url ?? null,
        streak: getCurrentStreak(attendanceDates),
        monthly,
      };
    })
    .sort(
      (left, right) =>
        right.streak - left.streak ||
        right.monthly - left.monthly ||
        left.name.localeCompare(right.name),
    )
    .slice(0, 50)
    .map((member, index) => ({
      ...member,
      rank: index + 1,
      badge:
        member.monthly >= 25
          ? "Gold"
          : member.monthly >= 20
            ? "Silver"
            : member.monthly >= 15
              ? "Bronze"
              : null,
    }));
}

export async function fetchAllPushTokens() {
  const { data, error } = await supabase
    .from("push_tokens")
    .select("token")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to fetch push tokens", error);
    return [];
  }
  return data.map((d: any) => d.token);
}

export async function sendPushNotification(
  title: string,
  body: string,
  tokens: string[],
) {
  if (!tokens.length) return;
  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
  }));

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error("Failed to send push notification", err);
  }
}
