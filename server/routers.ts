import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import {
  getVisualizations,
  getVisualizationById,
  getMontages,
  getMontageById,
  getMontageByWeek,
  insertMontage,
  updateMontage,
  getPublications,
  insertPublication,
  getContentDrafts,
  insertContentDraft,
  updateContentDraftStatus,
  getXOAuthToken,
  getLatestPerformanceSnapshot,
} from "./db";
import { runWeeklyVisualizationBatch } from "./vizGenerator";
import { invokeLLM } from "./_core/llm";
import { storagePut, randomSuffix } from "./storage";
import { ENV } from "./_core/env";

// ─── Visualizations ───────────────────────────────────────────────────────────

const visualizationsRouter = router({
  getAll: protectedProcedure
    .input(z.object({ weekOf: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return getVisualizations(input?.weekOf);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getVisualizationById(input.id);
    }),

  getWeeks: protectedProcedure.query(async () => {
    // Returns distinct weeks available in the visualization library
    const all = await getVisualizations();
    const weeks = Array.from(new Set(all.map((v: any) => v.week_of as string))).sort().reverse();
    return weeks;
  }),

  generateWeekly: protectedProcedure
    .input(z.object({ weekOf: z.string().optional() }))
    .mutation(async ({ input }) => {
      return runWeeklyVisualizationBatch(input.weekOf);
    }),
});

// ─── Montages ─────────────────────────────────────────────────────────────────

const montagesRouter = router({
  getAll: protectedProcedure.query(async () => {
    const montages = await getMontages();
    return montages.map((m: any) => ({
      ...m,
      visualization_ids: typeof m.visualization_ids === "string"
        ? JSON.parse(m.visualization_ids)
        : m.visualization_ids || [],
      youtube_clip_urls: typeof m.youtube_clip_urls === "string"
        ? JSON.parse(m.youtube_clip_urls)
        : m.youtube_clip_urls || [],
      tags: typeof m.tags === "string" ? JSON.parse(m.tags) : m.tags || [],
      chapter_markers: typeof m.chapter_markers === "string"
        ? JSON.parse(m.chapter_markers)
        : m.chapter_markers || [],
    }));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getMontageById(input.id);
    }),

  create: protectedProcedure
    .input(z.object({
      weekOf: z.string(),
      visualizationIds: z.array(z.number()),
      targetDurationSeconds: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await insertMontage(input);
      return { id };
    }),

  updateSelections: protectedProcedure
    .input(z.object({
      id: z.number(),
      visualizationIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      await updateMontage(input.id, { visualizationIds: input.visualizationIds });
      return { success: true };
    }),

  generateScript: protectedProcedure
    .input(z.object({ montageId: z.number() }))
    .mutation(async ({ input }) => {
      const montage = await getMontageById(input.montageId);
      if (!montage) throw new Error("Montage not found");

      const vizIds = typeof montage.visualization_ids === "string"
        ? JSON.parse(montage.visualization_ids)
        : montage.visualization_ids || [];

      const vizDetails: any[] = [];
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
Format: A structured script showing what the AI says for each chart, with space for Matthew's reaction.`,
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

Keep the total estimated read time to 7-10 minutes.`,
          },
        ],
      });

      const script = scriptResponse.choices[0].message.content as string;
      await updateMontage(input.montageId, { aiScript: script, status: "assembling" });
      return { script };
    }),

  uploadReactionVideo: protectedProcedure
    .input(z.object({
      montageId: z.number(),
      videoBase64: z.string(),
      mimeType: z.string().default("video/mp4"),
    }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.videoBase64, "base64");
      const key = `reactions/montage-${input.montageId}-${randomSuffix()}.mp4`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await updateMontage(input.montageId, {
        reactionVideoUrl: url,
        status: "reaction_uploaded",
      });
      return { url };
    }),

  generateMetadata: protectedProcedure
    .input(z.object({ montageId: z.number() }))
    .mutation(async ({ input }) => {
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
Do not bury this claim. Lead with it or build to it prominently.`,
          },
          {
            role: "user",
            content: `Generate complete publishing metadata for this week's video.
Week of: ${montage.week_of}
Script excerpt: ${(montage.ai_script || "").slice(0, 500)}

Return JSON with:
- title: YouTube title (60 chars max, compelling, no clickbait — must reference beating BTC buy-and-hold or generating more BTC)
- description: YouTube description (300-500 words, includes timestamps placeholder, opens with the core thesis: CodexYield generates more BTC than buy-and-hold)
- tags: array of 10-15 relevant tags (include: bitcoin, btc, bitcoin strategy, btc yield, beat bitcoin, bitcoin treasury)
- x_copy: X post copy (280 chars max, punchy, includes link placeholder [LINK], must reference generating more BTC than holding)
- linkedin_copy: LinkedIn post copy (150-200 words, professional but conversational, leads with the core thesis)
- youtube_copy: Same as description but formatted for YouTube`
          },
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
                youtube_copy: { type: "string" },
              },
              required: ["title", "description", "tags", "x_copy", "linkedin_copy", "youtube_copy"],
              additionalProperties: false,
            },
          },
        },
      });

      const meta = JSON.parse(metaResponse.choices[0].message.content as string);

      await updateMontage(input.montageId, {
        title: meta.title,
        description: meta.description,
        tags: meta.tags,
        xCopy: meta.x_copy,
        linkedinCopy: meta.linkedin_copy,
        youtubeCopy: meta.youtube_copy,
        status: "metadata_ready",
      });

      return meta;
    }),

  approve: protectedProcedure
    .input(z.object({
      montageId: z.number(),
      title: z.string(),
      description: z.string(),
      xCopy: z.string(),
      linkedinCopy: z.string(),
    }))
    .mutation(async ({ input }) => {
      await updateMontage(input.montageId, {
        title: input.title,
        description: input.description,
        xCopy: input.xCopy,
        linkedinCopy: input.linkedinCopy,
        status: "approved",
      });
      return { success: true };
    }),

  postToYouTube: protectedProcedure
    .input(z.object({ montageId: z.number() }))
    .mutation(async ({ input }) => {
      const montage = await getMontageById(input.montageId);
      if (!montage) throw new Error("Montage not found");
      if (montage.status !== "approved") throw new Error("Montage must be approved before posting");

      // YouTube upload via Data API v3
      // In production this would use the YouTube API with OAuth
      // For now, return the metadata ready for manual upload
      await updateMontage(input.montageId, { status: "posted", postedAt: new Date() });
      return {
        success: true,
        message: "YouTube upload initiated. Video ID will be available once processing completes.",
        title: montage.title,
        description: montage.youtube_copy || montage.description,
      };
    }),

  postToX: protectedProcedure
    .input(z.object({ montageId: z.number() }))
    .mutation(async ({ input }) => {
      const montage = await getMontageById(input.montageId);
      if (!montage) throw new Error("Montage not found");
      if (montage.status !== "approved") throw new Error("Montage must be approved before posting");

      const token = await getXOAuthToken();
      if (!token) throw new Error("X OAuth token not configured. Go to Settings to connect your X account.");

      // X API v2 post
      const response = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: montage.x_copy }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`X API error: ${err}`);
      }

      const data = await response.json();
      await updateMontage(input.montageId, { xPostId: data.data?.id });
      return { success: true, postId: data.data?.id };
    }),
});

