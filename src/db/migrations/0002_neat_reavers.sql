ALTER TABLE "bill_entries" ALTER COLUMN "bill_date" SET DEFAULT (timezone('Asia/Dhaka', now()))::date;--> statement-breakpoint
ALTER TABLE "saved_bills" ALTER COLUMN "bill_date" SET DEFAULT (timezone('Asia/Dhaka', now()))::date;--> statement-breakpoint
CREATE INDEX "bill_entries_user_bill_date_idx" ON "bill_entries" USING btree ("user_id","bill_date");