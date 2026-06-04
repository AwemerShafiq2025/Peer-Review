import Navbar from "@/components/Navbar";
import HomePageClient from "@/components/HomePageClient";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main id="top">
      <Navbar />
      <HomePageClient isAuthenticated={!!session?.user} />
    </main>
  );
}
