ALTER TABLE `product_overrides` ADD `price` text;--> statement-breakpoint
ALTER TABLE `repair_service_overrides` ADD `price` text;--> statement-breakpoint
ALTER TABLE `repair_service_overrides` ADD `image_id` text REFERENCES media(id);