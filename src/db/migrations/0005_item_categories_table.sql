CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_unique_idx" ON "categories" USING btree ("name");
--> statement-breakpoint
CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "categories" ("id", "name") VALUES
	('cat_grocery', 'Grocery'),
	('cat_hangout', 'Hangout'),
	('cat_party', 'Party')
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "category_id" text;
--> statement-breakpoint
UPDATE "items" SET "category_id" = CASE lower("category")
	WHEN 'grocery' THEN 'cat_grocery'
	WHEN 'party' THEN 'cat_party'
	ELSE 'cat_hangout'
END
WHERE "category_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "category_id" SET DEFAULT 'cat_hangout';
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "category_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "items_category_id_idx" ON "items" USING btree ("category_id");
--> statement-breakpoint
DROP INDEX IF EXISTS "items_category_idx";
--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN IF EXISTS "category";
