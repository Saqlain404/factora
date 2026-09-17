import type { Metadata } from "next";
import { listProducts } from "@/modules/products/queries";
import { listMoulds } from "@/modules/moulds/queries";
import { ProductsTable } from "./products-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  const [products, moulds] = await Promise.all([listProducts(), listMoulds()]);
  return <ProductsTable products={products} moulds={moulds} />;
}