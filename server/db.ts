import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";
import * as schema from "../drizzle/schema";
import type { InsertUser } from "../drizzle/schema";
import { users } from "../drizzle/schema";

// ─── codex_portal connection (reads + writes) ─────────────────────────────────
const portalPool = mysql.createPool({
  uri: ENV.databaseUrl,
  waitForConnections: true,
  connectionLimit: 10,
});

export const db = drizzle(portalPool, { schema, mode: "default" });

// ─── Auth helpers (required by _core/sdk.ts) ──────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── tradinghq connection (read-only — never writes) ──────────────────────────
const tradinghqPool = mysql.createPool({
  uri: ENV.tradinghqDatabaseUrl || ENV.databaseUrl.replace(/\/[^/]+$/, "/tradinghq"),
  waitForConnections: true,
  connectionLimit: 5,
});

export const tradinghqDb = drizzle(tradinghqPool, { mode: "default" });

// ─── codex_portal query helpers ───────────────────────────────────────────────

export async function getVisualizations(weekOf?: string) {
  const rows = await portalPool.query(
    weekOf
      ? `SELECT * FROM visualizations WHERE week_of = ? ORDER BY category, id`
      : `SELECT * FROM visualizations ORDER BY week_of DESC, category, id`,
    weekOf ? [weekOf] : []
  );
  return (rows[0] as any[]);
}

export async function getVisualizationById(id: number) {
  const rows = await portalPool.query(
    `SELECT * FROM visualizations WHERE id = ?`,
    [id]
  );
  return (rows[0] as any[])[0] || null;
}

export async function insertVisualization(data: {
  category: string;
  chartType: string;
  title: string;
  imageUrl: string;
  aiNarration: string;
  aiPrediction: string;
  ttsAudioUrl?: string;
  sourceTable: string;
  weekOf: string;
  durationSeconds?: number;
}) {
  const result = await portalPool.query(
    `INSERT INTO visualizations (category, chart_type, title, image_url, ai_narration, ai_prediction, tts_audio_url, source_table, week_of, duration_seconds)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.category,
      data.chartType,
      data.title,
      data.imageUrl,
      data.aiNarration,
      data.aiPrediction,
      data.ttsAudioUrl || null,
      data.sourceTable,
      data.weekOf,
      data.durationSeconds || 45,
    ]
  );
  return (result[0] as any).insertId as number;
}

export async function updateVisualizationTts(id: number, ttsAudioUrl: string) {
  await portalPool.query(
    `UPDATE visualizations SET tts_audio_url = ? WHERE id = ?`,
    [ttsAudioUrl, id]
  );
}

export async function getMontages() {
  const rows = await portalPool.query(
    `SELECT * FROM montages ORDER BY week_of DESC`
  );
  return (rows[0] as any[]);
}

export async function getMontageById(id: number) {
  const rows = await portalPool.query(
    `SELECT * FROM montages WHERE id = ?`,
    [id]
  );
  return (rows[0] as any[])[0] || null;
}

export async function getMontageByWeek(weekOf: string) {
  const rows = await portalPool.query(
    `SELECT * FROM montages WHERE week_of = ?`,
    [weekOf]
  );
  return (rows[0] as any[])[0] || null;
}

export async function insertMontage(data: {
  weekOf: string;
  visualizationIds: number[];
  targetDurationSeconds?: number;
}) {
  const result = await portalPool.query(
    `INSERT INTO montages (week_of, visualization_ids, target_duration_seconds, status)
     VALUES (?, ?, ?, 'draft')`,
    [
      data.weekOf,
      JSON.stringify(data.visualizationIds),
      data.targetDurationSeconds || 480,
    ]
  );
  return (result[0] as any).insertId as number;
}

export async function updateMontage(id: number, updates: Record<string, any>) {
  const fields = Object.keys(updates)
    .map((k) => {
      const col = k.replace(/([A-Z])/g, "_$1").toLowerCase();
      return `\`${col}\` = ?`;
    })
    .join(", ");
  const values = Object.values(updates).map((v) =>
    typeof v === "object" && v !== null ? JSON.stringify(v) : v
  );
  await portalPool.query(
    `UPDATE montages SET ${fields} WHERE id = ?`,
    [...values, id]
  );
}

export async function getPublications(type?: string) {
  const rows = await portalPool.query(
    type
      ? `SELECT * FROM publications WHERE type = ? ORDER BY published_at DESC`
      : `SELECT * FROM publications ORDER BY published_at DESC`,
    type ? [type] : []
  );
  return (rows[0] as any[]);
}

