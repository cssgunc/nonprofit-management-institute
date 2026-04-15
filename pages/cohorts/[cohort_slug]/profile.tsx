import { useEffect } from "react";
import { useRouter } from "next/router";
import ProfilePage from "@/pages/profile";
import { api } from "@/utils/trpc/api";

export default function CohortProfilePage() {
  const router = useRouter();
  const profileQuery = api.profiles.me.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    if (profileQuery.data?.role !== "admin") return;
    void router.replace("/profile");
  }, [profileQuery.data?.role, router]);

  if (profileQuery.data?.role === "admin") {
    return null;
  }

  return <ProfilePage />;
}
