CREATE TABLE "debt_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"created_by" text NOT NULL,
	"lender_user_id" text,
	"borrower_user_id" text,
	"lender_name" text NOT NULL,
	"borrower_name" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"occurred_on" date NOT NULL,
	"note" text,
	"status" text DEFAULT 'open' NOT NULL,
	"friendship_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friend_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"inviter_id" text NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friend_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" text PRIMARY KEY NOT NULL,
	"requester_id" text NOT NULL,
	"addressee_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friendships_pair_uc" UNIQUE("requester_id","addressee_id")
);
--> statement-breakpoint
ALTER TABLE "debt_entries" ADD CONSTRAINT "debt_entries_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_entries" ADD CONSTRAINT "debt_entries_lender_user_id_user_id_fk" FOREIGN KEY ("lender_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_entries" ADD CONSTRAINT "debt_entries_borrower_user_id_user_id_fk" FOREIGN KEY ("borrower_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_entries" ADD CONSTRAINT "debt_entries_friendship_id_friendships_id_fk" FOREIGN KEY ("friendship_id") REFERENCES "public"."friendships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_invites" ADD CONSTRAINT "friend_invites_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_user_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "debt_entries_created_by_idx" ON "debt_entries" USING btree ("created_by","status");--> statement-breakpoint
CREATE INDEX "debt_entries_lender_idx" ON "debt_entries" USING btree ("lender_user_id","status");--> statement-breakpoint
CREATE INDEX "debt_entries_borrower_idx" ON "debt_entries" USING btree ("borrower_user_id","status");--> statement-breakpoint
CREATE INDEX "debt_entries_occurred_on_idx" ON "debt_entries" USING btree ("occurred_on");--> statement-breakpoint
CREATE INDEX "friend_invites_inviter_idx" ON "friend_invites" USING btree ("inviter_id","status");--> statement-breakpoint
CREATE INDEX "friend_invites_email_idx" ON "friend_invites" USING btree ("email","status");--> statement-breakpoint
CREATE INDEX "friendships_requester_idx" ON "friendships" USING btree ("requester_id","status");--> statement-breakpoint
CREATE INDEX "friendships_addressee_idx" ON "friendships" USING btree ("addressee_id","status");