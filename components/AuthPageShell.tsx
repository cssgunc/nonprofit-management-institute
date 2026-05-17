import Image from "next/image";
import type { ReactNode } from "react";

type AuthPageShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  accessory?: ReactNode;
};

export default function AuthPageShell({
  title,
  subtitle,
  children,
  accessory,
}: AuthPageShellProps) {
  return (
    <div className="auth-brand-bg min-h-screen w-full overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
      <main className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(24rem,28rem)] lg:gap-10">
          <section className="motion-rise flex flex-col items-center justify-center gap-6 text-center">
            <div className="max-w-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-plum)]">
                Nonprofit Management Institute
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1f2b34] sm:text-4xl">
                Participant Dashboard
              </h1>
            </div>

            <div className="w-full max-w-[29rem]">
              <Image
                src="/assets/NCCNonProfit_LOGO.png"
                alt="Center for Nonprofits Logo"
                width={560}
                height={260}
                priority
                className="mx-auto h-auto w-full max-w-[23rem] object-contain"
              />
            </div>

            <p className="max-w-xs text-sm italic leading-relaxed text-zinc-600">
              “To educate, connect, and advocate for nonprofits across the
              state.”
            </p>
          </section>

          <section className="motion-rise motion-delay-1 relative overflow-hidden rounded-[1.5rem] border border-[rgba(40,132,164,0.1)] bg-[rgba(255,253,248,0.86)] px-6 py-8 shadow-[0_18px_48px_rgba(61,52,45,0.08)] sm:px-8 lg:px-10 lg:py-10">
            <div className="absolute inset-x-0 top-0 flex h-1">
              <span className="flex-1 bg-[var(--brand-lime)]" />
              <span className="flex-1 bg-[var(--brand-plum)]" />
              <span className="flex-1 bg-[var(--brand-teal)]" />
            </div>
            <div className="mx-auto w-full max-w-md">
              {accessory && <div className="mb-5">{accessory}</div>}
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-zinc-950">{title}</h2>
                {subtitle && (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {subtitle}
                  </p>
                )}
              </div>

              {children}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
