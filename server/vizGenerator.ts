/**
 * Visualization Generator
 *
 * Reads from all 8 tradinghq data tables and generates one chart per metric.
 * Stores chart images to S3, writes records to the visualizations table.
 * Runs every Sunday via cron.
 *
 * AI narration tone: opinionated analyst, human-sounding, no em dashes.
 */

import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import {
  insertVisualization,
  getLatestCandlesticks,
  getLatestFactorSnapshots,
  getFactorBacktestResults,
  getLatestBacktestResults,
  getRecentSignalHistory,
  getLatestSentimentSnapshot,
  getRecentEtfFlows,
  getSignalFlipEvents,
} from "./db";

// ─── AI Narration Generator ───────────────────────────────────────────────────

async function generateNarrationAndPrediction(
  chartTitle: string,
  dataDescription: string,
  dataPoints: string
): Promise<{ narration: string; prediction: string }> {
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
- No em dashes (never use —)
- No excessive semicolons
- Keep narration to 3-4 sentences max
- Keep prediction to 2-3 sentences max
- At least one sentence must connect the data to the core thesis: beating BTC buy-and-hold
- Give your genuine take, not a neutral summary`,
      },
      {
        role: "user",
        content: `Chart: ${chartTitle}
Data context: ${dataDescription}
Key data points: ${dataPoints}

Write two things:
1. NARRATION: A 3-4 sentence explanation of what this chart shows and why it matters. Analyst voice, opinionated.
2. PREDICTION: A 2-3 sentence forward-looking take. What does this data suggest is coming? What would you watch for?

Format your response as JSON: { "narration": "...", "prediction": "..." }`,
      },
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
            prediction: { type: "string" },
          },
          required: ["narration", "prediction"],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    const content = response.choices[0].message.content;
    return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  } catch {
    return {
      narration: `${chartTitle} — data visualization generated for week of ${new Date().toISOString().split("T")[0]}.`,
      prediction: "Analysis pending.",
    };
  }
}

// ─── Chart Image Generator ────────────────────────────────────────────────────
// Uses Gemini to generate a chart image from the data

async function generateChartImage(
  chartTitle: string,
  chartType: string,
  dataDescription: string,
  weekOf: string
): Promise<string> {
  // Generate a professional chart image using AI image generation
  const { generateImage } = await import("./_core/imageGeneration");

  const prompt = `Professional financial data visualization chart for Bitcoin treasury management.
Chart title: "${chartTitle}"
Chart type: ${chartType}
Style: Dark background (#0a0a0a), orange/amber accent color (#f59e0b), white text, clean grid lines, professional trading terminal aesthetic.
Data: ${dataDescription}
Week of: ${weekOf}
No watermarks. No logos. Clean, minimal, data-focused design.`;

  try {
    const { url } = await generateImage({ prompt });
    return url ?? `https://placehold.co/1200x675/0a0a0a/f59e0b?text=${encodeURIComponent(chartTitle)}`;
  } catch {
    // Return a placeholder URL if image generation fails
    return `https://placehold.co/1200x675/0a0a0a/f59e0b?text=${encodeURIComponent(chartTitle)}`;
  }
}

// ─── Individual Chart Generators ─────────────────────────────────────────────

async function generateCandlestickChart(weekOf: string): Promise<void> {
  const candles = await getLatestCandlesticks("btcusd", 90);
  if (!candles.length) return;

  const latest = candles[candles.length - 1];
  const oldest = candles[0];
  const priceChange = latest.close
    ? (((latest.close - oldest.close) / oldest.close) * 100).toFixed(2)
    : "N/A";

  const dataDesc = `90-day BTC/USD price action. Current price ~$${latest.close?.toLocaleString() || "N/A"}. 90-day change: ${priceChange}%.`;
  const dataPoints = `Open: $${oldest.open?.toLocaleString()}, Current: $${latest.close?.toLocaleString()}, High: $${Math.max(...candles.map((c: any) => c.high || 0)).toLocaleString()}, Low: $${Math.min(...candles.filter((c: any) => c.low > 0).map((c: any) => c.low)).toLocaleString()}`;

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
    durationSeconds: 50,
  });
}

async function generateFactorScoresChart(weekOf: string): Promise<void> {
  const snapshots = await getLatestFactorSnapshots(10);
  if (!snapshots.length) return;

  const latest = snapshots[0];
  const factors = typeof latest.factors === "string"
    ? JSON.parse(latest.factors)
    : latest.factors || {};
  const topFactors = Object.entries(factors)
    .sort(([, a]: any, [, b]: any) => Math.abs(b) - Math.abs(a))
    .slice(0, 5)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

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
    durationSeconds: 45,
  });
}

