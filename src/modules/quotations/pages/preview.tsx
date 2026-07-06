import { QuotationPreview } from "../components/QuotationPreview";

type QuotationPreviewPageProps = {
  quotationId: string;
};

export default function QuotationPreviewPage({
  quotationId,
}: QuotationPreviewPageProps) {
  return <QuotationPreview quotationId={quotationId} />;
}
