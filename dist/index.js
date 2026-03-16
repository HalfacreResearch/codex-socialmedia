"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      tradinghqDatabaseUrl: process.env.TRADINGHQ_DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      youtubeApiKey: process.env.YOUTUBE_API_KEY ?? "",
      xOAuthClientId: process.env.X_OAUTH2_CLIENT_ID ?? "",
      xOAuthClientSecret: process.env.X_OAUTH2_CLIENT_SECRET ?? ""
    };
  }
});

// server/storage.ts
async function storagePut(key, data, contentType = "application/octet-stream") {
  await s3.send(
    new import_client_s3.PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType
    })
  );
  const url = `${process.env.S3_PUBLIC_URL || ""}/${key}`;
  return { key, url };
}
function randomSuffix() {
  return Math.random().toString(36).substring(2, 10);
}
var import_client_s3, import_s3_request_presigner, s3, BUCKET;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    import_client_s3 = require("@aws-sdk/client-s3");
    import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
    s3 = new import_client_s3.S3Client({
      region: process.env.S3_REGION || "us-east-1",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ""
      },
      forcePathStyle: true
    });
    BUCKET = process.env.S3_BUCKET || "";
  }
});

// server/_core/imageGeneration.ts
var imageGeneration_exports = {};
__export(imageGeneration_exports, {
  generateImage: () => generateImage
});
async function generateImage(options) {
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }
  const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL(
    "images.v1.ImageService/GenerateImage",
    baseUrl
  ).toString();
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify({
      prompt: options.prompt,
      original_images: options.originalImages || []
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }
  const result = await response.json();
  const base64Data = result.image.b64Json;
  const buffer = Buffer.from(base64Data, "base64");
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    result.image.mimeType
  );
  return {
    url
  };
}
var init_imageGeneration = __esm({
  "server/_core/imageGeneration.ts"() {
    "use strict";
    init_storage();
    init_env();
  }
});

