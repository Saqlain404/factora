CREATE TYPE "public"."sales_order_status" AS ENUM('draft', 'confirmed', 'partial', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "sales_order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"so_id" text NOT NULL,
	"product_id" text NOT NULL,
	"qty" numeric(14, 3) NOT NULL,
	"rate" numeric(14, 2),
	"gst_rate" numeric(6, 2) DEFAULT 0 NOT NULL,
	"dispatched_qty" numeric(14, 3) DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_order_items_qty_positive" CHECK ("sales_order_items"."qty" > 0),
	CONSTRAINT "sales_order_items_rate_non_negative" CHECK ("sales_order_items"."rate" >= 0),
	CONSTRAINT "sales_order_items_dispatched_qty_non_negative" CHECK ("sales_order_items"."dispatched_qty" >= 0),
	CONSTRAINT "sales_order_items_dispatched_not_exceed_qty" CHECK ("sales_order_items"."dispatched_qty" <= "sales_order_items"."qty")
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"so_no" text NOT NULL,
	"customer_id" text NOT NULL,
	"status" "sales_order_status" DEFAULT 'draft' NOT NULL,
	"order_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_date" timestamp with time zone,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_orders_so_no_unique" UNIQUE("so_no"),
	CONSTRAINT "sales_orders_so_no_unique" CHECK ("sales_orders"."so_no" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_so_id_sales_orders_id_fk" FOREIGN KEY ("so_id") REFERENCES "public"."sales_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;