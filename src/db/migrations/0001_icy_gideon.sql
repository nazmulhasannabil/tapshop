CREATE TABLE "saved_bills" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"bill_date" date DEFAULT CURRENT_DATE NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"item_count" integer NOT NULL,
	"items" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_bills" ADD CONSTRAINT "saved_bills_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saved_bills_user_created_idx" ON "saved_bills" USING btree ("user_id","created_at");