import { ProductTemplateDetail } from "../components/ProductTemplateDetail";

type ProductTemplateViewPageProps = {
  canManage: boolean;
  templateId: string;
};

export default function ProductTemplateViewPage({
  canManage,
  templateId,
}: ProductTemplateViewPageProps) {
  return <ProductTemplateDetail canManage={canManage} templateId={templateId} />;
}