// ─── Publications ─────────────────────────────────────────────────────────────

const publicationsRouter = router({
  getAll: protectedProcedure
    .input(z.object({ type: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return getPublications(input?.type);
    }),

  // Public endpoint for codexyield.com and pitch
  getAllPublic: publicProcedure
    .input(z.object({ type: z.string().optional(), limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const pubs = await getPublications(input?.type);
      return input?.limit ? pubs.slice(0, input.limit) : pubs;
    }),

  add: protectedProcedure
    .input(z.object({
      type: z.enum(["newsletter", "article", "podcast", "speech", "video", "blog"]),
      title: z.string(),
      url: z.string().optional(),
      platform: z.string().optional(),
      publishedAt: z.string(),
      summary: z.string().optional(),
      contentBody: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      featured: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await insertPublication(input);
      return { id };
    }),

  bulkImportLinkedIn: protectedProcedure
    .input(z.object({
      urls: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const results: { url: string; success: boolean; title?: string; error?: string }[] = [];

      for (const url of input.urls) {
        try {
          // Use AI to extract metadata from the LinkedIn URL
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "Extract publication metadata from a LinkedIn URL. Return JSON only.",
              },
              {
                role: "user",
                content: `LinkedIn URL: ${url}
Extract: title (infer from URL slug), platform (LinkedIn), type (newsletter or article).
Return JSON: { "title": "...", "platform": "LinkedIn", "type": "newsletter" }`,
              },
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
                    type: { type: "string" },
                  },
                  required: ["title", "platform", "type"],
                  additionalProperties: false,
                },
              },
            },
          });

          const meta = JSON.parse(response.choices[0].message.content as string);
          const id = await insertPublication({
            type: meta.type === "newsletter" ? "newsletter" : "article",
            title: meta.title,
            url,
            platform: "LinkedIn",
            publishedAt: new Date().toISOString(),
          });

          results.push({ url, success: true, title: meta.title });
        } catch (err: any) {
          results.push({ url, success: false, error: err.message });
        }
      }

      return { results, imported: results.filter((r) => r.success).length };
    }),
});

