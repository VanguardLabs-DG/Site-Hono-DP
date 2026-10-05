CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`game_name` text NOT NULL,
	`discord_tag` text NOT NULL,
	`age` integer NOT NULL,
	`desired_role` text NOT NULL,
	`availability` text NOT NULL,
	`experience` text NOT NULL,
	`scenario1` text NOT NULL,
	`scenario2` text NOT NULL,
	`motivation` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewer_notes` text,
	`reviewed_at` text,
	`reviewed_by` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`user_id` text,
	`user_name` text NOT NULL,
	`details` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `permissions_matrix` (
	`permission_key` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`suporte` integer DEFAULT false NOT NULL,
	`moderador` integer DEFAULT false NOT NULL,
	`administrador` integer DEFAULT false NOT NULL,
	`gerente` integer DEFAULT false NOT NULL,
	`diretor` integer DEFAULT false NOT NULL,
	`ceo` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`salt` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'player' NOT NULL,
	`avatar_url` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_email_unique` ON `profiles` (`email`);--> statement-breakpoint
CREATE TABLE `rules` (
	`category` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text
);
