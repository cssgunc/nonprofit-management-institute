import { useRouter } from "next/router";
import ModuleGrid from "@/components/ModuleGrid";

export default function DashboardPage() {
	const router = useRouter();
	const { cohort_slug } = router.query;

	return (
        <div className='h-full w-full bg-blue'>
            {/* Header placeholder. Import /components/Header module here. */}
            <div className='h-25 w-full bg-white' />
            <ModuleGrid cohortSlug={cohort_slug as string} />
        </div>
    ) 
}
