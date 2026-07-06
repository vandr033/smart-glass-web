import { ProductTemplateVersionDetail } from "../components/ProductTemplateVersionDetail";

type ProductTemplateVersionViewPageProps = {
  canManage: boolean;
  versionId: string;
};

export default function ProductTemplateVersionViewPage({
  canManage,
  versionId,
}: ProductTemplateVersionViewPageProps) {
  return <ProductTemplateVersionDetail canManage={canManage} versionId={versionId} />;
}
