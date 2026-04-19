import { useRouter } from "next/router";
import CohortAccessGuard from "@/components/CohortAccessGuard";
import ModuleGrid from "@/components/ModuleGrid";
import { api } from "@/utils/trpc/api";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { cohort_slug } = router.query;
  const cohortSlug = typeof cohort_slug === "string" ? cohort_slug : "";
  const profileQuery = api.profiles.me.useQuery(undefined, {
    retry: false,
  });
  const isAdmin = profileQuery.isSuccess && profileQuery.data.role === "admin";
  const utils = api.useUtils();

  const updateStatus = api.modules.updateModuleStatus.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Module "${data.slug}" is now ${data.is_active ? "active" : "inactive"}`,
      );
      utils.modules.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update module status");
    },
  });

  return (
    <CohortAccessGuard cohortSlug={cohortSlug}>
      <div className="relative min-h-[calc(100vh-7rem)] w-full bg-[radial-gradient(circle_at_top_left,rgba(40,132,164,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(125,50,140,0.1),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(162,122,74,0.1),transparent_22%)]">
        <div className="motion-fade mx-auto max-w-[1360px] px-5 py-6 md:px-8 lg:px-10 lg:py-7">
          <div className="motion-rise relative overflow-hidden rounded-[2rem] border border-[rgba(40,132,164,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(251,248,244,0.92)_100%)] shadow-[0_24px_70px_rgba(61,52,45,0.08)]">
            <div className="border-b border-[rgba(40,132,164,0.08)] px-6 py-5 md:px-8">
              <h1 className="text-[2.2rem] font-semibold tracking-tight text-[#1f2b34] md:text-[2.6rem]">
                Participant Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c6d72]">
                Review active course modules, upcoming learning materials, and
                discussions for this cohort.
              </p>
            </div>
            <div className="px-3 py-4 md:px-5 md:py-5">
              <ModuleGrid
                cohortSlug={cohortSlug}
                className="pt-0 lg:grid-cols-3"
                isAdmin={isAdmin}
                onToggleStatus={
                  isAdmin
                    ? (slug, isActive) =>
                        updateStatus.mutate({
                          slug,
                          cohortSlug,
                          isActive,
                        })
                    : undefined
                }
                isToggling={updateStatus.isPending}
              />
            </div>
          </div>
        </div>
      </div>
    </CohortAccessGuard>
  );
}