async function generateFactorAccuracyChart(weekOf: string): Promise<void> {
  const results = await getFactorBacktestResults();
  if (!results.length) return;

  const topFactors = results.slice(0, 10);
  const avgAccuracy = (
    topFactors.reduce((s: number, f: any) => s + (f.accuracy || 0), 0) / topFactors.length
  ).toFixed(1);

  const dataDesc = `Backtest accuracy for each prediction factor. ${results.length} factors evaluated. Average accuracy of top 10: ${avgAccuracy}%.`;
  const dataPoints = topFactors
    .slice(0, 5)
    .map((f: any) => `${f.factor_name || f.name}: ${f.accuracy}%`)
    .join(", ");

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
    durationSeconds: 45,
  });
}

async function generateEquityCurveChart(weekOf: string): Promise<void> {
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
    durationSeconds: 50,
  });
}

async function generateSignalAccuracyChart(weekOf: string): Promise<void> {
  const signals = await getRecentSignalHistory(100);
  if (!signals.length) return;

  const correct = signals.filter((s: any) => s.correct === 1 || s.correct === true).length;
  const accuracy = ((correct / signals.length) * 100).toFixed(1);
  const byPair = signals.reduce((acc: Record<string, { total: number; correct: number }>, s: any) => {
    const p = s.pair || "unknown";
    if (!acc[p]) acc[p] = { total: 0, correct: 0 };
    acc[p].total++;
    if (s.correct) acc[p].correct++;
    return acc;
  }, {});

  const pairSummary = Object.entries(byPair)
    .map(([p, v]) => `${p}: ${((v.correct / v.total) * 100).toFixed(0)}%`)
    .join(", ");

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
    durationSeconds: 45,
  });
}

async function generateSentimentChart(weekOf: string): Promise<void> {
  const snapshots = await getLatestSentimentSnapshot();
  if (!snapshots.length) return;

  const latest = snapshots[0];
  const trend = snapshots.length > 1
    ? latest.score > snapshots[snapshots.length - 1].score ? "improving" : "declining"
    : "stable";

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
    durationSeconds: 40,
  });
}

async function generateEtfFlowsChart(weekOf: string): Promise<void> {
  const flows = await getRecentEtfFlows(30);
  if (!flows.length) return;

  const totalInflow = flows.reduce((s: number, f: any) => s + (f.net_inflow || 0), 0);
  const latestCumulative = flows[flows.length - 1]?.cumulative_inflow;
  const positiveDays = flows.filter((f: any) => (f.net_inflow || 0) > 0).length;

  const dataDesc = `BTC ETF daily net flows over the last 30 days. Total 30-day net: $${(totalInflow / 1e6).toFixed(0)}M. Positive days: ${positiveDays}/30.`;
  const dataPoints = `Cumulative inflow: $${latestCumulative ? (latestCumulative / 1e9).toFixed(2) : "N/A"}B, Last 7-day avg: $${(flows.slice(-7).reduce((s: number, f: any) => s + (f.net_inflow || 0), 0) / 7 / 1e6).toFixed(0)}M/day`;

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
    durationSeconds: 45,
  });
}

async function generateRegimeChangeChart(weekOf: string): Promise<void> {
  const flips = await getSignalFlipEvents(20);
  if (!flips.length) return;

  const latest = flips[0];
  const bullishCount = flips.filter((f: any) => f.new_direction === "bullish" || f.to_signal === "BUY").length;
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
    durationSeconds: 40,
  });
}

// ─── Main Weekly Batch Runner ─────────────────────────────────────────────────

export async function runWeeklyVisualizationBatch(weekOf?: string): Promise<{
  success: boolean;
  chartsGenerated: number;
  errors: string[];
}> {
  const targetWeek = weekOf || new Date().toISOString().split("T")[0];
  const errors: string[] = [];
  let chartsGenerated = 0;

  const generators = [
    { name: "Candlestick / Price Action", fn: generateCandlestickChart },
    { name: "Factor Scores", fn: generateFactorScoresChart },
    { name: "Factor Accuracy", fn: generateFactorAccuracyChart },
    { name: "Equity Curve", fn: generateEquityCurveChart },
    { name: "Signal Accuracy", fn: generateSignalAccuracyChart },
    { name: "Market Sentiment", fn: generateSentimentChart },
    { name: "ETF Flows", fn: generateEtfFlowsChart },
    { name: "Regime Changes", fn: generateRegimeChangeChart },
  ];

  for (const gen of generators) {
    try {
      await gen.fn(targetWeek);
      chartsGenerated++;
    } catch (err: any) {
      errors.push(`${gen.name}: ${err.message}`);
    }
  }

  return { success: errors.length === 0, chartsGenerated, errors };
}
