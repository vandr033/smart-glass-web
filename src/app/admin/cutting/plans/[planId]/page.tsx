import { redirect } from "next/navigation";

export default async function AdminCuttingPlanRedirect({
  params,
}: {
  params: Promise<{
    planId: string;
  }>;
}) {
  const { planId } = await params;
  redirect(`/cutting/plans/${planId}`);
}
