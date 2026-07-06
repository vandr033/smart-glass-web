import { SupplierDetail } from "../components/SupplierDetail";

type SupplierViewPageProps = {
  supplierId: string;
};

export default function SupplierViewPage({ supplierId }: SupplierViewPageProps) {
  return <SupplierDetail supplierId={supplierId} />;
}
