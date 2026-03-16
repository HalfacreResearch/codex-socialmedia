# codex-socialmedia TODO

## Schema & Database
- [x] Drizzle schema: visualizations table
- [x] Drizzle schema: montages table
- [x] Drizzle schema: publications table
- [x] Drizzle schema: content_drafts table
- [x] Drizzle schema: x_oauth_tokens table
- [x] Drizzle schema: performance_snapshots table
- [x] Drizzle schema: users table (required by _core auth framework)
- [x] Apply all schema migrations via webdev_execute_sql
- [x] Dual DB connections: codex_portal (read/write) + tradinghq (read-only)
- [x] All DB query helpers in server/db.ts (including upsertUser, getUserByOpenId)

## Dashboard Layout & Navigation
- [x] DashboardLayout with sidebar navigation (amber/orange CodexYield theme)
- [x] Sidebar nav: This Week, Visualization Library, Montage Studio, Publications, Content Calendar, Settings
- [x] Dark theme with CodexYield brand colors
- [x] App.tsx routes for all pages
- [x] NotFound page

## Sunday Visualization Engine
- [x] vizGenerator.ts reads all 8 tradinghq tables
- [x] AI narration generation per chart (opinionated analyst voice, no em dashes)
- [x] AI prediction generation per chart
- [x] Chart image generation via AI image gen, stored to S3
- [x] Core thesis embedded in every AI prompt: "CodexYield generates more BTC than buy-and-hold"
- [x] tRPC: generateWeeklyVisualizations mutation
- [x] tRPC: getVisualizations query (by week, by category)
- [x] tRPC: getWeeks query (distinct weeks)
- [x] UI: Visualization Library page (grid by week/category, detail modal, TTS audio)

## Montage Studio
- [x] UI: This Week dashboard (status overview, quick actions)
- [x] UI: Montage Studio (chart selection, script generation, reaction upload, publish)
- [x] Server: TTS voiceover generation per chart segment
- [x] Server: AI script/conversation guide generation (frames every video around beating BTC buy-and-hold)
- [x] Server: Final metadata generation (YouTube title/description/tags, X copy, LinkedIn copy)
- [x] tRPC: createMontage, generateScript, generateTts, generateMetadata mutations
- [x] tRPC: uploadReactionVideo, postToYouTube, postToX mutations

## Publishing
- [x] Server: YouTube Data API v3 upload procedure
- [x] Server: X OAuth 2.0 posting (v2 API)
- [x] UI: Approval screen in Montage Studio
- [x] UI: LinkedIn copy-to-clipboard button

## Publications Manager
- [x] UI: Publications page (list by type, bulk import, external link form)
- [x] Server: Bulk LinkedIn URL import with AI title extraction
- [x] tRPC: importLinkedInPublications, addPublication, getPublications

## Content Calendar
- [x] UI: Content Calendar page (weekly view, draft cards, approval workflow)
- [x] tRPC: getContentDrafts, generateDraft, approve, reject mutations
- [x] Core thesis embedded in all AI draft generation prompts

## Settings
- [x] Settings page (X OAuth status, LinkedIn info, content thesis display)

## Tests
- [x] 10 vitest tests passing (DB helpers, week deduplication, core thesis enforcement)

## Deployment
- [ ] Push to HalfacreResearch/codex-socialmedia
- [ ] Configure Hostinger auto-deploy
- [ ] Verify live at socialmedia.codexyield.com

## Future Enhancements
- [ ] Sunday cron job auto-trigger (currently manual via UI button)
- [ ] YouTube OAuth flow (currently uses API key only)
- [ ] Reaction video stitching (currently packages metadata, manual stitch)
- [ ] LinkedIn scraper for bulk import (currently uses AI to infer title from URL slug)
- [ ] Public REST API endpoints for codexyield.com and pitch (GET /api/v1/stats, /visualizations, /publications)
