import { useRouter } from "next/router";
import { VideoOff, FileText } from "lucide-react";
import { api } from "@/utils/trpc/api";
import Resource from "@/components/resource";

function parseYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Already an embed URL
    if (
      parsed.hostname === "www.youtube.com" &&
      parsed.pathname.startsWith("/embed/")
    ) {
      return url;
    }

    // Standard watch URL: youtube.com/watch?v=VIDEO_ID
    if (
      (parsed.hostname === "www.youtube.com" ||
        parsed.hostname === "youtube.com") &&
      parsed.pathname === "/watch"
    ) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    // Short URL: youtu.be/VIDEO_ID
    if (parsed.hostname === "youtu.be") {
      const videoId = parsed.pathname.slice(1);
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    return null;
  } catch {
    return null;
  }
}

export default function ModulePage() {
  const router = useRouter();
  const { modules_slug } = router.query;
  const slug = modules_slug as string;

  const { data: module, isLoading: moduleLoading } =
    api.modules.bySlug.useQuery({ slug }, { enabled: !!slug });

  const { data: recordings, isLoading: recordingsLoading } =
    api.resources.listByModuleSlug.useQuery(
      { moduleSlug: slug, type: "recording" },
      { enabled: !!slug },
    );

  const { data: handouts, isLoading: handoutsLoading } =
    api.resources.listByModuleSlug.useQuery(
      { moduleSlug: slug, type: "handout" },
      { enabled: !!slug },
    );

  const isLoading = moduleLoading || recordingsLoading || handoutsLoading;

  const recording = recordings?.[0];
  const embedUrl = recording?.url ? parseYouTubeEmbedUrl(recording.url) : null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500 text-sm">Module not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8 max-w-4xl w-full">
      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>

      {/* Video Player */}
      {embedUrl ? (
        <div className="w-full aspect-video rounded-lg overflow-hidden shadow-md bg-black">
          <iframe
            src={embedUrl}
            title={module.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      ) : (
        <div className="w-full aspect-video rounded-lg bg-gray-100 border border-gray-200 flex flex-col items-center justify-center gap-3">
          <VideoOff className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
          <p className="text-sm text-gray-400">
            No video has been published for this module yet.
          </p>
        </div>
      )}

      {/* Description */}
      {module.description && (
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed">{module.description}</p>
        </div>
      )}

      {/* Handouts */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Handouts</h2>
        {handouts && handouts.length > 0 ? (
          <div className="flex flex-wrap gap-6">
            {handouts.map((handout) => (
              <Resource
                key={handout.id}
                title={handout.title}
                fileUrl={handout.url ?? ""}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-5 py-6">
            <FileText className="w-6 h-6 text-gray-400 shrink-0" strokeWidth={1.5} />
            <p className="text-sm text-gray-400">
              No handouts have been attached to this module yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
