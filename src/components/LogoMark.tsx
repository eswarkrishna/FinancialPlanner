type LogoMarkProps = {
  className?: string;
  size?: number;
  title?: string;
};

const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;

export function LogoMark({ className, size = 32, title = "FinancialPlanner" }: LogoMarkProps) {
  return (
    <img
      src={logoSrc}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      decoding="async"
      title={title}
    />
  );
}
