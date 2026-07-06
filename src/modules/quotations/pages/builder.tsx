import { QuotationBuilder } from "../components/QuotationBuilder";

type QuotationBuilderPageProps = {
  quotationId: string;
};

export default function QuotationBuilderPage({
  quotationId,
}: QuotationBuilderPageProps) {
  return <QuotationBuilder quotationId={quotationId} />;
}
