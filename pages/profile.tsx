import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { uploadAvatarFileToSupabase } from "@/utils/supabase/clients/storage";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
import { api } from "@/utils/trpc/api";
import { Subject } from "@/server/models/auth";

export default function ProfilePage() {
  const profileQuery = api.profiles.me.useQuery();

  const apiUtils = api.useUtils();
  const supabase = createSupabaseComponentClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const updateAvatarMutation = api.profiles.updateProfilePicture.useMutation({
    onSuccess: async () => {
      toast.success("Profile picture updated!");
      await apiUtils.profiles.me.invalidate();
    },
    onError: () => toast.error("Failed to update profile picture."),
  });

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
    <div className="min-h-screen w-full bg-[#f5f5f5]">
      <div className="mx-auto max-w-[1500px] px-5 py-5 md:px-8">
        <div className="grid min-h-[calc(100vh-10rem)] grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="border-b border-zinc-500 px-4 py-4 lg:border-b-0 lg:border-r lg:px-5 lg:py-2">
            <h1 className="text-4xl font-semibold text-black md:text-5xl">
              Profile
            </h1>

            <div className="mt-8 flex justify-center">
              <div className="w-full max-w-[620px]">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xl font-medium text-black">
                      Full Name
                    </label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={profileQuery.data?.full_name ?? "Rose Doe"}
                      className="w-full rounded-[6px] border border-zinc-300 bg-white px-4 py-3 text-xl text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xl font-medium text-black">
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
                    <label className="mb-2 block text-xl font-medium text-black">
                      Job Title
                    </label>
                    <input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder={profileQuery.data?.job_role ?? "Manager"}
                      className="w-full rounded-[6px] border border-zinc-300 bg-white px-4 py-3 text-xl text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xl font-medium text-black">
                      Organization
                    </label>
                    <input
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder={
                        profileQuery.data?.organization ?? "Nonprofit"
                      }
                      className="w-full rounded-[6px] border border-zinc-300 bg-white px-4 py-3 text-xl text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                </div>

                <div className="mt-12 flex justify-center">
                  <Link
                    href="/changepassword"
                    className="inline-flex min-w-[220px] items-center justify-center rounded-full border border-zinc-500 px-8 py-3 text-xl font-medium text-black transition hover:bg-zinc-200"
                  >
                    Change Password
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="px-6 py-8 lg:px-4 xl:px-2">
            <div className="ml-auto flex h-full w-full max-w-[860px] flex-col">
              <div className="flex flex-1 items-center justify-center">
                <div className="group relative flex h-[310px] w-[310px] items-center justify-center md:h-[380px] md:w-[380px]">
                  <Avatar className="h-[310px] w-[310px] rounded-full bg-[#d8e6f5] md:h-[380px] md:w-[380px]">
                    <AvatarImage
                      src={avatarPublicUrl}
                      className="h-full w-full object-cover"
                    />
                    <AvatarFallback className="h-full w-full bg-[#d8e6f5] text-7xl font-semibold text-zinc-700 md:text-8xl">
                      {initials || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="pointer-events-none absolute inset-0 rounded-full bg-black/0 transition-colors duration-200 group-hover:bg-black/18" />
                  <input
                    className="hidden"
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    aria-label="Edit profile image"
                    onClick={() => {
                      if (fileInputRef && fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className="absolute bottom-5 right-5 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-600 bg-white text-2xl text-black shadow-sm transition hover:bg-zinc-100 md:bottom-6 md:right-6 md:h-14 md:w-14"
                  >
                    ✎
                  </button>
                </div>
              </div>

              <div className="mt-10 flex w-full items-center justify-end gap-2 pr-0 lg:-mr-2 xl:-mr-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex min-w-[160px] items-center justify-center text-xl font-medium text-black transition hover:opacity-70"
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
                  className="inline-flex min-w-[160px] items-center justify-center rounded-full bg-[#d1d3de] px-8 py-3 text-xl font-medium text-white transition enabled:bg-[#0795b8] enabled:hover:bg-[#067f9d] disabled:cursor-not-allowed"
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
