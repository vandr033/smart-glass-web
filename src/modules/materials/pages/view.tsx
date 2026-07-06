import { MaterialDetail } from "../components/MaterialDetail";

type MaterialViewPageProps = {
  materialId: string;
};

export default function MaterialViewPage({ materialId }: MaterialViewPageProps) {
  return <MaterialDetail materialId={materialId} />;
}
