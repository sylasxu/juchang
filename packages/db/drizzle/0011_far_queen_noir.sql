-- Create new enums for global keywords system
CREATE TYPE "public"."keyword_response_type" AS ENUM('widget_explore', 'widget_draft', 'widget_launcher', 'widget_action', 'widget_ask_preference', 'text');--> statement-breakpoint
CREATE TYPE "public"."match_type" AS ENUM('exact', 'prefix', 'fuzzy');--> statement-breakpoint

-- Create global_keywords table
CREATE TABLE "global_keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword" varchar(100) NOT NULL,
	"match_type" "match_type" NOT NULL,
	"response_type" "keyword_response_type" NOT NULL,
	"response_content" jsonb NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"hit_count" integer DEFAULT 0 NOT NULL,
	"conversion_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "group_open_id" varchar(64);--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "dynamic_message_id" varchar(64);--> statement-breakpoint
ALTER TABLE "global_keywords" ADD CONSTRAINT "global_keywords_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_global_keywords_keyword" ON "global_keywords" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "idx_global_keywords_active" ON "global_keywords" USING btree ("is_active","valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "idx_global_keywords_priority" ON "global_keywords" USING btree ("priority");