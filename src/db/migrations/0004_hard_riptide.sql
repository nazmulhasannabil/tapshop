ALTER TABLE "items" ADD COLUMN "category" text DEFAULT 'hangout' NOT NULL;--> statement-breakpoint
CREATE INDEX "items_category_idx" ON "items" USING btree ("category");