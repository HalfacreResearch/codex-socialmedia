CREATE TABLE `content_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`montage_id` int,
	`publication_id` int,
	`platform` enum('x','linkedin','youtube') NOT NULL,
	`draft_copy` text NOT NULL,
	`status` enum('draft','approved','rejected','posted') NOT NULL DEFAULT 'draft',
	`posted_at` timestamp,
	`post_id` varchar(128),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_drafts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `montages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`week_of` date NOT NULL,
	`title` varchar(255),
	`description` text,
	`tags` json,
	`chapter_markers` json,
	`visualization_ids` json NOT NULL,
	`youtube_clip_urls` json DEFAULT ('[]'),
	`ai_script` text,
	`target_duration_seconds` int DEFAULT 480,
	`actual_duration_seconds` int,
	`status` enum('draft','assembling','ready_for_reaction','reaction_uploaded','metadata_ready','approved','posted') NOT NULL DEFAULT 'draft',
	`montage_video_url` text,
	`reaction_video_url` text,
	`thumbnail_url` text,
	`youtube_video_id` varchar(64),
	`x_post_id` varchar(64),
	`linkedin_copy` text,
	`x_copy` text,
	`youtube_copy` text,
	`posted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `montages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshot_date` date NOT NULL,
	`aum_usd` bigint,
	`btc_alpha_percent` varchar(16),
	`cagr_percent` varchar(16),
	`total_trades` int DEFAULT 0,
	`win_rate_percent` varchar(16),
	`active_clients` int DEFAULT 0,
	`total_rotations` int DEFAULT 0,
	`profitable_rotations` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performance_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `publications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('newsletter','article','podcast','speech','video','blog') NOT NULL,
	`title` varchar(512) NOT NULL,
	`url` text,
	`platform` varchar(64),
	`published_at` timestamp NOT NULL,
	`summary` text,
	`content_body` text,
	`thumbnail_url` text,
	`featured` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visualizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(64) NOT NULL,
	`chart_type` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`image_url` text NOT NULL,
	`ai_narration` text,
	`ai_prediction` text,
	`tts_audio_url` text,
	`source_table` varchar(64) NOT NULL,
	`week_of` date NOT NULL,
	`duration_seconds` int DEFAULT 45,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visualizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `x_oauth_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`account_handle` varchar(64) NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`token_type` varchar(32) DEFAULT 'bearer',
	`scope` text,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `x_oauth_tokens_id` PRIMARY KEY(`id`)
);
