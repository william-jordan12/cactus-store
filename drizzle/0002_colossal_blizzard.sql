CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorName` varchar(191) NOT NULL,
	`rating` int NOT NULL DEFAULT 5,
	`content` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `customerPhone` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingAddress` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `billingAddress` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentMethod` varchar(64);