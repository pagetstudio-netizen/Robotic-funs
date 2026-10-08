import type { ReactNode } from "react";
import emptyStateIllustration from "@assets/9fbbf513-879b-4d40-97e0-b2ec88550e18_1791421186188.png";
import "./empty-state.css";

interface EmptyStateProps {
  children: ReactNode;
  className?: string;
  size?: "default" | "compact";
}

export default function EmptyState({
  children,
  className = "",
  size = "default",
}: EmptyStateProps) {
  return (
    <div className={`shared-empty-state shared-empty-state-${size} ${className}`.trim()}>
      <img
        className="shared-empty-state-image"
        src={emptyStateIllustration}
        alt=""
        aria-hidden="true"
      />
      {children}
    </div>
  );
}