export async function insertPublication(data: {
  type: string;
  title: string;
  url?: string;
  platform?: string;
  publishedAt: string;
  summary?: string;
  contentBody?: string;
  thumbnailUrl?: string;
  featured?: boolean;
}) {
  const result = await portalPool.query(
    `INSERT INTO publications (type, title, url, platform, published_at, summary, content_body, thumbnail_url, featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.type,
      data.title,
      data.url || null,
      data.platform || null,
      data.publishedAt,
      data.summary || null,
      data.contentBody || null,
      data.thumbnailUrl || null,
      data.featured ? 1 : 0,
    ]
  );
  return (result[0] as any).insertId as number;
}

export async function getContentDrafts(status?: string) {
  const rows = await portalPool.query(
    status
      ? `SELECT * FROM content_drafts WHERE status = ? ORDER BY created_at DESC`
      : `SELECT * FROM content_drafts ORDER BY created_at DESC`,
    status ? [status] : []
  );
  return (rows[0] as any[]);
}

export async function insertContentDraft(data: {
  montageId?: number;
  publicationId?: number;
  platform: string;
  draftCopy: string;
}) {
  const result = await portalPool.query(
    `INSERT INTO content_drafts (montage_id, publication_id, platform, draft_copy, status)
     VALUES (?, ?, ?, ?, 'draft')`,
    [data.montageId || null, data.publicationId || null, data.platform, data.draftCopy]
  );
  return (result[0] as any).insertId as number;
}

export async function updateContentDraftStatus(id: number, status: string, postId?: string) {
  await portalPool.query(
    `UPDATE content_drafts SET status = ?, post_id = ?, posted_at = ? WHERE id = ?`,
    [status, postId || null, status === "posted" ? new Date() : null, id]
  );
}

export async function getXOAuthToken() {
  const rows = await portalPool.query(
    `SELECT * FROM x_oauth_tokens ORDER BY created_at DESC LIMIT 1`
  );
  return (rows[0] as any[])[0] || null;
}

export async function upsertXOAuthToken(data: {
  accountHandle: string;
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  expiresAt?: Date;
}) {
  await portalPool.query(
    `INSERT INTO x_oauth_tokens (account_handle, access_token, refresh_token, scope, expires_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), refresh_token = VALUES(refresh_token),
     scope = VALUES(scope), expires_at = VALUES(expires_at), updated_at = NOW()`,
    [
      data.accountHandle,
      data.accessToken,
      data.refreshToken || null,
      data.scope || null,
      data.expiresAt || null,
    ]
  );
}

export async function getLatestPerformanceSnapshot() {
  const rows = await portalPool.query(
    `SELECT * FROM performance_snapshots ORDER BY snapshot_date DESC LIMIT 1`
  );
  return (rows[0] as any[])[0] || null;
}

// ─── tradinghq read helpers ───────────────────────────────────────────────────

export async function getLatestCandlesticks(pair: string = "btcusd", limit: number = 90) {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM candlesticks WHERE pair = ? ORDER BY timestamp DESC LIMIT ?`,
      [pair, limit]
    );
    return (rows[0] as any[]).reverse();
  } catch {
    return [];
  }
}

export async function getLatestFactorSnapshots(limit: number = 10) {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM factor_snapshots ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    return (rows[0] as any[]);
  } catch {
    return [];
  }
}

export async function getFactorBacktestResults() {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM factor_backtest_results ORDER BY accuracy DESC`
    );
    return (rows[0] as any[]);
  } catch {
    return [];
  }
}

export async function getLatestBacktestResults(limit: number = 1) {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM backtest_results ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    return (rows[0] as any[]);
  } catch {
    return [];
  }
}

export async function getRecentSignalHistory(limit: number = 50) {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM signal_history ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    return (rows[0] as any[]);
  } catch {
    return [];
  }
}

export async function getLatestSentimentSnapshot() {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM sentiment_snapshots ORDER BY created_at DESC LIMIT 30`
    );
    return (rows[0] as any[]);
  } catch {
    return [];
  }
}

export async function getRecentEtfFlows(limit: number = 30) {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM etf_flows ORDER BY date DESC LIMIT ?`,
      [limit]
    );
    return (rows[0] as any[]).reverse();
  } catch {
    return [];
  }
}

export async function getSignalFlipEvents(limit: number = 20) {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM signal_flip_events ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    return (rows[0] as any[]);
  } catch {
    return [];
  }
}
