CREATE TABLE `repair_service_overrides` (
	`id` text PRIMARY KEY NOT NULL,
	`icon` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`sort_order` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_repair_service_overrides_active_sort` ON `repair_service_overrides` (`active`,`sort_order`);--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `active` integer DEFAULT true NOT NULL;