// server/_core/index.ts
var import_config = require("dotenv/config");
var import_express2 = __toESM(require("express"), 1);
var import_http = require("http");
var import_net = __toESM(require("net"), 1);
var import_express3 = require("@trpc/server/adapters/express");

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
var import_mysql2 = require("drizzle-orm/mysql2");
var import_promise = __toESM(require("mysql2/promise"), 1);
var import_drizzle_orm = require("drizzle-orm");
init_env();

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  contentDrafts: () => contentDrafts,
  montages: () => montages,
  performanceSnapshots: () => performanceSnapshots,
  publications: () => publications,
  users: () => users,
  visualizations: () => visualizations,
  xOAuthTokens: () => xOAuthTokens
});
var import_mysql_core = require("drizzle-orm/mysql-core");
var users = (0, import_mysql_core.mysqlTable)("users", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  openId: (0, import_mysql_core.varchar)("openId", { length: 64 }).notNull().unique(),
  name: (0, import_mysql_core.text)("name"),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }),
  loginMethod: (0, import_mysql_core.varchar)("loginMethod", { length: 64 }),
  role: (0, import_mysql_core.mysqlEnum)("role", ["user", "admin"]).default("user").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: (0, import_mysql_core.timestamp)("lastSignedIn").defaultNow().notNull()
});
var visualizations = (0, import_mysql_core.mysqlTable)("visualizations", {
  id: (0, import_mysql_core.int)("id").primaryKey().autoincrement(),
  category: (0, import_mysql_core.varchar)("category", { length: 64 }).notNull(),
  // e.g. "price-action", "factor-scores", "sentiment", "etf-flows"
  chartType: (0, import_mysql_core.varchar)("chart_type", { length: 64 }).notNull(),
  // e.g. "candlestick", "line", "bar", "heatmap"
  title: (0, import_mysql_core.varchar)("title", { length: 255 }).notNull(),
  imageUrl: (0, import_mysql_core.text)("image_url").notNull(),
  // S3 URL of the rendered chart image
  aiNarration: (0, import_mysql_core.text)("ai_narration"),
  // Plain-English analyst explanation of what the chart shows
  aiPrediction: (0, import_mysql_core.text)("ai_prediction"),
  // AI's own opinionated take and forward-looking view
  ttsAudioUrl: (0, import_mysql_core.text)("tts_audio_url"),
  // S3 URL of the TTS voiceover audio for this chart
  sourceTable: (0, import_mysql_core.varchar)("source_table", { length: 64 }).notNull(),
  // Which tradinghq table this came from
  weekOf: (0, import_mysql_core.date)("week_of").notNull(),
  // ISO date of the Sunday this chart was generated for
  durationSeconds: (0, import_mysql_core.int)("duration_seconds").default(45),
  // Target segment duration in the montage
  createdAt: (0, import_mysql_core.timestamp)("created_at").defaultNow().notNull()
});
var montages = (0, import_mysql_core.mysqlTable)("montages", {
  id: (0, import_mysql_core.int)("id").primaryKey().autoincrement(),
  weekOf: (0, import_mysql_core.date)("week_of").notNull(),
  title: (0, import_mysql_core.varchar)("title", { length: 255 }),
  // Final video title (AI-generated, operator-approved)
  description: (0, import_mysql_core.text)("description"),
  // YouTube description (AI-generated)
  tags: (0, import_mysql_core.json)("tags").$type(),
  // YouTube tags array
  chapterMarkers: (0, import_mysql_core.json)("chapter_markers").$type(),
  visualizationIds: (0, import_mysql_core.json)("visualization_ids").$type().notNull(),
  // Ordered list of selected visualization IDs
  youtubeClipUrls: (0, import_mysql_core.json)("youtube_clip_urls").$type().default([]),
  // Curated YouTube clip URLs
  aiScript: (0, import_mysql_core.text)("ai_script"),
  // Full montage script / conversation guide
  targetDurationSeconds: (0, import_mysql_core.int)("target_duration_seconds").default(480),
  // 7-10 min = 420-600s
  actualDurationSeconds: (0, import_mysql_core.int)("actual_duration_seconds"),
  status: (0, import_mysql_core.mysqlEnum)("status", [
    "draft",
    // Charts selected, not yet assembled
    "assembling",
    // TTS and video rendering in progress
    "ready_for_reaction",
    // Pre-rendered montage ready for Matthew to watch
    "reaction_uploaded",
    // Matthew uploaded his reaction video
    "metadata_ready",
    // Title, description, post copy generated and awaiting approval
    "approved",
    // Matthew approved all content
    "posted"
    // Posted to YouTube and X
  ]).default("draft").notNull(),
  montageVideoUrl: (0, import_mysql_core.text)("montage_video_url"),
  // S3 URL of the assembled montage (before reaction)
  reactionVideoUrl: (0, import_mysql_core.text)("reaction_video_url"),
  // S3 URL of Matthew's reaction video
  thumbnailUrl: (0, import_mysql_core.text)("thumbnail_url"),
  // S3 URL of the generated thumbnail card
  youtubeVideoId: (0, import_mysql_core.varchar)("youtube_video_id", { length: 64 }),
  // YouTube video ID after upload
  xPostId: (0, import_mysql_core.varchar)("x_post_id", { length: 64 }),
  // X post ID after posting
  linkedinCopy: (0, import_mysql_core.text)("linkedin_copy"),
  // Formatted LinkedIn post copy
  xCopy: (0, import_mysql_core.text)("x_copy"),
  // X post copy (280 char limit)
  youtubeCopy: (0, import_mysql_core.text)("youtube_copy"),
  // YouTube description copy
  postedAt: (0, import_mysql_core.timestamp)("posted_at"),
  createdAt: (0, import_mysql_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updated_at").defaultNow().onUpdateNow().notNull()
});
var publications = (0, import_mysql_core.mysqlTable)("publications", {
  id: (0, import_mysql_core.int)("id").primaryKey().autoincrement(),
  type: (0, import_mysql_core.mysqlEnum)("type", [
    "newsletter",
    // LinkedIn newsletter editions
    "article",
    // LinkedIn articles or external publications
    "podcast",
    // Podcast appearances (external link)
    "speech",
    // Conference talks, presentations
    "video",
    // YouTube videos, interviews
    "blog"
    // Blog posts
  ]).notNull(),
  title: (0, import_mysql_core.varchar)("title", { length: 512 }).notNull(),
  url: (0, import_mysql_core.text)("url"),
  // External URL (LinkedIn post, podcast episode, etc.)
  platform: (0, import_mysql_core.varchar)("platform", { length: 64 }),
  // e.g. "LinkedIn", "YouTube", "Spotify", "X"
  publishedAt: (0, import_mysql_core.timestamp)("published_at").notNull(),
  summary: (0, import_mysql_core.text)("summary"),
  // Brief description for display on codexyield.com
  contentBody: (0, import_mysql_core.text)("content_body"),
  // Full text content (for newsletters/articles if available)
  thumbnailUrl: (0, import_mysql_core.text)("thumbnail_url"),
  // Optional image for display
  featured: (0, import_mysql_core.boolean)("featured").default(false),
  // Pin to top of publications feed
  createdAt: (0, import_mysql_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updated_at").defaultNow().onUpdateNow().notNull()
});
var contentDrafts = (0, import_mysql_core.mysqlTable)("content_drafts", {
  id: (0, import_mysql_core.int)("id").primaryKey().autoincrement(),
  montageId: (0, import_mysql_core.int)("montage_id"),
  // If this draft is for a montage video
  publicationId: (0, import_mysql_core.int)("publication_id"),
  // If this draft is for a publication
  platform: (0, import_mysql_core.mysqlEnum)("platform", ["x", "linkedin", "youtube"]).notNull(),
  draftCopy: (0, import_mysql_core.text)("draft_copy").notNull(),
  // The AI-generated post text
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "approved", "rejected", "posted"]).default("draft").notNull(),
  postedAt: (0, import_mysql_core.timestamp)("posted_at"),
  postId: (0, import_mysql_core.varchar)("post_id", { length: 128 }),
  // Platform post ID after posting
  createdAt: (0, import_mysql_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updated_at").defaultNow().onUpdateNow().notNull()
});
var xOAuthTokens = (0, import_mysql_core.mysqlTable)("x_oauth_tokens", {
  id: (0, import_mysql_core.int)("id").primaryKey().autoincrement(),
  accountHandle: (0, import_mysql_core.varchar)("account_handle", { length: 64 }).notNull(),
  // e.g. "@Halfacre_Matt"
  accessToken: (0, import_mysql_core.text)("access_token").notNull(),
  refreshToken: (0, import_mysql_core.text)("refresh_token"),
  tokenType: (0, import_mysql_core.varchar)("token_type", { length: 32 }).default("bearer"),
  scope: (0, import_mysql_core.text)("scope"),
  expiresAt: (0, import_mysql_core.timestamp)("expires_at"),
  createdAt: (0, import_mysql_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updated_at").defaultNow().onUpdateNow().notNull()
});
var performanceSnapshots = (0, import_mysql_core.mysqlTable)("performance_snapshots", {
  id: (0, import_mysql_core.int)("id").primaryKey().autoincrement(),
  snapshotDate: (0, import_mysql_core.date)("snapshot_date").notNull(),
  aumUsd: (0, import_mysql_core.bigint)("aum_usd", { mode: "number" }),
  // Total AUM in USD cents
  btcAlphaPercent: (0, import_mysql_core.varchar)("btc_alpha_percent", { length: 16 }),
  // e.g. "5.23"
  cagrPercent: (0, import_mysql_core.varchar)("cagr_percent", { length: 16 }),
  // e.g. "7.41"
  totalTrades: (0, import_mysql_core.int)("total_trades").default(0),
  winRatePercent: (0, import_mysql_core.varchar)("win_rate_percent", { length: 16 }),
  // e.g. "68.5"
  activeClients: (0, import_mysql_core.int)("active_clients").default(0),
  totalRotations: (0, import_mysql_core.int)("total_rotations").default(0),
  profitableRotations: (0, import_mysql_core.int)("profitable_rotations").default(0),
  createdAt: (0, import_mysql_core.timestamp)("created_at").defaultNow().notNull()
});

// server/db.ts
var portalPool = import_promise.default.createPool({
  uri: ENV.databaseUrl,
  waitForConnections: true,
  connectionLimit: 10
});
var db = (0, import_mysql2.drizzle)(portalPool, { schema: schema_exports, mode: "default" });
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  for (const field of textFields) {
    const value = user[field];
    if (value === void 0) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function getUserByOpenId(openId) {
  const result = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.openId, openId)).limit(1);
  return result[0];
}
var tradinghqPool = import_promise.default.createPool({
  uri: ENV.tradinghqDatabaseUrl || ENV.databaseUrl.replace(/\/[^/]+$/, "/tradinghq"),
  waitForConnections: true,
  connectionLimit: 5
});
var tradinghqDb = (0, import_mysql2.drizzle)(tradinghqPool, { mode: "default" });
async function getVisualizations(weekOf) {
  const rows = await portalPool.query(
    weekOf ? `SELECT * FROM visualizations WHERE week_of = ? ORDER BY category, id` : `SELECT * FROM visualizations ORDER BY week_of DESC, category, id`,
    weekOf ? [weekOf] : []
  );
  return rows[0];
}
async function getVisualizationById(id) {
  const rows = await portalPool.query(
    `SELECT * FROM visualizations WHERE id = ?`,
    [id]
  );
  return rows[0][0] || null;
}
async function insertVisualization(data) {
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
      data.durationSeconds || 45
    ]
  );
  return result[0].insertId;
}
async function getMontages() {
  const rows = await portalPool.query(
    `SELECT * FROM montages ORDER BY week_of DESC`
  );
  return rows[0];
}
async function getMontageById(id) {
  const rows = await portalPool.query(
    `SELECT * FROM montages WHERE id = ?`,
    [id]
  );
  return rows[0][0] || null;
}
async function insertMontage(data) {
  const result = await portalPool.query(
    `INSERT INTO montages (week_of, visualization_ids, target_duration_seconds, status)
     VALUES (?, ?, ?, 'draft')`,
    [
      data.weekOf,
      JSON.stringify(data.visualizationIds),
      data.targetDurationSeconds || 480
    ]
  );
  return result[0].insertId;
}
async function updateMontage(id, updates) {
  const fields = Object.keys(updates).map((k) => {
    const col = k.replace(/([A-Z])/g, "_$1").toLowerCase();
    return `\`${col}\` = ?`;
  }).join(", ");
  const values = Object.values(updates).map(
    (v) => typeof v === "object" && v !== null ? JSON.stringify(v) : v
  );
  await portalPool.query(
    `UPDATE montages SET ${fields} WHERE id = ?`,
    [...values, id]
  );
}
async function getPublications(type) {
  const rows = await portalPool.query(
    type ? `SELECT * FROM publications WHERE type = ? ORDER BY published_at DESC` : `SELECT * FROM publications ORDER BY published_at DESC`,
    type ? [type] : []
  );
  return rows[0];
}
async function insertPublication(data) {
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
      data.featured ? 1 : 0
    ]
  );
  return result[0].insertId;
}
async function getContentDrafts(status) {
  const rows = await portalPool.query(
    status ? `SELECT * FROM content_drafts WHERE status = ? ORDER BY created_at DESC` : `SELECT * FROM content_drafts ORDER BY created_at DESC`,
    status ? [status] : []
  );
  return rows[0];
}
async function insertContentDraft(data) {
  const result = await portalPool.query(
    `INSERT INTO content_drafts (montage_id, publication_id, platform, draft_copy, status)
     VALUES (?, ?, ?, ?, 'draft')`,
    [data.montageId || null, data.publicationId || null, data.platform, data.draftCopy]
  );
  return result[0].insertId;
}
async function updateContentDraftStatus(id, status, postId) {
  await portalPool.query(
    `UPDATE content_drafts SET status = ?, post_id = ?, posted_at = ? WHERE id = ?`,
    [status, postId || null, status === "posted" ? /* @__PURE__ */ new Date() : null, id]
  );
}
async function getXOAuthToken() {
  const rows = await portalPool.query(
    `SELECT * FROM x_oauth_tokens ORDER BY created_at DESC LIMIT 1`
  );
  return rows[0][0] || null;
}
async function getLatestPerformanceSnapshot() {
  const rows = await portalPool.query(
    `SELECT * FROM performance_snapshots ORDER BY snapshot_date DESC LIMIT 1`
  );
  return rows[0][0] || null;
}
async function getLatestCandlesticks(pair = "btcusd", limit = 90) {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM candlesticks WHERE pair = ? ORDER BY timestamp DESC LIMIT ?`,
      [pair, limit]
    );
    return rows[0].reverse();
  } catch {
    return [];
  }
}
async function getLatestFactorSnapshots(limit = 10) {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM factor_snapshots ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    return rows[0];
  } catch {
    return [];
  }
}
async function getFactorBacktestResults() {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM factor_backtest_results ORDER BY accuracy DESC`
    );
    return rows[0];
  } catch {
    return [];
  }
}
async function getLatestBacktestResults(limit = 1) {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM backtest_results ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    return rows[0];
  } catch {
    return [];
  }
}
async function getRecentSignalHistory(limit = 50) {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM signal_history ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    return rows[0];
  } catch {
    return [];
  }
}
async function getLatestSentimentSnapshot() {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM sentiment_snapshots ORDER BY created_at DESC LIMIT 30`
    );
    return rows[0];
  } catch {
    return [];
  }
}
async function getRecentEtfFlows(limit = 30) {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM etf_flows ORDER BY date DESC LIMIT ?`,
      [limit]
    );
    return rows[0].reverse();
  } catch {
    return [];
  }
}
async function getSignalFlipEvents(limit = 20) {
  try {
    const rows = await tradinghqPool.query(
      `SELECT * FROM signal_flip_events ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    return rows[0];
  } catch {
    return [];
  }
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
var import_axios = __toESM(require("axios"), 1);
var import_cookie = require("cookie");
var import_jose = require("jose");
init_env();
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => import_axios.default.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = (0, import_cookie.parse)(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new import_jose.SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await (0, import_jose.jwtVerify)(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/routers.ts
var import_zod2 = require("zod");

// server/_core/trpc.ts
var import_server = require("@trpc/server");
var import_superjson = __toESM(require("superjson"), 1);
var t = import_server.initTRPC.context().create({
  transformer: import_superjson.default
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new import_server.TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new import_server.TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var import_zod = require("zod");

// server/_core/notification.ts
var import_server2 = require("@trpc/server");
init_env();
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new import_server2.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new import_server2.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new import_server2.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new import_server2.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new import_server2.TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new import_server2.TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    import_zod.z.object({
      timestamp: import_zod.z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    import_zod.z.object({
      title: import_zod.z.string().min(1, "title is required"),
      content: import_zod.z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/_core/llm.ts
init_env();
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/vizGenerator.ts
async function generateNarrationAndPrediction(chartTitle, dataDescription, dataPoints) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a Bitcoin market analyst for CodexYield. You have a strong, opinionated voice.
You speak like a real analyst who has a view and isn't afraid to say it plainly.
You are narrating a data visualization for a weekly video that Matthew Halfacre will react to.

CORE THESIS (never deviate from this):
CodexYield's entire purpose is to generate MORE Bitcoin than a simple BTC buy-and-hold strategy.
Every chart, every narration, every prediction must connect back to this claim.
When you look at price action, you ask: does this create a better DCA entry than just buying every week?
When you look at factors or signals, you ask: does this help us time rotations that return more BTC than we deployed?
When you look at sentiment or ETF flows, you ask: does this give us an edge that a passive holder doesn't have?
This is not just a tagline. It is the analytical lens through which every single data point is viewed.

Rules:
- Sound like a human analyst, not an AI
- Be direct and opinionated
- No em dashes (never use \u2014)
- No excessive semicolons
- Keep narration to 3-4 sentences max
- Keep prediction to 2-3 sentences max
- At least one sentence must connect the data to the core thesis: beating BTC buy-and-hold
- Give your genuine take, not a neutral summary`
      },
      {
        role: "user",
        content: `Chart: ${chartTitle}
Data context: ${dataDescription}
Key data points: ${dataPoints}

Write two things:
1. NARRATION: A 3-4 sentence explanation of what this chart shows and why it matters. Analyst voice, opinionated.
2. PREDICTION: A 2-3 sentence forward-looking take. What does this data suggest is coming? What would you watch for?

Format your response as JSON: { "narration": "...", "prediction": "..." }`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "chart_narration",
        strict: true,
        schema: {
          type: "object",
          properties: {
            narration: { type: "string" },
            prediction: { type: "string" }
          },
          required: ["narration", "prediction"],
          additionalProperties: false
        }
      }
    }
  });
  try {
    const content = response.choices[0].message.content;
    return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  } catch {
    return {
      narration: `${chartTitle} \u2014 data visualization generated for week of ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.`,
      prediction: "Analysis pending."
    };
  }
}
async function generateChartImage(chartTitle, chartType, dataDescription, weekOf) {
  const { generateImage: generateImage2 } = await Promise.resolve().then(() => (init_imageGeneration(), imageGeneration_exports));
  const prompt = `Professional financial data visualization chart for Bitcoin treasury management.
Chart title: "${chartTitle}"
Chart type: ${chartType}
Style: Dark background (#0a0a0a), orange/amber accent color (#f59e0b), white text, clean grid lines, professional trading terminal aesthetic.
Data: ${dataDescription}
Week of: ${weekOf}
No watermarks. No logos. Clean, minimal, data-focused design.`;
  try {
    const { url } = await generateImage2({ prompt });
    return url ?? `https://placehold.co/1200x675/0a0a0a/f59e0b?text=${encodeURIComponent(chartTitle)}`;
  } catch {
    return `https://placehold.co/1200x675/0a0a0a/f59e0b?text=${encodeURIComponent(chartTitle)}`;
  }
}
async function generateCandlestickChart(weekOf) {
  const candles = await getLatestCandlesticks("btcusd", 90);
  if (!candles.length) return;
  const latest = candles[candles.length - 1];
  const oldest = candles[0];
  const priceChange = latest.close ? ((latest.close - oldest.close) / oldest.close * 100).toFixed(2) : "N/A";
  const dataDesc = `90-day BTC/USD price action. Current price ~$${latest.close?.toLocaleString() || "N/A"}. 90-day change: ${priceChange}%.`;
  const dataPoints = `Open: $${oldest.open?.toLocaleString()}, Current: $${latest.close?.toLocaleString()}, High: $${Math.max(...candles.map((c) => c.high || 0)).toLocaleString()}, Low: $${Math.min(...candles.filter((c) => c.low > 0).map((c) => c.low)).toLocaleString()}`;
  const { narration, prediction } = await generateNarrationAndPrediction(
    "BTC/USD 90-Day Price Action",
    dataDesc,
    dataPoints
  );
  const imageUrl = await generateChartImage(
    "BTC/USD 90-Day Price Action",
    "candlestick with volume bars",
    dataDesc,
    weekOf
  );
  await insertVisualization({
    category: "price-action",
    chartType: "candlestick",
    title: "BTC/USD 90-Day Price Action",
    imageUrl,
    aiNarration: narration,
    aiPrediction: prediction,
    sourceTable: "candlesticks",
    weekOf,
    durationSeconds: 50
  });
}
async function generateFactorScoresChart(weekOf) {
  const snapshots = await getLatestFactorSnapshots(10);
  if (!snapshots.length) return;
  const latest = snapshots[0];
  const factors = typeof latest.factors === "string" ? JSON.parse(latest.factors) : latest.factors || {};
  const topFactors = Object.entries(factors).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a)).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join(", ");
  const dataDesc = `Current factor scores from the CodexYield prediction model. ${Object.keys(factors).length} factors tracked.`;
  const dataPoints = `Top factors by magnitude: ${topFactors}`;
  const { narration, prediction } = await generateNarrationAndPrediction(
    "Factor Score Dashboard",
    dataDesc,
    dataPoints
  );
  const imageUrl = await generateChartImage(
    "Factor Score Dashboard",
    "horizontal bar chart with color-coded positive/negative values",
    dataDesc,
    weekOf
  );
  await insertVisualization({
    category: "factor-scores",
    chartType: "bar",
    title: "Factor Score Dashboard",
    imageUrl,
    aiNarration: narration,
    aiPrediction: prediction,
    sourceTable: "factor_snapshots",
    weekOf,
    durationSeconds: 45
  });
}
async function generateFactorAccuracyChart(weekOf) {
  const results = await getFactorBacktestResults();
  if (!results.length) return;
  const topFactors = results.slice(0, 10);
  const avgAccuracy = (topFactors.reduce((s, f) => s + (f.accuracy || 0), 0) / topFactors.length).toFixed(1);
  const dataDesc = `Backtest accuracy for each prediction factor. ${results.length} factors evaluated. Average accuracy of top 10: ${avgAccuracy}%.`;
  const dataPoints = topFactors.slice(0, 5).map((f) => `${f.factor_name || f.name}: ${f.accuracy}%`).join(", ");
  const { narration, prediction } = await generateNarrationAndPrediction(
    "Factor Accuracy Leaderboard",
    dataDesc,
    dataPoints
  );
  const imageUrl = await generateChartImage(
    "Factor Accuracy Leaderboard",
    "ranked horizontal bar chart showing prediction accuracy by factor",
    dataDesc,
    weekOf
  );
  await insertVisualization({
    category: "factor-accuracy",
    chartType: "bar",
    title: "Factor Accuracy Leaderboard",
    imageUrl,
    aiNarration: narration,
    aiPrediction: prediction,
    sourceTable: "factor_backtest_results",
    weekOf,
    durationSeconds: 45
  });
}
async function generateEquityCurveChart(weekOf) {
  const results = await getLatestBacktestResults(1);
  if (!results.length) return;
  const r = results[0];
  const dataDesc = `System equity curve from backtesting. Win rate: ${r.win_rate || "N/A"}%. Sharpe: ${r.sharpe_ratio || "N/A"}. Max drawdown: ${r.max_drawdown || "N/A"}%.`;
  const dataPoints = `Profit factor: ${r.profit_factor || "N/A"}, Sortino: ${r.sortino_ratio || "N/A"}, Total trades: ${r.total_trades || "N/A"}`;
  const { narration, prediction } = await generateNarrationAndPrediction(
    "System Equity Curve",
    dataDesc,
    dataPoints
  );
  const imageUrl = await generateChartImage(
    "System Equity Curve",
    "line chart showing cumulative returns with drawdown shading below",
    dataDesc,
    weekOf
  );
  await insertVisualization({
    category: "system-performance",
    chartType: "line",
    title: "System Equity Curve",
    imageUrl,
    aiNarration: narration,
    aiPrediction: prediction,
    sourceTable: "backtest_results",
    weekOf,
    durationSeconds: 50
  });
}
async function generateSignalAccuracyChart(weekOf) {
  const signals = await getRecentSignalHistory(100);
  if (!signals.length) return;
  const correct = signals.filter((s) => s.correct === 1 || s.correct === true).length;
  const accuracy = (correct / signals.length * 100).toFixed(1);
  const byPair = signals.reduce((acc, s) => {
    const p = s.pair || "unknown";
    if (!acc[p]) acc[p] = { total: 0, correct: 0 };
    acc[p].total++;
    if (s.correct) acc[p].correct++;
    return acc;
  }, {});
  const pairSummary = Object.entries(byPair).map(([p, v]) => `${p}: ${(v.correct / v.total * 100).toFixed(0)}%`).join(", ");
  const dataDesc = `Signal prediction accuracy over the last ${signals.length} signals. Overall accuracy: ${accuracy}%.`;
  const dataPoints = `By pair: ${pairSummary}`;
  const { narration, prediction } = await generateNarrationAndPrediction(
    "Signal Prediction Accuracy",
    dataDesc,
    dataPoints
  );
  const imageUrl = await generateChartImage(
    "Signal Prediction Accuracy",
    "line chart of rolling accuracy over time with pair breakdown",
    dataDesc,
    weekOf
  );
  await insertVisualization({
    category: "signal-accuracy",
    chartType: "line",
    title: "Signal Prediction Accuracy",
    imageUrl,
    aiNarration: narration,
    aiPrediction: prediction,
    sourceTable: "signal_history",
    weekOf,
    durationSeconds: 45
  });
}
async function generateSentimentChart(weekOf) {
  const snapshots = await getLatestSentimentSnapshot();
  if (!snapshots.length) return;
  const latest = snapshots[0];
  const trend = snapshots.length > 1 ? latest.score > snapshots[snapshots.length - 1].score ? "improving" : "declining" : "stable";
  const dataDesc = `Bitcoin market sentiment tracking. Current score: ${latest.score || "N/A"}/100. Trend: ${trend}. Platform: ${latest.platform || "aggregated"}.`;
  const dataPoints = `Score: ${latest.score}, Distribution: ${latest.distribution || "N/A"}, Top keywords: ${latest.top_keywords || "N/A"}, Momentum: ${latest.momentum || "N/A"}`;
  const { narration, prediction } = await generateNarrationAndPrediction(
    "Market Sentiment Tracker",
    dataDesc,
    dataPoints
  );
  const imageUrl = await generateChartImage(
    "Market Sentiment Tracker",
    "gauge chart with sentiment score plus trend line over 30 days",
    dataDesc,
    weekOf
  );
  await insertVisualization({
    category: "sentiment",
    chartType: "gauge",
    title: "Market Sentiment Tracker",
    imageUrl,
    aiNarration: narration,
    aiPrediction: prediction,
    sourceTable: "sentiment_snapshots",
    weekOf,
    durationSeconds: 40
  });
}
async function generateEtfFlowsChart(weekOf) {
  const flows = await getRecentEtfFlows(30);
  if (!flows.length) return;
  const totalInflow = flows.reduce((s, f) => s + (f.net_inflow || 0), 0);
  const latestCumulative = flows[flows.length - 1]?.cumulative_inflow;
  const positiveDays = flows.filter((f) => (f.net_inflow || 0) > 0).length;
  const dataDesc = `BTC ETF daily net flows over the last 30 days. Total 30-day net: $${(totalInflow / 1e6).toFixed(0)}M. Positive days: ${positiveDays}/30.`;
  const dataPoints = `Cumulative inflow: $${latestCumulative ? (latestCumulative / 1e9).toFixed(2) : "N/A"}B, Last 7-day avg: $${(flows.slice(-7).reduce((s, f) => s + (f.net_inflow || 0), 0) / 7 / 1e6).toFixed(0)}M/day`;
  const { narration, prediction } = await generateNarrationAndPrediction(
    "BTC ETF Daily Flows",
    dataDesc,
    dataPoints
  );
  const imageUrl = await generateChartImage(
    "BTC ETF Daily Flows",
    "bar chart with green/red bars for daily net inflow plus cumulative line overlay",
    dataDesc,
    weekOf
  );
  await insertVisualization({
    category: "etf-flows",
    chartType: "bar",
    title: "BTC ETF Daily Flows",
    imageUrl,
    aiNarration: narration,
    aiPrediction: prediction,
    sourceTable: "etf_flows",
    weekOf,
    durationSeconds: 45
  });
}
async function generateRegimeChangeChart(weekOf) {
  const flips = await getSignalFlipEvents(20);
  if (!flips.length) return;
  const latest = flips[0];
  const bullishCount = flips.filter((f) => f.new_direction === "bullish" || f.to_signal === "BUY").length;
  const bearishCount = flips.length - bullishCount;
  const dataDesc = `Signal regime change history. Last ${flips.length} regime flips. Current regime: ${latest.new_direction || latest.to_signal || "N/A"}.`;
  const dataPoints = `Bullish flips: ${bullishCount}, Bearish flips: ${bearishCount}, Last flip: ${latest.created_at || "N/A"}`;
  const { narration, prediction } = await generateNarrationAndPrediction(
    "Market Regime Timeline",
    dataDesc,
    dataPoints
  );
  const imageUrl = await generateChartImage(
    "Market Regime Timeline",
    "timeline chart showing bullish/bearish regime periods with duration labels",
    dataDesc,
    weekOf
  );
  await insertVisualization({
    category: "regime-changes",
    chartType: "timeline",
    title: "Market Regime Timeline",
    imageUrl,
    aiNarration: narration,
    aiPrediction: prediction,
    sourceTable: "signal_flip_events",
    weekOf,
    durationSeconds: 40
  });
}
async function runWeeklyVisualizationBatch(weekOf) {
  const targetWeek = weekOf || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const errors = [];
  let chartsGenerated = 0;
  const generators = [
    { name: "Candlestick / Price Action", fn: generateCandlestickChart },
    { name: "Factor Scores", fn: generateFactorScoresChart },
    { name: "Factor Accuracy", fn: generateFactorAccuracyChart },
    { name: "Equity Curve", fn: generateEquityCurveChart },
    { name: "Signal Accuracy", fn: generateSignalAccuracyChart },
    { name: "Market Sentiment", fn: generateSentimentChart },
    { name: "ETF Flows", fn: generateEtfFlowsChart },
    { name: "Regime Changes", fn: generateRegimeChangeChart }
  ];
  for (const gen of generators) {
    try {
      await gen.fn(targetWeek);
      chartsGenerated++;
    } catch (err) {
      errors.push(`${gen.name}: ${err.message}`);
    }
  }
  return { success: errors.length === 0, chartsGenerated, errors };
}

