"use client";

import { useState } from "react";

export default function ProfileForm({
  userId,
  currentName,
  currentEmail,
}: {
  userId: string;
  currentName: string;
  currentEmail: string;
}) {
  const [name, setName] = useState(currentName);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ type: string; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: string; text: string } | null>(null);

  async function handleNameSave() {
    if (!name.trim()) return;
    setNameLoading(true);
    setNameMsg(null);
    try {
      const res = await fetch("/api/profile/name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNameMsg({ type: "success", text: "Name updated successfully!" });
      } else {
        setNameMsg({ type: "error", text: data.error ?? "Failed to update name." });
      }
    } catch {
      setNameMsg({ type: "error", text: "Something went wrong." });
    } finally {
      setNameLoading(false);
    }
  }

  async function handlePasswordSave() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassMsg({ type: "error", text: "All fields are required." });
      return;
    }
    if (newPassword.length < 8) {
      setPassMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    setPassLoading(true);
    setPassMsg(null);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPassMsg({ type: "success", text: "Password updated successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPassMsg({ type: "error", text: data.error ?? "Failed to update password." });
      }
    } catch {
      setPassMsg({ type: "error", text: "Something went wrong." });
    } finally {
      setPassLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Name Section */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Display Name</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-subtle bg-base/60 px-4 py-2.5 text-base text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-accent/60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
            <input
              type="text"
              value={currentEmail}
              disabled
              className="w-full rounded-md border border-subtle bg-base/60 px-4 py-2.5 text-base text-text-primary outline-none opacity-50 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-text-tertiary">Email cannot be changed.</p>
          </div>

          {nameMsg && (
            <div className={`p-3 rounded-md text-sm ${nameMsg.type === "error" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
              {nameMsg.text}
            </div>
          )}
          
          <button onClick={handleNameSave} disabled={nameLoading} className="btn-primary w-fit mt-2">
            {nameLoading ? "Saving..." : "Save Name"}
          </button>
        </div>
      </div>

      {/* Password Section */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Change Password</h2>
        <div className="flex flex-col gap-4">
          {[
            { label: "Current Password", value: currentPassword, set: setCurrentPassword },
            { label: "New Password", value: newPassword, set: setNewPassword },
            { label: "Confirm New Password", value: confirmPassword, set: setConfirmPassword },
          ].map((field, idx) => (
            <div key={idx}>
              <label className="block text-sm font-medium text-text-secondary mb-1">{field.label}</label>
              <input
                type="password"
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                className="w-full rounded-md border border-subtle bg-base/60 px-4 py-2.5 text-base text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-accent/60"
              />
            </div>
          ))}
          {passMsg && (
             <div className={`p-3 rounded-md text-sm ${passMsg.type === "error" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
              {passMsg.text}
            </div>
          )}
          
          <button onClick={handlePasswordSave} disabled={passLoading} className="btn-primary w-fit mt-2">
            {passLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}