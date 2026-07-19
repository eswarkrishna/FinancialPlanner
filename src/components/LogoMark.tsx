type LogoMarkProps = {
  className?: string;
  size?: number;
  title?: string;
};

export function LogoMark({ className, size = 32, title = "FinancialPlanner" }: LogoMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="fp-logo-bg" x1="8" y1="56" x2="56" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#fp-logo-bg)" />
      <g fill="none" stroke="#fff" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 12 48 24v24H16V24Z" />
        <path d="M44 16v6h-5" />
        <path d="M22 44v-8M28 44v-14M34 44v-10" />
        <path d="M20 36 28 28l6 4 12-14" />
        <path d="M46 18 50 14" />
      </g>
      <polygon points="46,18 50,14 50,22" fill="#fff" stroke="none" />
    </svg>
  );
}