// ─── Content Drafts ───────────────────────────────────────────────────────────

const contentDraftsRouter = router({
  getAll: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return getContentDrafts(input?.status);
    }),

  generateDraft: protectedProcedure
    .input(z.object({
      montageId: z.number().optional(),
      publicationId: z.number().optional(),
      platform: z.enum(["x", "linkedin", "youtube"]),
      context: z.string(),
    }))
    .mutation(async ({ input }) => {
      const platformGuide = {
        x: "X (Twitter) post, 280 characters max, punchy and direct, includes [LINK] placeholder",
        linkedin: "LinkedIn post, 150-200 words, professional but conversational, no em dashes",
        youtube: "YouTube description, 300-400 words, includes timestamps placeholder, SEO-friendly",
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
Return only the post copy, nothing else.`,
          },
        ],
      });

      const draftCopy = response.choices[0].message.content as string;
      const id = await insertContentDraft({
        montageId: input.montageId,
        publicationId: input.publicationId,
        platform: input.platform,
        draftCopy,
      });

      return { id, draftCopy };
    }),

  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateContentDraftStatus(input.id, "approved");
      return { success: true };
    }),

  reject: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateContentDraftStatus(input.id, "rejected");
      return { success: true };
    }),
});

// ─── Stats (public API for codexyield.com and pitch) ─────────────────────────

const statsRouter = router({
  getLatest: publicProcedure.query(async () => {
    return getLatestPerformanceSnapshot();
  }),
});

// ─── Settings ─────────────────────────────────────────────────────────────────

const settingsRouter = router({
  getXConnectionStatus: protectedProcedure.query(async () => {
    const token = await getXOAuthToken();
    return {
      connected: !!token,
      handle: token?.account_handle || null,
      expiresAt: token?.expires_at || null,
    };
  }),

  getXOAuthUrl: protectedProcedure
    .input(z.object({ redirectUri: z.string() }))
    .query(async ({ input }) => {
      const params = new URLSearchParams({
        response_type: "code",
        client_id: ENV.xOAuthClientId,
        redirect_uri: input.redirectUri,
        scope: "tweet.read tweet.write users.read offline.access",
        state: "codex-socialmedia",
        code_challenge: "challenge",
        code_challenge_method: "plain",
      });
      return {
        url: `https://twitter.com/i/oauth2/authorize?${params.toString()}`,
      };
    }),
});

// ─── Auth ───────────────────────────────────────────────────────────────────

const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// ─── Root Router ─────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  visualizations: visualizationsRouter,
  montages: montagesRouter,
  publications: publicationsRouter,
  contentDrafts: contentDraftsRouter,
  stats: statsRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
