"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({
  userId,
  currentName,
  currentEmail,
}: {
  userId: string;
  currentName: string;
  currentEmail: string;
}) {
  const router = useRouter();

  // Name State
  const [name, setName] = useState(currentName);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ type: string; text: string } | null>(null);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: string; text: string } | null>(null);

  // Handle Name Update
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
        // Refresh session so navbar shows new name
        router.refresh();
      } else {
        setNameMsg({ type: "error", text: data.error ?? "Failed to update name." });
      }
    } catch {
      setNameMsg({ type: "error", text: "Something went wrong." });
    } finally {
      setNameLoading(false);
    }
  }

  // Handle Password Update
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
        <h2 className="mb-4 text-xl font-bold text-white">Display Name</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-subtle bg-base/60 px-4 py-2.5 text-base text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-accent/60"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Email
            </label>
            <input
              type="text"
              value={currentEmail}
              disabled
              className="w-full cursor-not-allowed rounded-md border border-subtle bg-base/60 px-4 py-2.5 text-base text-text-primary opacity-50 outline-none"
            />
            <p className="mt-1 text-xs text-text-tertiary">
              Email cannot be changed.
            </p>
          </div>
          
          {nameMsg && (
            <div
              className={`rounded-md p-3 text-sm ${
                nameMsg.type === "error"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-green-500/10 text-green-400"
              }`}
            >
              {nameMsg.text}
            </div>
          )}
          
          <button
            onClick={handleNameSave}
            disabled={nameLoading}
            className="btn-primary mt-2 w-fit"
          >
            {nameLoading ? "Saving..." : "Save Name"}
          </button>
        </div>
      </div>

      {/* Password Section */}
      <div className="card p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Change Password</h2>
        <div className="flex flex-col gap-4">
          {[
            { label: "Current Password", value: currentPassword, set: setCurrentPassword },
            { label: "New Password", value: newPassword, set: setNewPassword },
            { label: "Confirm New Password", value: confirmPassword, set: setConfirmPassword },
          ].map((field, idx) => (
            <div key={idx}>
              <label className="mb-1 block text-sm font-medium text-text-secondary">
                {field.label}
              </label>
              <input
                type="password"
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                className="w-full rounded-md border border-subtle bg-base/60 px-4 py-2.5 text-base text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-accent/60"
              />
            </div>
          ))}
          
          {passMsg && (
            <div
              className={`rounded-md p-3 text-sm ${
                passMsg.type === "error"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-green-500/10 text-green-400"
              }`}
            >
              {passMsg.text}
            </div>
          )}
          
          <button
            onClick={handlePasswordSave}
            disabled={passLoading}
            className="btn-primary mt-2 w-fit"
          >
            {passLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}