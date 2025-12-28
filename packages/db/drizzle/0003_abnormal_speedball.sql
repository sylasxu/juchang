CREATE TYPE "public"."activity_message_type" AS ENUM('text', 'system');--> statement-breakpoint
CREATE TYPE "public"."conversation_message_type" AS ENUM('text', 'widget_dashboard', 'widget_launcher', 'widget_action', 'widget_draft', 'widget_share', 'widget_explore', 'widget_error');--> statement-breakpoint
CREATE TYPE "public"."conversation_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TABLE "activity_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"sender_id" uuid,
	"message_type" "activity_message_type" DEFAULT 'text' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "conversation_role" NOT NULL,
	"message_type" "conversation_message_type" NOT NULL,
	"content" jsonb NOT NULL,
	"activity_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_messages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "home_messages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "group_messages" CASCADE;--> statement-breakpoint
DROP TABLE "home_messages" CASCADE;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "activity_messages" ADD CONSTRAINT "activity_messages_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_messages" ADD CONSTRAINT "activity_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_messages_activity_idx" ON "activity_messages" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_messages_created_idx" ON "activity_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "conversations_user_idx" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversations_created_idx" ON "conversations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "conversations_activity_idx" ON "conversations" USING btree ("activity_id");--> statement-breakpoint
DROP TYPE "public"."message_type";--> statement-breakpoint
DROP TYPE "public"."home_message_role";--> statement-breakpoint
DROP TYPE "public"."home_message_type";