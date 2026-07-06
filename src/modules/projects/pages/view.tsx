import { ProjectDetail } from "../components/ProjectDetail";

type ProjectViewPageProps = {
  projectId: string;
};

export default function ProjectViewPage({ projectId }: ProjectViewPageProps) {
  return <ProjectDetail projectId={projectId} />;
}
