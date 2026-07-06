import { ProductTemplateRulesEditor } from "../components/ProductTemplateRulesEditor";

type ProductTemplateVersionRulesPageProps = {
  versionId: string;
};

export default function ProductTemplateVersionRulesPage({
  versionId,
}: ProductTemplateVersionRulesPageProps) {
  return <ProductTemplateRulesEditor versionId={versionId} />;
}
