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
      <div className="app-muted-bg relative min-h-[calc(100vh-7rem)] w-full overflow-hidden">
        <div className="motion-fade relative mx-auto max-w-[1500px] px-3 py-4 md:px-5 lg:px-7">
          <div className="motion-rise relative overflow-hidden rounded-[1.35rem] border border-[rgba(40,132,164,0.1)] bg-[rgba(255,253,248,0.82)] shadow-[0_24px_70px_rgba(61,52,45,0.1)]">
            <div className="absolute inset-x-0 top-0 flex h-1">
              <span className="flex-1 bg-[var(--brand-plum)]" />
              <span className="flex-1 bg-[var(--brand-lime)]" />
              <span className="flex-1 bg-[var(--brand-teal)]" />
            </div>
            <div className="flex flex-col gap-3 border-b border-[rgba(40,132,164,0.08)] px-5 py-4 md:flex-row md:items-end md:justify-between md:px-6">
              <div>
                <h1 className="text-[2rem] font-semibold tracking-tight text-[#1f2b34] md:text-[2.35rem]">
                  Participant Dashboard
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#6c6d72]">
                  Review active course modules, upcoming learning materials, and
                  discussions for this cohort.
                </p>
              </div>
            </div>
            <div className="px-3 py-3 md:px-4 md:py-4">
              <ModuleGrid
                cohortSlug={cohortSlug}
                className="pt-2 lg:grid-cols-3"
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
