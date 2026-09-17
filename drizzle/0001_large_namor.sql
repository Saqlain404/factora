CREATE TYPE "public"."mould_status" AS ENUM('required', 'ordered', 'received', 'trial', 'active');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"contact_phone" text,
	"email" text,
	"gstin" text,
	"state" text DEFAULT 'Uttar Pradesh' NOT NULL,
	"state_code" text DEFAULT '09' NOT NULL,
	"address" text,
	"credit_period_days" integer DEFAULT 30 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "customers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "machines" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"capacity" numeric(14, 3),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "machines_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "moulds" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"status" "mould_status" DEFAULT 'required' NOT NULL,
	"supplier_id" text,
	"cost" numeric(14, 2) DEFAULT 0 NOT NULL,
	"received_at" timestamp with time zone,
	"trial_at" timestamp with time zone,
	"active_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "moulds_code_unique" UNIQUE("code"),
	CONSTRAINT "moulds_cost_non_negative" CHECK ("moulds"."cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"unit" text NOT NULL,
	"mould_id" text,
	"hsn_code" text,
	"gst_rate" numeric(6, 2) DEFAULT 0 NOT NULL,
	"selling_price" numeric(14, 2) DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "products_code_unique" UNIQUE("code"),
	CONSTRAINT "products_selling_price_non_negative" CHECK ("products"."selling_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "raw_materials" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"unit" text NOT NULL,
	"hsn_code" text,
	"current_rate" numeric(14, 2) DEFAULT 0 NOT NULL,
	"gst_rate" numeric(6, 2) DEFAULT 0 NOT NULL,
	"min_stock_qty" numeric(14, 3) DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "raw_materials_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"contact_phone" text,
	"email" text,
	"gstin" text,
	"address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "suppliers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "moulds" ADD CONSTRAINT "moulds_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_mould_id_moulds_id_fk" FOREIGN KEY ("mould_id") REFERENCES "public"."moulds"("id") ON DELETE no action ON UPDATE no action;