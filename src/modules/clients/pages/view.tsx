import { ClientDetail } from "../components/ClientDetail";

type ClientViewPageProps = {
  clientId: string;
};

export default function ClientViewPage({ clientId }: ClientViewPageProps) {
  return <ClientDetail clientId={clientId} />;
}
