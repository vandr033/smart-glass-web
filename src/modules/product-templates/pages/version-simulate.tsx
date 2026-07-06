import { ProductTemplateSimulation } from "../components/ProductTemplateSimulation";

type ProductTemplateVersionSimulatePageProps = {
  canViewHistory: boolean;
  versionId: string;
};

export default function ProductTemplateVersionSimulatePage({
  canViewHistory,
  versionId,
}: ProductTemplateVersionSimulatePageProps) {
  return (
    <ProductTemplateSimulation
      canViewHistory={canViewHistory}
      versionId={versionId}
    />
  );
}
