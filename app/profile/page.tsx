import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!session?.user || !userId) redirect("/login");

  return (
    <main className="min-h-screen bg-base">
      <Navbar />
      <section className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">Your Profile</h1>
        <p className="mt-2 text-text-secondary">Manage your account settings.</p>
        <div className="mt-8">
          <ProfileForm 
            userId={userId} 
            currentName={session.user.name || ""} 
            currentEmail={session.user.email || ""} 
          />
        </div>
      </section>
    </main>
  );
}