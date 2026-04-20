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
      <div className="relative min-h-[calc(100vh-7rem)] w-full">
        <div className="relative mx-auto max-w-[1360px] px-5 py-5 md:px-8 lg:px-10 lg:py-6">
          <div className="relative">
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
    </CohortAccessGuard>
  );
}
