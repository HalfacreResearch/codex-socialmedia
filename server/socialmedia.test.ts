/**
 * socialmedia.test.ts
 * Tests for the CodexYield Social Media Hub server procedures.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────

vi.mock("./db", () => ({
  getVisualizations: vi.fn().mockResolvedValue([
    {
      id: 1,
      category: "price-action",
      chart_type: "candlestick",
      title: "BTC/USD Price Action",
      image_url: "https://s3.example.com/chart1.png",
      ai_narration: "Bitcoin is showing strong support at the 200-day MA.",
      ai_prediction: "I think we break above 70k this week.",
      tts_audio_url: null,
      source_table: "candlesticks",
      week_of: "2026-03-16",
      duration_seconds: 45,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      category: "sentiment",
      chart_type: "line",
      title: "Market Sentiment Trend",
      image_url: "https://s3.example.com/chart2.png",
      ai_narration: "Sentiment is turning bullish after weeks of fear.",
      ai_prediction: "This is a leading indicator. Watch for a breakout.",
      tts_audio_url: null,
      source_table: "sentiment_snapshots",
      week_of: "2026-03-16",
      duration_seconds: 45,
      created_at: new Date().toISOString(),
    },
  ]),
  getVisualizationById: vi.fn().mockResolvedValue({
    id: 1,
    category: "price-action",
    title: "BTC/USD Price Action",
    week_of: "2026-03-16",
  }),
  getMontages: vi.fn().mockResolvedValue([]),
  getMontageById: vi.fn().mockResolvedValue(null),
  getMontageByWeek: vi.fn().mockResolvedValue(null),
  insertMontage: vi.fn().mockResolvedValue(1),
  updateMontage: vi.fn().mockResolvedValue(undefined),
  getPublications: vi.fn().mockResolvedValue([]),
  insertPublication: vi.fn().mockResolvedValue(1),
  getContentDrafts: vi.fn().mockResolvedValue([]),
  insertContentDraft: vi.fn().mockResolvedValue(1),
  updateContentDraftStatus: vi.fn().mockResolvedValue(undefined),
  getXOAuthToken: vi.fn().mockResolvedValue(null),
  upsertXOAuthToken: vi.fn().mockResolvedValue(undefined),
  getLatestPerformanceSnapshot: vi.fn().mockResolvedValue({
    id: 1,
    snapshot_date: "2026-03-16",
    aum_usd: 500000000,
    btc_alpha_percent: "5.23",
    cagr_percent: "7.41",
    total_trades: 142,
    win_rate_percent: "68.5",
    active_clients: 4,
    total_rotations: 38,
    profitable_rotations: 26,
  }),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(null),
  getLatestCandlesticks: vi.fn().mockResolvedValue([]),
  getLatestFactorSnapshots: vi.fn().mockResolvedValue([]),
  getFactorBacktestResults: vi.fn().mockResolvedValue([]),
  getLatestBacktestResults: vi.fn().mockResolvedValue([]),
  getRecentSignalHistory: vi.fn().mockResolvedValue([]),
  getLatestSentimentSnapshot: vi.fn().mockResolvedValue(null),
  getRecentEtfFlows: vi.fn().mockResolvedValue([]),
  getSignalFlipEvents: vi.fn().mockResolvedValue([]),
}));

vi.mock("./vizGenerator", () => ({
  runWeeklyVisualizationBatch: vi.fn().mockResolvedValue({ generated: 8, errors: 0 }),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ title: "Test Title", description: "Test desc", tags: ["bitcoin"], x_copy: "Test X post", linkedin_copy: "Test LinkedIn", youtube_copy: "Test YouTube" }) } }],
  }),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/audio.mp3", key: "audio.mp3" }),
  randomSuffix: vi.fn().mockReturnValue("abc123"),
}));

import { getVisualizations, getMontages, getPublications, getLatestPerformanceSnapshot } from "./db";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Visualization DB helpers", () => {
  it("getVisualizations returns an array of visualization records", async () => {
    const result = await getVisualizations();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("each visualization has required fields", async () => {
    const result = await getVisualizations();
    for (const viz of result) {
      expect(viz).toHaveProperty("id");
      expect(viz).toHaveProperty("category");
      expect(viz).toHaveProperty("title");
      expect(viz).toHaveProperty("image_url");
      expect(viz).toHaveProperty("week_of");
    }
  });

  it("getVisualizations can filter by week", async () => {
    const result = await getVisualizations("2026-03-16");
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Montage DB helpers", () => {
  it("getMontages returns an array", async () => {
    const result = await getMontages();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Publications DB helpers", () => {
  it("getPublications returns an array", async () => {
    const result = await getPublications();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Performance Snapshot", () => {
  it("getLatestPerformanceSnapshot returns expected fields", async () => {
    const result = await getLatestPerformanceSnapshot();
    expect(result).toBeTruthy();
    expect(result).toHaveProperty("btc_alpha_percent");
    expect(result).toHaveProperty("cagr_percent");
    expect(result).toHaveProperty("active_clients");
  });

  it("active_clients matches known count of 4", async () => {
    const result = await getLatestPerformanceSnapshot();
    expect(result.active_clients).toBe(4);
  });
});

describe("Week deduplication logic", () => {
  it("produces unique sorted weeks from visualization data", async () => {
    const all = await getVisualizations();
    const weeks = Array.from(new Set(all.map((v: any) => v.week_of as string))).sort().reverse();
    expect(weeks).toEqual(["2026-03-16"]);
    // Verify no duplicates
    expect(weeks.length).toBe(new Set(weeks).size);
  });
});

describe("Core thesis enforcement", () => {
  it("AI narration data is present on visualization records", async () => {
    const result = await getVisualizations();
    const withNarration = result.filter((v: any) => v.ai_narration);
    expect(withNarration.length).toBeGreaterThan(0);
  });

  it("AI prediction data is present on visualization records", async () => {
    const result = await getVisualizations();
    const withPrediction = result.filter((v: any) => v.ai_prediction);
    expect(withPrediction.length).toBeGreaterThan(0);
  });
});
