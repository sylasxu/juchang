CREATE TYPE "public"."intent_match_outcome" AS ENUM('pending', 'confirmed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."partner_intent_status" AS ENUM('active', 'matched', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "partner_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"location_hint" varchar(100) NOT NULL,
	"location" geometry(point) NOT NULL,
	"time_preference" varchar(50),
	"meta_data" jsonb NOT NULL,
	"status" "partner_intent_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"match_score" integer NOT NULL,
	"common_tags" jsonb NOT NULL,
	"center_location" geometry(point) NOT NULL,
	"center_location_hint" varchar(100) NOT NULL,
	"temp_organizer_id" uuid NOT NULL,
	"lite_chat_id" uuid,
	"activity_id" uuid,
	"outcome" "intent_match_outcome" DEFAULT 'pending' NOT NULL,
	"confirm_deadline" timestamp NOT NULL,
	"matched_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_match_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"intent_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lite_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"sender_id" uuid,
	"message_type" varchar(20) DEFAULT 'text' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lite_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid,
	"activity_id" uuid,
	"title" varchar(100) NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "partner_intents" ADD CONSTRAINT "partner_intents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intent_matches" ADD CONSTRAINT "intent_matches_temp_organizer_id_users_id_fk" FOREIGN KEY ("temp_organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intent_matches" ADD CONSTRAINT "intent_matches_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intent_match_members" ADD CONSTRAINT "intent_match_members_match_id_intent_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."intent_matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intent_match_members" ADD CONSTRAINT "intent_match_members_intent_id_partner_intents_id_fk" FOREIGN KEY ("intent_id") REFERENCES "public"."partner_intents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intent_match_members" ADD CONSTRAINT "intent_match_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lite_chat_messages" ADD CONSTRAINT "lite_chat_messages_chat_id_lite_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."lite_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lite_chat_messages" ADD CONSTRAINT "lite_chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lite_chats" ADD CONSTRAINT "lite_chats_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "partner_intents_user_idx" ON "partner_intents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "partner_intents_status_idx" ON "partner_intents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "partner_intents_type_idx" ON "partner_intents" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "partner_intents_location_idx" ON "partner_intents" USING gist ("location");--> statement-breakpoint
CREATE INDEX "partner_intents_expires_idx" ON "partner_intents" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "intent_matches_outcome_idx" ON "intent_matches" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX "intent_matches_organizer_idx" ON "intent_matches" USING btree ("temp_organizer_id");--> statement-breakpoint
CREATE INDEX "intent_matches_deadline_idx" ON "intent_matches" USING btree ("confirm_deadline");--> statement-breakpoint
CREATE INDEX "intent_match_members_match_idx" ON "intent_match_members" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "intent_match_members_intent_idx" ON "intent_match_members" USING btree ("intent_id");--> statement-breakpoint
CREATE INDEX "intent_match_members_user_idx" ON "intent_match_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lite_chat_messages_chat_idx" ON "lite_chat_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "lite_chat_messages_created_idx" ON "lite_chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lite_chats_match_idx" ON "lite_chats" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "lite_chats_activity_idx" ON "lite_chats" USING btree ("activity_id");