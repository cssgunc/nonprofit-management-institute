export default function AppFooter() {
  return (
    <footer className="border-t border-[rgba(222,216,206,0.74)] bg-[rgba(255,253,248,0.64)] px-4 py-4 text-xs text-zinc-500 backdrop-blur-md sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <p>
          Technical difficulties? Please reach out to{" "}
          <a
            href="tel:+11234567891"
            className="font-medium text-[var(--brand-teal)] transition hover:text-[#007997]"
          >
            +1(234) 567 8910
          </a>
          .
        </p>

        <p className="text-zinc-400">
          Made in collaboration with{" "}
          <a
            href="https://www.cssgunc.org/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[var(--brand-plum)] transition hover:text-[#4f0a76] hover:underline hover:underline-offset-2"
          >
            UNC CS + Social Good
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
