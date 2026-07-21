import PortfolioApp from "@/components/PortfolioApp";
import { getVideos } from "@/lib/videos";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialVideos = await getVideos();
  return <PortfolioApp initialVideos={initialVideos} />;
}
