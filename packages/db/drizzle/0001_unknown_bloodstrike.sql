CREATE TYPE "public"."home_message_role" AS ENUM('user', 'ai');--> statement-breakpoint
CREATE TYPE "public"."home_message_type" AS ENUM('text', 'widget_dashboard', 'widget_draft', 'widget_share', 'widget_explore', 'widget_error');--> statement-breakpoint
ALTER TYPE "public"."activity_status" ADD VALUE 'draft' BEFORE 'active';--> statement-breakpoint
CREATE TABLE "group_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"sender_id" uuid,
	"type" "message_type" DEFAULT 'text' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "home_message_role" NOT NULL,
	"type" "home_message_type" NOT NULL,
	"content" jsonb NOT NULL,
	"activity_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "chat_messages" CASCADE;--> statement-breakpoint
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_messages" ADD CONSTRAINT "home_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_messages" ADD CONSTRAINT "home_messages_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "group_messages_activity_idx" ON "group_messages" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "group_messages_created_idx" ON "group_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "home_messages_user_idx" ON "home_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "home_messages_created_idx" ON "home_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "home_messages_activity_idx" ON "home_messages" USING btree ("activity_id");