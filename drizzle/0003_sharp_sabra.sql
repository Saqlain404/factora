CREATE TYPE "public"."batch_status" AS ENUM('in_progress', 'completed', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."inventory_transaction_type" ADD VALUE 'PRODUCTION_RETURN' BEFORE 'DISPATCH';--> statement-breakpoint
CREATE TABLE "batch_costs" (
	"id" text PRIMARY KEY NOT NULL,
	"batch_id" text NOT NULL,
	"material_cost" numeric(14, 2) DEFAULT 0 NOT NULL,
	"labour_cost" numeric(14, 2) DEFAULT 0 NOT NULL,
	"electricity_cost" numeric(14, 2) DEFAULT 0 NOT NULL,
	"mould_allocation" numeric(14, 2) DEFAULT 0 NOT NULL,
	"other_costs" numeric(14, 2) DEFAULT 0 NOT NULL,
	"total" numeric(14, 2) DEFAULT 0 NOT NULL,
	"entered_by" text,
	"entered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "batch_costs_batch_id_unique" UNIQUE("batch_id"),
	CONSTRAINT "batch_costs_total_matches_sum" CHECK ("batch_costs"."total" = "batch_costs"."material_cost" + "batch_costs"."labour_cost" + "batch_costs"."electricity_cost" + "batch_costs"."mould_allocation" + "batch_costs"."other_costs"),
	CONSTRAINT "batch_costs_total_non_negative" CHECK ("batch_costs"."total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "batch_materials" (
	"id" text PRIMARY KEY NOT NULL,
	"batch_id" text NOT NULL,
	"raw_material_id" text NOT NULL,
	"planned_qty" numeric(14, 3) NOT NULL,
	"reserved_at" timestamp with time zone,
	"consumed_qty" numeric(14, 3),
	"consumed_at" timestamp with time zone,
	"returned_at" timestamp with time zone,
	CONSTRAINT "batch_materials_planned_qty_positive" CHECK ("batch_materials"."planned_qty" > 0),
	CONSTRAINT "batch_materials_consumed_qty_non_negative" CHECK ("batch_materials"."consumed_qty" >= 0)
);
--> statement-breakpoint
CREATE TABLE "production_batches" (
	"id" text PRIMARY KEY NOT NULL,
	"batch_no" text NOT NULL,
	"order_id" text,
	"product_id" text NOT NULL,
	"machine_id" text NOT NULL,
	"mould_id" text NOT NULL,
	"plan_qty" numeric(14, 3) NOT NULL,
	"ok_qty" numeric(14, 3),
	"rejected_qty" numeric(14, 3),
	"status" "batch_status" DEFAULT 'in_progress' NOT NULL,
	"notes" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_by" text,
	"completed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "production_batches_batch_no_unique" UNIQUE("batch_no"),
	CONSTRAINT "production_batches_plan_qty_positive" CHECK ("production_batches"."plan_qty" > 0),
	CONSTRAINT "production_batches_ok_qty_non_negative" CHECK ("production_batches"."ok_qty" >= 0),
	CONSTRAINT "production_batches_rejected_qty_non_negative" CHECK ("production_batches"."rejected_qty" >= 0)
);
--> statement-breakpoint
ALTER TABLE "batch_costs" ADD CONSTRAINT "batch_costs_batch_id_production_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."production_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_costs" ADD CONSTRAINT "batch_costs_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_materials" ADD CONSTRAINT "batch_materials_batch_id_production_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."production_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_materials" ADD CONSTRAINT "batch_materials_raw_material_id_raw_materials_id_fk" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_mould_id_moulds_id_fk" FOREIGN KEY ("mould_id") REFERENCES "public"."moulds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "batch_materials_batch_id_idx" ON "batch_materials" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "production_batches_product_id_idx" ON "production_batches" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "production_batches_status_idx" ON "production_batches" USING btree ("status");