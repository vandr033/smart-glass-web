import { QuotationDetail } from "../components/QuotationDetail";

type QuotationViewPageProps = {
  quotationId: string;
};

export default function QuotationViewPage({
  quotationId,
}: QuotationViewPageProps) {
  return <QuotationDetail quotationId={quotationId} />;
}
