import { redirect } from "next/navigation";

export default async function AdminCuttingOptimizationRedirect({
  params,
}: {
  params: Promise<{
    runId: string;
  }>;
}) {
  const { runId } = await params;
  redirect(`/cutting/optimizations/${runId}`);
}
