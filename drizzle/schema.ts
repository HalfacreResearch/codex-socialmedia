import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  json,
  mysqlEnum,
  date,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Users (required by _core auth framework) ─────────────────────────────────
// Shared with codex_portal. The _core SDK reads/writes this table for auth.
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Visualizations ──────────────────────────────────────────────────────────
// One record per chart generated from tradinghq data.
// Generated every Sunday from the 8 tradinghq data tables.
export const visualizations = mysqlTable("visualizations", {
  id: int("id").primaryKey().autoincrement(),
  category: varchar("category", { length: 64 }).notNull(), // e.g. "price-action", "factor-scores", "sentiment", "etf-flows"
  chartType: varchar("chart_type", { length: 64 }).notNull(), // e.g. "candlestick", "line", "bar", "heatmap"
  title: varchar("title", { length: 255 }).notNull(),
  imageUrl: text("image_url").notNull(), // S3 URL of the rendered chart image
  aiNarration: text("ai_narration"), // Plain-English analyst explanation of what the chart shows
  aiPrediction: text("ai_prediction"), // AI's own opinionated take and forward-looking view
  ttsAudioUrl: text("tts_audio_url"), // S3 URL of the TTS voiceover audio for this chart
  sourceTable: varchar("source_table", { length: 64 }).notNull(), // Which tradinghq table this came from
  weekOf: date("week_of").notNull(), // ISO date of the Sunday this chart was generated for
  durationSeconds: int("duration_seconds").default(45), // Target segment duration in the montage
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Montages ─────────────────────────────────────────────────────────────────
// One record per weekly video production.
// Tracks the full lifecycle from chart selection to final YouTube upload.
export const montages = mysqlTable("montages", {
  id: int("id").primaryKey().autoincrement(),
  weekOf: date("week_of").notNull(),
  title: varchar("title", { length: 255 }), // Final video title (AI-generated, operator-approved)
  description: text("description"), // YouTube description (AI-generated)
  tags: json("tags").$type<string[]>(), // YouTube tags array
  chapterMarkers: json("chapter_markers").$type<{ time: number; label: string }[]>(),
  visualizationIds: json("visualization_ids").$type<number[]>().notNull(), // Ordered list of selected visualization IDs
  youtubeClipUrls: json("youtube_clip_urls").$type<string[]>().default([]), // Curated YouTube clip URLs
  aiScript: text("ai_script"), // Full montage script / conversation guide
  targetDurationSeconds: int("target_duration_seconds").default(480), // 7-10 min = 420-600s
  actualDurationSeconds: int("actual_duration_seconds"),
  status: mysqlEnum("status", [
    "draft",           // Charts selected, not yet assembled
    "assembling",      // TTS and video rendering in progress
    "ready_for_reaction", // Pre-rendered montage ready for Matthew to watch
    "reaction_uploaded",  // Matthew uploaded his reaction video
    "metadata_ready",     // Title, description, post copy generated and awaiting approval
    "approved",           // Matthew approved all content
    "posted",             // Posted to YouTube and X
  ]).default("draft").notNull(),
  montageVideoUrl: text("montage_video_url"), // S3 URL of the assembled montage (before reaction)
  reactionVideoUrl: text("reaction_video_url"), // S3 URL of Matthew's reaction video
  thumbnailUrl: text("thumbnail_url"), // S3 URL of the generated thumbnail card
  youtubeVideoId: varchar("youtube_video_id", { length: 64 }), // YouTube video ID after upload
  xPostId: varchar("x_post_id", { length: 64 }), // X post ID after posting
  linkedinCopy: text("linkedin_copy"), // Formatted LinkedIn post copy
  xCopy: text("x_copy"), // X post copy (280 char limit)
  youtubeCopy: text("youtube_copy"), // YouTube description copy
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── Publications ─────────────────────────────────────────────────────────────
// All content Matthew has published anywhere.
// Written by socialmedia, read by codexyield.com and pitch.codexyield.com.
export const publications = mysqlTable("publications", {
  id: int("id").primaryKey().autoincrement(),
  type: mysqlEnum("type", [
    "newsletter",  // LinkedIn newsletter editions
    "article",     // LinkedIn articles or external publications
    "podcast",     // Podcast appearances (external link)
    "speech",      // Conference talks, presentations
    "video",       // YouTube videos, interviews
    "blog",        // Blog posts
  ]).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  url: text("url"), // External URL (LinkedIn post, podcast episode, etc.)
  platform: varchar("platform", { length: 64 }), // e.g. "LinkedIn", "YouTube", "Spotify", "X"
  publishedAt: timestamp("published_at").notNull(),
  summary: text("summary"), // Brief description for display on codexyield.com
  contentBody: text("content_body"), // Full text content (for newsletters/articles if available)
  thumbnailUrl: text("thumbnail_url"), // Optional image for display
  featured: boolean("featured").default(false), // Pin to top of publications feed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── Content Drafts ───────────────────────────────────────────────────────────
// AI-generated post copy awaiting Matthew's approval before posting.
export const contentDrafts = mysqlTable("content_drafts", {
  id: int("id").primaryKey().autoincrement(),
  montageId: int("montage_id"), // If this draft is for a montage video
  publicationId: int("publication_id"), // If this draft is for a publication
  platform: mysqlEnum("platform", ["x", "linkedin", "youtube"]).notNull(),
  draftCopy: text("draft_copy").notNull(), // The AI-generated post text
  status: mysqlEnum("status", ["draft", "approved", "rejected", "posted"]).default("draft").notNull(),
  postedAt: timestamp("posted_at"),
  postId: varchar("post_id", { length: 128 }), // Platform post ID after posting
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── X OAuth Tokens ───────────────────────────────────────────────────────────
// Stores X OAuth 2.0 tokens for @Halfacre_Matt
export const xOAuthTokens = mysqlTable("x_oauth_tokens", {
  id: int("id").primaryKey().autoincrement(),
  accountHandle: varchar("account_handle", { length: 64 }).notNull(), // e.g. "@Halfacre_Matt"
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenType: varchar("token_type", { length: 32 }).default("bearer"),
  scope: text("scope"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── Performance Snapshots ────────────────────────────────────────────────────
// Weekly aggregate performance stats.
// Written by autotrades cron, read by codexyield.com and pitch.codexyield.com.
export const performanceSnapshots = mysqlTable("performance_snapshots", {
  id: int("id").primaryKey().autoincrement(),
  snapshotDate: date("snapshot_date").notNull(),
  aumUsd: bigint("aum_usd", { mode: "number" }), // Total AUM in USD cents
  btcAlphaPercent: varchar("btc_alpha_percent", { length: 16 }), // e.g. "5.23"
  cagrPercent: varchar("cagr_percent", { length: 16 }), // e.g. "7.41"
  totalTrades: int("total_trades").default(0),
  winRatePercent: varchar("win_rate_percent", { length: 16 }), // e.g. "68.5"
  activeClients: int("active_clients").default(0),
  totalRotations: int("total_rotations").default(0),
  profitableRotations: int("profitable_rotations").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Type exports ─────────────────────────────────────────────────────────────
export type Visualization = typeof visualizations.$inferSelect;
export type NewVisualization = typeof visualizations.$inferInsert;
export type Montage = typeof montages.$inferSelect;
export type NewMontage = typeof montages.$inferInsert;
export type Publication = typeof publications.$inferSelect;
export type NewPublication = typeof publications.$inferInsert;
export type ContentDraft = typeof contentDrafts.$inferSelect;
export type NewContentDraft = typeof contentDrafts.$inferInsert;
export type XOAuthToken = typeof xOAuthTokens.$inferSelect;
export type PerformanceSnapshot = typeof performanceSnapshots.$inferSelect;
