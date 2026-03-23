import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";

type MemberCardProps = {
  fullName: string;
  profilePictureUrl?: string | null;
  email?: string | null;
  jobRole?: string | null;
  organization?: string | null;
  role: "admin" | "student";
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]?.[0]?.toUpperCase() ?? "?";
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export default function MemberCard({
  fullName,
  profilePictureUrl,
  email,
  jobRole,
  organization,
  role,
}: MemberCardProps) {
  const isAdmin = role === "admin";

  return (
    <article className="relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      {isAdmin && (
        <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          Admin
        </div>
      )}

      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 border border-zinc-200">
          <AvatarImage src={profilePictureUrl ?? undefined} alt={fullName} />
          <AvatarFallback className="bg-zinc-100 text-zinc-700">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 pr-16">
          <h3 className="truncate text-lg font-semibold text-zinc-900">
            {fullName}
          </h3>
          <p className="truncate text-sm text-zinc-600">
            {email?.trim() || "Email not provided"}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1 text-sm text-zinc-700">
        <p>
          <span className="font-medium text-zinc-900">Job role:</span>{" "}
          {jobRole?.trim() || "Not provided"}
        </p>
        <p>
          <span className="font-medium text-zinc-900">Organization:</span>{" "}
          {organization?.trim() || "Not provided"}
        </p>
      </div>
    </article>
  );
}
