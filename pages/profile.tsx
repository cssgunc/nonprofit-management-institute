import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
import { api } from "@/utils/trpc/api";
import { Subject } from "@/server/models/auth";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { uploadAvatarFileToSupabase } from "@/utils/supabase/clients/storage";

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

  const updateEmail = api.profiles.handleEmailUpdate.useMutation({
    onSuccess: async () => {
      toast.success("Email updated successfully!");
      await profileQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update email.");
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
    const hasEmailChanged = email.trim() !== (profileQuery.data?.email ?? "");

    if (hasEmailChanged) {
      updateEmail.mutate({ email: email.trim() });
    }

    updateProfile.mutate({
      full_name: fullName.trim() || profileQuery.data?.full_name || "",
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
      email !== (profileQuery.data.email ?? "") ||
      jobTitle !== (profileQuery.data.job_role ?? "") ||
      organization !== (profileQuery.data.organization ?? "")),
  );

  const avatarPublicUrl = profileQuery.data?.avatar_url
    ? supabase.storage
        .from("avatars")
        .getPublicUrl(profileQuery.data.avatar_url).data.publicUrl
    : undefined;

  return (
    <div className="w-full bg-[#f5f5f5]">
      <div className="mx-auto max-w-[1360px] px-4 py-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="border-b border-gray-300 px-4 py-4 lg:border-b-0 lg:border-r lg:px-5 lg:py-3">
            <h1 className="text-3xl font-semibold text-black md:text-4xl">
              Profile
            </h1>

            <div className="mt-5 flex justify-center">
              <div className="w-full max-w-[560px]">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-lg font-medium text-black">
                      Full Name
                    </label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={profileQuery.data?.full_name ?? "Rose Doe"}
                      className="w-full rounded-[6px] border border-zinc-300 bg-white px-4 py-2.5 text-lg text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-lg font-medium text-black">
                      Email
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        profileQuery.data?.email ?? "Rosedoe123@gmail.com"
                      }
                      className="w-full rounded-[6px] border border-zinc-300 bg-white px-4 py-3 text-xl text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-lg font-medium text-black">
                      Job Title
                    </label>
                    <input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder={profileQuery.data?.job_role ?? "Manager"}
                      className="w-full rounded-[6px] border border-zinc-300 bg-white px-4 py-2.5 text-lg text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-lg font-medium text-black">
                      Organization
                    </label>
                    <input
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder={
                        profileQuery.data?.organization ?? "Nonprofit"
                      }
                      className="w-full rounded-[6px] border border-zinc-300 bg-white px-4 py-2.5 text-lg text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <Link
                    href="/changepassword"
                    className="inline-flex min-w-[210px] items-center justify-center rounded-full border border-zinc-500 px-7 py-2.5 text-lg font-medium text-black transition hover:bg-zinc-200"
                  >
                    Change Password
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="px-5 py-6 lg:px-4 xl:px-2">
            <div className="flex h-full w-full flex-col">
              <div className="relative flex min-h-[260px] items-center justify-center lg:flex-1">
                <div className="group relative flex h-[240px] w-[240px] items-center justify-center md:h-[300px] md:w-[300px] lg:absolute lg:left-[56%] lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
                  <Avatar className="h-[240px] w-[240px] rounded-full bg-[#d8e6f5] md:h-[300px] md:w-[300px]">
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
                    className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-600 bg-white text-xl text-black shadow-sm transition hover:bg-zinc-100 md:bottom-5 md:right-5 md:h-12 md:w-12"
                  >
                    ✎
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

              <div className="mt-6 flex w-full items-center justify-end gap-2 pr-0 lg:-mr-2 xl:-mr-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex min-w-[140px] items-center justify-center text-lg font-medium text-black transition hover:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    updateProfile.isPending ||
                    updateEmail.isPending ||
                    profileQuery.isLoading ||
                    !hasChanges
                  }
                  className="inline-flex min-w-[140px] items-center justify-center rounded-full bg-[#d1d3de] px-7 py-2.5 text-lg font-medium text-white transition enabled:bg-[#0795b8] enabled:hover:bg-[#067f9d] disabled:cursor-not-allowed"
                >
                  {updateProfile.isPending || updateEmail.isPending
                    ? "Saving..."
                    : "Save"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
