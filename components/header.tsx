import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Image from "next/image";
import { useRouter } from "next/router";
import ProfileMenu from "@/components/ProfileMenu";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { api } from "@/utils/trpc/api";
import { Menu } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const { cohort_slug } = router.query;
  const profileQuery = api.profiles.me.useQuery(undefined, {
    retry: false,
  });

  const basePath = cohort_slug ? `/cohorts/${cohort_slug as string}` : "";
  const isAdmin = profileQuery.data?.role === "admin";
  const profileHref =
    cohort_slug && !isAdmin ? `${basePath}/profile` : "/profile";
  const logoHref = cohort_slug ? `${basePath}/dashboard` : "/";
  const displayName = profileQuery.data?.full_name?.trim() ?? "";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const avatarUrl = profileQuery.data?.avatar_url
    ? supabase.storage
        .from("avatars")
        .getPublicUrl(profileQuery.data.avatar_url).data.publicUrl
    : undefined;

  const navLinks = cohort_slug
    ? [
        { label: "Dashboard", href: `${basePath}/dashboard` },
        { label: "Discussion", href: `${basePath}/discussion` },
        { label: "Cohort", href: `${basePath}/contact` },
      ]
    : [];

  const currentPath = router.asPath.split("?")[0] ?? "";
  const discussionModulePattern = new RegExp(
    `^${basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/[^/]+/discussions$`,
  );
  const dashboardModulePattern = new RegExp(
    `^${basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/[^/]+/(module|materials)$`,
  );

  const isNavLinkActive = (href: string, label: string) => {
    if (currentPath === href) return true;

    if (label === "Discussion") {
      return discussionModulePattern.test(currentPath);
    }

    if (label === "Dashboard") {
      return dashboardModulePattern.test(currentPath);
    }

    if (label === "Cohort") {
      return currentPath.startsWith(`${basePath}/contact`);
    }

    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--line-soft)] bg-[rgba(252,250,247,0.92)] shadow-[0_8px_28px_rgba(61,52,45,0.06)] backdrop-blur-md">
      <div className="mx-auto flex h-[7rem] items-center px-4 md:px-8 xl:px-12">
        <Link
          href={logoHref}
          className="motion-fade hover-bob flex shrink-0 items-center gap-3 md:gap-4"
        >
          <Image
            src="/assets/NCCNonProfit_LOGO.png"
            alt="Center for Nonprofits Logo"
            width={200}
            height={80}
            className="h-14 w-auto md:h-20"
          />
          <span className="h-10 w-px bg-[rgba(94,13,139,0.18)] md:h-14" />
          <Image
            src="/assets/npmi_logo.png"
            alt="Nonprofit Management Institute Logo"
            width={300}
            height={200}
            className="h-20 w-auto max-w-[145px] object-contain md:h-32 md:max-w-[235px] xl:h-36 xl:max-w-[265px]"
          />
        </Link>

        <nav className="motion-fade motion-delay-1 ml-auto hidden items-center gap-8 lg:flex xl:gap-12">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xl font-medium transition-colors hover:text-[var(--brand-teal)] ${
                isNavLinkActive(link.href, link.label)
                  ? "text-[#1f2b34] underline decoration-[var(--brand-teal)] underline-offset-4"
                  : "text-[#6b6a68]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {navLinks.length > 0 && (
          <div className="motion-fade motion-delay-1 ml-auto lg:hidden">
            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  aria-label="Open navigation menu"
                  className="rounded-lg p-2 text-[#5b5c5f] transition hover:bg-[rgba(40,132,164,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2"
                >
                  <Menu className="h-7 w-7" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  sideOffset={10}
                  align="end"
                  className="z-50 min-w-[190px] rounded-md border border-[var(--line-soft)] bg-[rgba(252,250,247,0.98)] p-1 shadow-lg"
                >
                  {navLinks.map((link) => (
                    <DropdownMenu.Item key={link.href} asChild>
                      <Link
                        href={link.href}
                        className={`block cursor-pointer rounded-sm px-3 py-2 text-sm outline-none hover:bg-[rgba(40,132,164,0.08)] focus:bg-[rgba(40,132,164,0.08)] ${
                          isNavLinkActive(link.href, link.label)
                            ? "font-medium text-[#1f2b34]"
                            : "text-[#5d5d62]"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        )}

        <ProfileMenu
          profileHref={profileHref}
          initials={initials || "?"}
          avatarUrl={avatarUrl}
          className="motion-fade motion-delay-2 ml-3 lg:ml-16"
        />
      </div>
    </header>
  );
}
