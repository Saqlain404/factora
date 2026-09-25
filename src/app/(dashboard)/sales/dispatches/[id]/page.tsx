import { notFound } from "next/navigation";
import { getDispatchById } from "@/modules/sales/dispatch-queries";
import { DispatchDetailView } from "./dispatch-detail-view";

export default async function DispatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dispatch = await getDispatchById(id);

  if (!dispatch) {
    notFound();
  }

  return <DispatchDetailView dispatch={dispatch} />;
}