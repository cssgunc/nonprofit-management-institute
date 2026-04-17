import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Logo from "@/assets/NCCNonProfit_LOGO.png";
import Image from "next/image";
import { useRouter } from "next/router";
import ProfileMenu from "@/components/ProfileMenu";
import { api } from "@/utils/trpc/api";
import { Menu } from "lucide-react";

export default function Header() {
  const router = useRouter();
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

  const navLinks = cohort_slug
    ? [
        { label: "Dashboard", href: `${basePath}/dashboard` },
        { label: "Discussion", href: `${basePath}/discussion` },
        { label: "Contact", href: `${basePath}/contact` },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-300 bg-white shadow-sm">
      <div className="mx-auto flex h-[7rem] items-center px-4 md:px-8 xl:px-12">
        <Link href={logoHref} className="flex-shrink-0">
          <Image
            src={Logo}
            alt="NPMI/NCCN Logo"
            className="h-14 w-auto md:h-20"
          />
        </Link>

        <nav className="ml-auto hidden items-center gap-8 lg:flex xl:gap-12">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xl font-medium transition-colors hover:text-gray-900 ${
                router.asPath === link.href
                  ? "text-gray-900 underline underline-offset-4"
                  : "text-gray-500"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {navLinks.length > 0 && (
          <div className="ml-auto lg:hidden">
            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  aria-label="Open navigation menu"
                  className="rounded-lg p-2 text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                >
                  <Menu className="h-7 w-7" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  sideOffset={10}
                  align="end"
                  className="z-50 min-w-[190px] rounded-md border border-gray-200 bg-white p-1 shadow-lg"
                >
                  {navLinks.map((link) => (
                    <DropdownMenu.Item key={link.href} asChild>
                      <Link
                        href={link.href}
                        className={`block cursor-pointer rounded-sm px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 ${
                          router.asPath === link.href
                            ? "font-medium text-gray-900"
                            : "text-gray-700"
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
          className="ml-3 lg:ml-16"
        />
      </div>
    </header>
  );
}
