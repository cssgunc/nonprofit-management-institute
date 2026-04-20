import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
import { api } from "@/utils/trpc/api";
import { Subject } from "@/server/models/auth";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { uploadAvatarFileToSupabase } from "@/utils/supabase/clients/storage";
import { Camera } from "lucide-react";

export default function ProfilePage() {
  const profileQuery = api.profiles.me.useQuery();
  const apiUtils = api.useUtils();
  const supabase = createSupabaseComponentClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [organization, setOrganization] = useState("");

  useEffect(() => {
    if (!profileQuery.data) return;

    setFullName(profileQuery.data.full_name ?? "");
    setEmail(profileQuery.data.email ?? "");
    setJobTitle(profileQuery.data.job_role ?? "");
    setOrganization(profileQuery.data.organization ?? "");
  }, [profileQuery.data]);

  const updateProfile = api.profiles.updateMe.useMutation({
    onSuccess: async () => {
      toast.success("Profile updated successfully.");
      await profileQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile.");
    },
  });

  const updateAvatarMutation = api.profiles.updateProfilePicture.useMutation({
    onSuccess: async () => {
      toast.success("Profile picture updated!");
      await apiUtils.profiles.me.invalidate();
    },
    onError: () => {
      toast.error("Failed to update profile picture.");
    },
  });

  const resetForm = () => {
    setFullName(profileQuery.data?.full_name ?? "");
    setEmail(profileQuery.data?.email ?? "");
    setJobTitle(profileQuery.data?.job_role ?? "");
    setOrganization(profileQuery.data?.organization ?? "");
  };

  const handleSave = () => {
    updateProfile.mutate({
      full_name: fullName.trim() || profileQuery.data?.full_name || "",
      email: email.trim() || undefined,
      job_role: jobTitle.trim() || undefined,
      organization: organization.trim() || undefined,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileQuery.data) return;

    toast.loading("Uploading image...", { id: "avatar-upload" });

    uploadAvatarFileToSupabase(
      supabase,
      { id: profileQuery.data.id } as Subject,
      file,
      (avatar_url) => {
        updateAvatarMutation.mutate({ avatar_url });
        toast.dismiss("avatar-upload");
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      (error) => {
        console.error("Avatar upload failed:", error);
        toast.dismiss("avatar-upload");
        toast.error("Upload rejected by Supabase. Check RLS policies.");
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    );
  };

  const displayName = fullName.trim() || profileQuery.data?.full_name || "";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const hasChanges = Boolean(
    profileQuery.data &&
    (fullName !== (profileQuery.data.full_name ?? "") ||
      jobTitle !== (profileQuery.data.job_role ?? "") ||
      organization !== (profileQuery.data.organization ?? "")),
  );

  const avatarPublicUrl = profileQuery.data?.avatar_url
    ? supabase.storage
        .from("avatars")
        .getPublicUrl(profileQuery.data.avatar_url).data.publicUrl
    : undefined;

  return (
    <div className="app-muted-bg min-h-[calc(100vh-7rem)] w-full overflow-hidden">
      <div className="mx-auto max-w-[1280px] px-5 py-10 md:px-8 lg:py-14">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_430px] lg:gap-16">
          <section className="motion-rise">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-plum)]">
              Account Settings
            </p>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight text-[#1f2024] md:text-6xl">
              Profile
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#62636a]">
              Keep your participant details current for cohort discussions,
              materials access, and contact lists.
            </p>

            <div className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
              <label className="block">
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#6d6470]">
                  Full Name
                </span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={profileQuery.data?.full_name ?? "Rose Doe"}
                  className="mt-2 w-full border-0 border-b-2 border-[rgba(94,13,139,0.22)] bg-transparent px-0 pb-3 pt-2 text-2xl font-medium text-black placeholder:text-zinc-400 focus:border-[var(--brand-plum)] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#6d6470]">
                  Email
                </span>
                <input
                  value={email}
                  disabled
                  placeholder={profileQuery.data?.email ?? "Rosedoe123@gmail.com"}
                  className="mt-2 w-full cursor-not-allowed border-0 border-b-2 border-[rgba(0,138,171,0.18)] bg-transparent px-0 pb-3 pt-2 text-2xl font-medium text-zinc-500 placeholder:text-zinc-400 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#6d6470]">
                  Job Title
                </span>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder={profileQuery.data?.job_role ?? "Manager"}
                  className="mt-2 w-full border-0 border-b-2 border-[rgba(0,138,171,0.22)] bg-transparent px-0 pb-3 pt-2 text-2xl font-medium text-black placeholder:text-zinc-400 focus:border-[var(--brand-teal)] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#6d6470]">
                  Organization
                </span>
                <input
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder={profileQuery.data?.organization ?? "Nonprofit"}
                  className="mt-2 w-full border-0 border-b-2 border-[rgba(180,190,53,0.34)] bg-transparent px-0 pb-3 pt-2 text-2xl font-medium text-black placeholder:text-zinc-400 focus:border-[var(--brand-lime)] focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  updateProfile.isPending ||
                  profileQuery.isLoading ||
                  !hasChanges
                }
                className="inline-flex min-w-[150px] items-center justify-center rounded-full bg-[#d1d3de] px-7 py-3 text-base font-semibold text-white transition enabled:bg-[var(--brand-teal)] enabled:hover:bg-[#007997] disabled:cursor-not-allowed"
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-w-[120px] items-center justify-center rounded-full px-7 py-3 text-base font-semibold text-[#33343a] transition hover:bg-white/55"
              >
                Cancel
              </button>
              <Link
                href="/changepassword"
                className="inline-flex min-w-[190px] items-center justify-center rounded-full border border-[rgba(94,13,139,0.24)] bg-white/45 px-7 py-3 text-base font-semibold text-[var(--brand-plum)] transition hover:bg-white/75"
              >
                Change Password
              </Link>
            </div>
          </section>

          <aside className="motion-rise motion-delay-1 flex flex-col items-center pt-4 text-center lg:sticky lg:top-32">
            <div className="relative flex h-[280px] w-[280px] items-center justify-center md:h-[320px] md:w-[320px]">
              <div className="group relative flex h-[220px] w-[220px] items-center justify-center md:h-[250px] md:w-[250px]">
                <Avatar className="h-full w-full rounded-full bg-[#d8e6f5] shadow-[0_24px_70px_rgba(61,52,45,0.16)]">
                  <AvatarImage
                    src={avatarPublicUrl}
                    className="h-full w-full object-cover"
                  />
                  <AvatarFallback className="h-full w-full bg-[#d8e6f5] text-6xl font-semibold text-zinc-700 md:text-7xl">
                    {initials || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="pointer-events-none absolute inset-0 rounded-full bg-black/0 transition-colors duration-200 group-hover:bg-black/18" />
                <button
                  type="button"
                  aria-label="Edit profile image"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-plum)] text-white shadow-lg transition hover:bg-[#4f0b75]"
                >
                  <Camera className="h-5 w-5" aria-hidden="true" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <h2 className="mt-7 max-w-sm text-3xl font-semibold tracking-tight text-[#1f2024]">
              {displayName || "Your Profile"}
            </h2>
            <p className="mt-2 max-w-sm text-base leading-7 text-[#62636a]">
              {jobTitle || "Participant"}
              {organization ? ` at ${organization}` : ""}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
