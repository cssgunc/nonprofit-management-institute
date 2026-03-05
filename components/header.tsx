import Link from "next/link";
import Logo from "@/assets/NCCNonProfit_LOGO.png";
import Image from "next/image";

import { useRouter } from "next/router";

export default function Header() {
  const router = useRouter();
  const { cohort_slug } = router.query;

  // Build cohort navigation links when a cohort slug is available
  const basePath = cohort_slug ? `/cohorts/${cohort_slug as string}` : "";

  const navLinks = cohort_slug
    ? [
        { label: "Dashboard", href: `${basePath}/dashboard` },
        { label: "Discussion", href: `${basePath}/discussion` },
        { label: "Contact", href: `${basePath}/contact` },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-[8.5rem] items-center px-12">
        {/* Left - Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image src={Logo} alt="NPMI/NCCN Logo" className="h-24 w-auto" />
        </Link>

        {/* Middle / Right – Navigation links */}
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

        {/* Far Right – User avatar placeholder */}
        <Link
          href="/profile"
          className="ml-16 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          aria-label="User profile"
        ></Link>
      </div>
    </header>
  );
}
