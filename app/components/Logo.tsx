"use client";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "xl-custom";
  className?: string;
}

export default function Logo({ size = "md", className = "" }: LogoProps) {
  const sizes = {
    sm: {
      closet: "text-lg",
      ai: "text-lg",
    },
    md: {
      closet: "text-2xl",
      ai: "text-2xl",
    },
    lg: {
      closet: "text-4xl",
      ai: "text-4xl",
    },
    xl: {
      closet: "text-6xl",
      ai: "text-6xl",
    },
    "2xl": {
      closet: "text-8xl",
      ai: "text-8xl",
    },
    "xl-custom": {
      closet: "text-[66px]",
      ai: "text-[66px]",
    },
  };

  return (
    <div className={`flex items-baseline ${className}`}>
      <span
        style={{
          fontFamily: "'Bell MT', 'Times New Roman', serif",
          color: "var(--brand-blue)",
          fontWeight: 150,
        }}
        className={`${sizes[size].closet} tracking-wide`}
      >
        Closet
      </span>
      <span
        style={{
          fontFamily: "'Calibri', 'Arial', sans-serif",
          color: "var(--brand-blue)",
          fontWeight: 150,
        }}
        className={`${sizes[size].ai}`}
      >
        AI
      </span>
    </div>
  );
}
