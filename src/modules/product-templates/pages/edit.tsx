import { ProductTemplateForm } from "../components/ProductTemplateForm";

type EditProductTemplatePageProps = {
  templateId: string;
};

export default function EditProductTemplatePage({
  templateId,
}: EditProductTemplatePageProps) {
  return <ProductTemplateForm mode="edit" templateId={templateId} />;
}
