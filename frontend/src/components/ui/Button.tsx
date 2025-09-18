import type React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  children,
  loading = false,
  icon,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = "btn";
  const variantClasses = `btn-${variant}`;
  const sizeClasses = `btn-${size}`;

  const combinedClassName = [baseClasses, variantClasses, sizeClasses, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={combinedClassName} disabled={loading || disabled} {...props}>
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}
