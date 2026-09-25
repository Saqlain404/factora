CREATE TYPE "public"."dispatch_status" AS ENUM('pending', 'in_transit', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE "dispatch_items" (
	"id" text PRIMARY KEY NOT NULL,
	"dispatch_id" text NOT NULL,
	"so_item_id" text NOT NULL,
	"product_id" text NOT NULL,
	"qty" numeric(14, 3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dispatch_items_qty_positive" CHECK ("dispatch_items"."qty" > 0)
);
--> statement-breakpoint
CREATE TABLE "dispatches" (
	"id" text PRIMARY KEY NOT NULL,
	"dispatch_no" text NOT NULL,
	"so_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"status" "dispatch_status" DEFAULT 'pending' NOT NULL,
	"dispatch_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_delivery_date" timestamp with time zone,
	"actual_delivery_date" timestamp with time zone,
	"vehicle_no" text,
	"driver_name" text,
	"driver_phone" text,
	"notes" text,
	"created_by" text,
	"delivered_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dispatches_dispatch_no_unique" UNIQUE("dispatch_no"),
	CONSTRAINT "dispatches_dispatch_no_unique" CHECK ("dispatches"."dispatch_no" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_dispatch_id_dispatches_id_fk" FOREIGN KEY ("dispatch_id") REFERENCES "public"."dispatches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_so_item_id_sales_order_items_id_fk" FOREIGN KEY ("so_item_id") REFERENCES "public"."sales_order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_so_id_sales_orders_id_fk" FOREIGN KEY ("so_id") REFERENCES "public"."sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_delivered_by_users_id_fk" FOREIGN KEY ("delivered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;