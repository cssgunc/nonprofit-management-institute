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
    <article className="h-24 w-full rounded-[8px] bg-[#ededed] px-4 text-zinc-800">
      <div className="grid h-full grid-cols-1 items-center gap-3 md:grid-cols-[minmax(0,2fr)_2fr_2fr_2fr] md:gap-6">
        <div className="flex min-w-0 items-center gap-10">
          <Avatar className="h-16 w-16 border border-zinc-300">
            <AvatarImage src={profilePictureUrl ?? undefined} alt={fullName} />
            <AvatarFallback className="bg-zinc-200 text-zinc-700">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-800">{fullName}</p>
            {isAdmin && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span>Admin</span>
              </span>
            )}
          </div>
        </div>

        <p className="truncate text-sm text-zinc-800 md:text-base">
          {email?.trim() || "Email not provided"}
        </p>

        <p className="truncate text-sm text-zinc-800 md:text-base">
          {organization?.trim() || "Not provided"}
        </p>

        <p className="truncate text-sm text-zinc-800 md:text-base">
          {jobRole?.trim() || "Not provided"}
        </p>
      </div>
    </article>
  );
}
