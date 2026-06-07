import Navbar from "@/components/Navbar";
import DeleteAccountButton from "@/components/DeleteAccountButton";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-base">
      <Navbar />
      <section className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="mt-2 text-text-secondary">Manage your PeerReviewer account.</p>

        {/* Danger Zone */}
        <div className="mt-10 rounded-xl border border-rose-400/20 bg-rose-500/5 p-6">
          <h2 className="font-semibold text-rose-300">Danger Zone</h2>
          <p className="mt-1.5 text-sm text-text-secondary">
            Permanently delete your account and all your review history. This action cannot be undone.
          </p>
          <DeleteAccountButton />
        </div>
      </section>
    </main>
  );
}