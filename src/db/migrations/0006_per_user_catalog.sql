-- Per-user catalog isolation: shared system defaults + private user rows.
--> statement-breakpoint
INSERT INTO "user" ("id", "name", "email", "email_verified", "role", "is_active")
VALUES (
	'00000000-0000-4000-8000-000000000000',
	'TapShop',
	'system@tapshop.local',
	true,
	'user',
	false
)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
UPDATE "categories"
SET "created_by" = '00000000-0000-4000-8000-000000000000'
WHERE "id" IN ('cat_grocery', 'cat_hangout', 'cat_party');
--> statement-breakpoint
UPDATE "items"
SET "created_by" = '00000000-0000-4000-8000-000000000000'
WHERE "created_by" IS NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS "categories_name_unique_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX "categories_owner_name_uidx" ON "categories" USING btree ("created_by", lower("name"));