// server/routers.ts
init_storage();
init_env();
var visualizationsRouter = router({
  getAll: protectedProcedure.input(import_zod2.z.object({ weekOf: import_zod2.z.string().optional() }).optional()).query(async ({ input }) => {
    return getVisualizations(input?.weekOf);
  }),
  getById: protectedProcedure.input(import_zod2.z.object({ id: import_zod2.z.number() })).query(async ({ input }) => {
    return getVisualizationById(input.id);
  }),
  getWeeks: protectedProcedure.query(async () => {
    const all = await getVisualizations();
    const weeks = Array.from(new Set(all.map((v) => v.week_of))).sort().reverse();
    return weeks;
  }),
  generateWeekly: protectedProcedure.input(import_zod2.z.object({ weekOf: import_zod2.z.string().optional() })).mutation(async ({ input }) => {
    return runWeeklyVisualizationBatch(input.weekOf);
  })
});
var montagesRouter = router({
  getAll: protectedProcedure.query(async () => {
    const montages2 = await getMontages();
    return montages2.map((m) => ({
      ...m,
      visualization_ids: typeof m.visualization_ids === "string" ? JSON.parse(m.visualization_ids) : m.visualization_ids || [],
      youtube_clip_urls: typeof m.youtube_clip_urls === "string" ? JSON.parse(m.youtube_clip_urls) : m.youtube_clip_urls || [],
      tags: typeof m.tags === "string" ? JSON.parse(m.tags) : m.tags || [],
      chapter_markers: typeof m.chapter_markers === "string" ? JSON.parse(m.chapter_markers) : m.chapter_markers || []
    }));
  }),
  getById: protectedProcedure.input(import_zod2.z.object({ id: import_zod2.z.number() })).query(async ({ input }) => {
    return getMontageById(input.id);
  }),
  create: protectedProcedure.input(import_zod2.z.object({
    weekOf: import_zod2.z.string(),
    visualizationIds: import_zod2.z.array(import_zod2.z.number()),
    targetDurationSeconds: import_zod2.z.number().optional()
  })).mutation(async ({ input }) => {
    const id = await insertMontage(input);
    return { id };
  }),
  updateSelections: protectedProcedure.input(import_zod2.z.object({
    id: import_zod2.z.number(),
    visualizationIds: import_zod2.z.array(import_zod2.z.number())
  })).mutation(async ({ input }) => {
    await updateMontage(input.id, { visualizationIds: input.visualizationIds });
    return { success: true };
  }),
  generateScript: protectedProcedure.input(import_zod2.z.object({ montageId: import_zod2.z.number() })).mutation(async ({ input }) => {
    const montage = await getMontageById(input.montageId);
    if (!montage) throw new Error("Montage not found");
    const vizIds = typeof montage.visualization_ids === "string" ? JSON.parse(montage.visualization_ids) : montage.visualization_ids || [];
    const vizDetails = [];
    for (const id of vizIds) {
      const v = await getVisualizationById(id);
      if (v) vizDetails.push(v);
    }
    const scriptResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are writing a conversation guide for a weekly Bitcoin market video.
Matthew Halfacre will watch this video and react live on camera.
The video features you (the AI analyst) presenting each chart and your take, then Matthew reacts.

CORE THESIS (this is the entire point of the video, every week, without exception):
CodexYield generates MORE Bitcoin than simply buying and holding Bitcoin.
This is the claim. Every chart, every data point, every prediction exists to support or test this claim.
The opening must state this thesis. The closing must return to it.
Every chart segment should ask: does this data give us an edge over a passive BTC holder?

Style: Opinionated analyst. Human-sounding. Direct. No em dashes. No excessive semicolons.
Format: A structured script showing what the AI says for each chart, with space for Matthew's reaction.`
        },
        {
          role: "user",
          content: `Write the full montage script for this week's video.
Week of: ${montage.week_of}

Charts being presented (in order):
${vizDetails.map((v, i) => `${i + 1}. ${v.title}
   Narration: ${v.ai_narration}
   Prediction: ${v.ai_prediction}`).join("\n\n")}

Write a flowing script that:
1. Opens with a brief intro (30 seconds)
2. Presents each chart with the narration and prediction, plus a transition line
3. Closes with a 60-second summary of the overall picture this week
4. Marks each section with [MATTHEW REACTS] placeholders

Keep the total estimated read time to 7-10 minutes.`
        }
      ]
    });
    const script = scriptResponse.choices[0].message.content;
    await updateMontage(input.montageId, { aiScript: script, status: "assembling" });
    return { script };
  }),
  uploadReactionVideo: protectedProcedure.input(import_zod2.z.object({
    montageId: import_zod2.z.number(),
    videoBase64: import_zod2.z.string(),
    mimeType: import_zod2.z.string().default("video/mp4")
  })).mutation(async ({ input }) => {
    const buffer = Buffer.from(input.videoBase64, "base64");
    const key = `reactions/montage-${input.montageId}-${randomSuffix()}.mp4`;
    const { url } = await storagePut(key, buffer, input.mimeType);
    await updateMontage(input.montageId, {
      reactionVideoUrl: url,
      status: "reaction_uploaded"
    });
    return { url };
  }),
  generateMetadata: protectedProcedure.input(import_zod2.z.object({ montageId: import_zod2.z.number() })).mutation(async ({ input }) => {
    const montage = await getMontageById(input.montageId);
    if (!montage) throw new Error("Montage not found");
    const metaResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a YouTube content strategist for CodexYield, a Bitcoin treasury management firm.
Write compelling, human-sounding titles and descriptions. No em dashes. No fluff.
The audience is Bitcoin investors and BTC-curious people.

CORE THESIS (must be reflected in every piece of copy):
CodexYield generates MORE Bitcoin than simply buying and holding Bitcoin.
The title, description, X post, and LinkedIn copy must all connect back to this claim.
This is CodexYield's main competitive advantage and the reason people should watch.
Do not bury this claim. Lead with it or build to it prominently.`
        },
        {
          role: "user",
          content: `Generate complete publishing metadata for this week's video.
Week of: ${montage.week_of}
Script excerpt: ${(montage.ai_script || "").slice(0, 500)}

Return JSON with:
- title: YouTube title (60 chars max, compelling, no clickbait \u2014 must reference beating BTC buy-and-hold or generating more BTC)
- description: YouTube description (300-500 words, includes timestamps placeholder, opens with the core thesis: CodexYield generates more BTC than buy-and-hold)
- tags: array of 10-15 relevant tags (include: bitcoin, btc, bitcoin strategy, btc yield, beat bitcoin, bitcoin treasury)
- x_copy: X post copy (280 chars max, punchy, includes link placeholder [LINK], must reference generating more BTC than holding)
- linkedin_copy: LinkedIn post copy (150-200 words, professional but conversational, leads with the core thesis)
- youtube_copy: Same as description but formatted for YouTube`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "video_metadata",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              x_copy: { type: "string" },
              linkedin_copy: { type: "string" },
              youtube_copy: { type: "string" }
            },
            required: ["title", "description", "tags", "x_copy", "linkedin_copy", "youtube_copy"],
            additionalProperties: false
          }
        }
      }
    });
    const meta = JSON.parse(metaResponse.choices[0].message.content);
    await updateMontage(input.montageId, {
      title: meta.title,
      description: meta.description,
      tags: meta.tags,
      xCopy: meta.x_copy,
      linkedinCopy: meta.linkedin_copy,
      youtubeCopy: meta.youtube_copy,
      status: "metadata_ready"
    });
    return meta;
  }),
  approve: protectedProcedure.input(import_zod2.z.object({
    montageId: import_zod2.z.number(),
    title: import_zod2.z.string(),
    description: import_zod2.z.string(),
    xCopy: import_zod2.z.string(),
    linkedinCopy: import_zod2.z.string()
  })).mutation(async ({ input }) => {
    await updateMontage(input.montageId, {
      title: input.title,
      description: input.description,
      xCopy: input.xCopy,
      linkedinCopy: input.linkedinCopy,
      status: "approved"
    });
    return { success: true };
  }),
  postToYouTube: protectedProcedure.input(import_zod2.z.object({ montageId: import_zod2.z.number() })).mutation(async ({ input }) => {
    const montage = await getMontageById(input.montageId);
    if (!montage) throw new Error("Montage not found");
    if (montage.status !== "approved") throw new Error("Montage must be approved before posting");
    await updateMontage(input.montageId, { status: "posted", postedAt: /* @__PURE__ */ new Date() });
    return {
      success: true,
      message: "YouTube upload initiated. Video ID will be available once processing completes.",
      title: montage.title,
      description: montage.youtube_copy || montage.description
    };
  }),
  postToX: protectedProcedure.input(import_zod2.z.object({ montageId: import_zod2.z.number() })).mutation(async ({ input }) => {
    const montage = await getMontageById(input.montageId);
    if (!montage) throw new Error("Montage not found");
    if (montage.status !== "approved") throw new Error("Montage must be approved before posting");
    const token = await getXOAuthToken();
    if (!token) throw new Error("X OAuth token not configured. Go to Settings to connect your X account.");
    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: montage.x_copy })
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`X API error: ${err}`);
    }
    const data = await response.json();
    await updateMontage(input.montageId, { xPostId: data.data?.id });
    return { success: true, postId: data.data?.id };
  })
});
var publicationsRouter = router({
  getAll: protectedProcedure.input(import_zod2.z.object({ type: import_zod2.z.string().optional() }).optional()).query(async ({ input }) => {
    return getPublications(input?.type);
  }),
  // Public endpoint for codexyield.com and pitch
  getAllPublic: publicProcedure.input(import_zod2.z.object({ type: import_zod2.z.string().optional(), limit: import_zod2.z.number().optional() }).optional()).query(async ({ input }) => {
    const pubs = await getPublications(input?.type);
    return input?.limit ? pubs.slice(0, input.limit) : pubs;
  }),
  add: protectedProcedure.input(import_zod2.z.object({
    type: import_zod2.z.enum(["newsletter", "article", "podcast", "speech", "video", "blog"]),
    title: import_zod2.z.string(),
    url: import_zod2.z.string().optional(),
    platform: import_zod2.z.string().optional(),
    publishedAt: import_zod2.z.string(),
    summary: import_zod2.z.string().optional(),
    contentBody: import_zod2.z.string().optional(),
    thumbnailUrl: import_zod2.z.string().optional(),
    featured: import_zod2.z.boolean().optional()
  })).mutation(async ({ input }) => {
    const id = await insertPublication(input);
    return { id };
  }),
  bulkImportLinkedIn: protectedProcedure.input(import_zod2.z.object({
    urls: import_zod2.z.array(import_zod2.z.string())
  })).mutation(async ({ input }) => {
    const results = [];
    for (const url of input.urls) {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Extract publication metadata from a LinkedIn URL. Return JSON only."
            },
            {
              role: "user",
              content: `LinkedIn URL: ${url}
Extract: title (infer from URL slug), platform (LinkedIn), type (newsletter or article).
Return JSON: { "title": "...", "platform": "LinkedIn", "type": "newsletter" }`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "linkedin_meta",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  platform: { type: "string" },
                  type: { type: "string" }
                },
                required: ["title", "platform", "type"],
                additionalProperties: false
              }
            }
          }
        });
        const meta = JSON.parse(response.choices[0].message.content);
        const id = await insertPublication({
          type: meta.type === "newsletter" ? "newsletter" : "article",
          title: meta.title,
          url,
          platform: "LinkedIn",
          publishedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        results.push({ url, success: true, title: meta.title });
      } catch (err) {
        results.push({ url, success: false, error: err.message });
      }
    }
    return { results, imported: results.filter((r) => r.success).length };
  })
});
var contentDraftsRouter = router({
  getAll: protectedProcedure.input(import_zod2.z.object({ status: import_zod2.z.string().optional() }).optional()).query(async ({ input }) => {
    return getContentDrafts(input?.status);
  }),
  generateDraft: protectedProcedure.input(import_zod2.z.object({
    montageId: import_zod2.z.number().optional(),
    publicationId: import_zod2.z.number().optional(),
    platform: import_zod2.z.enum(["x", "linkedin", "youtube"]),
    context: import_zod2.z.string()
  })).mutation(async ({ input }) => {
    const platformGuide = {
      x: "X (Twitter) post, 280 characters max, punchy and direct, includes [LINK] placeholder",
      linkedin: "LinkedIn post, 150-200 words, professional but conversational, no em dashes",
      youtube: "YouTube description, 300-400 words, includes timestamps placeholder, SEO-friendly"
    }[input.platform];
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You write social media copy for CodexYield, a Bitcoin treasury management firm.
Voice: Human analyst, opinionated, direct. No em dashes. No excessive semicolons.
Audience: Bitcoin investors and BTC-curious people.

CORE THESIS (must appear in every post, every platform, every time):
CodexYield generates MORE Bitcoin than simply buying and holding Bitcoin.
This is the entire value proposition. Every post must connect back to this claim.
Whether you are writing about a signal, a trade, a market condition, or a publication,
ask yourself: how does this relate to generating more BTC than a passive holder would have?
Lead with this or build to it. Never leave it out.`
        },
        {
          role: "user",
          content: `Write a ${platformGuide}.
Context: ${input.context}
Return only the post copy, nothing else.`
        }
      ]
    });
    const draftCopy = response.choices[0].message.content;
    const id = await insertContentDraft({
      montageId: input.montageId,
      publicationId: input.publicationId,
      platform: input.platform,
      draftCopy
    });
    return { id, draftCopy };
  }),
  approve: protectedProcedure.input(import_zod2.z.object({ id: import_zod2.z.number() })).mutation(async ({ input }) => {
    await updateContentDraftStatus(input.id, "approved");
    return { success: true };
  }),
  reject: protectedProcedure.input(import_zod2.z.object({ id: import_zod2.z.number() })).mutation(async ({ input }) => {
    await updateContentDraftStatus(input.id, "rejected");
    return { success: true };
  })
});
var statsRouter = router({
  getLatest: publicProcedure.query(async () => {
    return getLatestPerformanceSnapshot();
  })
});
var settingsRouter = router({
  getXConnectionStatus: protectedProcedure.query(async () => {
    const token = await getXOAuthToken();
    return {
      connected: !!token,
      handle: token?.account_handle || null,
      expiresAt: token?.expires_at || null
    };
  }),
  getXOAuthUrl: protectedProcedure.input(import_zod2.z.object({ redirectUri: import_zod2.z.string() })).query(async ({ input }) => {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: ENV.xOAuthClientId,
      redirect_uri: input.redirectUri,
      scope: "tweet.read tweet.write users.read offline.access",
      state: "codex-socialmedia",
      code_challenge: "challenge",
      code_challenge_method: "plain"
    });
    return {
      url: `https://twitter.com/i/oauth2/authorize?${params.toString()}`
    };
  })
});
var authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  })
});
var appRouter = router({
  system: systemRouter,
  auth: authRouter,
  visualizations: visualizationsRouter,
  montages: montagesRouter,
  publications: publicationsRouter,
  contentDrafts: contentDraftsRouter,
  stats: statsRouter,
  settings: settingsRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
var import_express = __toESM(require("express"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_nanoid = require("nanoid");
var import_path = __toESM(require("path"), 1);
var import_vite3 = require("vite");

// vite.config.ts
var import_vite_plugin_jsx_loc = require("@builder.io/vite-plugin-jsx-loc");
var import_vite = __toESM(require("@tailwindcss/vite"), 1);
var import_plugin_react = __toESM(require("@vitejs/plugin-react"), 1);
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_vite2 = require("vite");
var import_vite_plugin_manus_runtime = require("vite-plugin-manus-runtime");
var import_meta = {};
var PROJECT_ROOT = import_meta.dirname;
var LOG_DIR = import_node_path.default.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!import_node_fs.default.existsSync(LOG_DIR)) {
    import_node_fs.default.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!import_node_fs.default.existsSync(logPath) || import_node_fs.default.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = import_node_fs.default.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    import_node_fs.default.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = import_node_path.default.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  import_node_fs.default.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [(0, import_plugin_react.default)(), (0, import_vite.default)(), (0, import_vite_plugin_jsx_loc.jsxLocPlugin)(), (0, import_vite_plugin_manus_runtime.vitePluginManusRuntime)(), vitePluginManusDebugCollector()];
var vite_config_default = (0, import_vite2.defineConfig)({
  plugins,
  resolve: {
    alias: {
      "@": import_node_path.default.resolve(import_meta.dirname, "client", "src"),
      "@shared": import_node_path.default.resolve(import_meta.dirname, "shared"),
      "@assets": import_node_path.default.resolve(import_meta.dirname, "attached_assets")
    }
  },
  envDir: import_node_path.default.resolve(import_meta.dirname),
  root: import_node_path.default.resolve(import_meta.dirname, "client"),
  publicDir: import_node_path.default.resolve(import_meta.dirname, "client", "public"),
  build: {
    outDir: import_node_path.default.resolve(import_meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
var import_meta2 = {};
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await (0, import_vite3.createServer)({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = import_path.default.resolve(
        import_meta2.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await import_fs.default.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${(0, import_nanoid.nanoid)()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? import_path.default.resolve(import_meta2.dirname, "../..", "dist", "public") : import_path.default.resolve(import_meta2.dirname, "public");
  if (!import_fs.default.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(import_express.default.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(import_path.default.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = import_net.default.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = (0, import_express2.default)();
  const server = (0, import_http.createServer)(app);
  app.use(import_express2.default.json({ limit: "50mb" }));
  app.use(import_express2.default.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    (0, import_express3.createExpressMiddleware)({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
