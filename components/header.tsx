import Link from "next/link";
import Logo from "@/assets/NCCNonProfit_LOGO.png";
import Image from "next/image";
import { useRouter } from "next/router";
import ProfileMenu from "@/components/profileMenu";

export default function Header() {
  const router = useRouter();
  const { cohort_slug } = router.query;

  const basePath = cohort_slug ? `/cohorts/${cohort_slug as string}` : "";
  const profileHref = cohort_slug ? `${basePath}/profile` : "/profile";

  const navLinks = cohort_slug
    ? [
        { label: "Dashboard", href: `${basePath}/dashboard` },
        { label: "Discussion", href: `${basePath}/discussion` },
        { label: "Contact", href: `${basePath}/contact` },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-white shadow-sm">
      <div className="mx-auto flex h-[7rem] items-center px-12">
        <Link href="/" className="flex-shrink-0">
          <Image src={Logo} alt="NPMI/NCCN Logo" className="h-20 w-auto" />
        </Link>

        <nav className="ml-auto flex items-center gap-12">
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

        <ProfileMenu profileHref={profileHref} className="ml-16" />
      </div>
    </header>
  );
}
