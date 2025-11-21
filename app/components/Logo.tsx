"use client";

interface LogoProps {
  size?: "sm" | "md" | "lg";
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
  };

  return (
    <div className={`flex items-baseline ${className}`}>
      <span
        style={{
          fontFamily: "'Bell MT', 'Times New Roman', serif",
          color: "var(--brand-blue)",
        }}
        className={`${sizes[size].closet} font-normal tracking-wide`}
      >
        Closet
      </span>
      <span
        style={{
          fontFamily: "'Calibri', 'Arial', sans-serif",
          color: "var(--text-primary)",
        }}
        className={`${sizes[size].ai} font-bold`}
      >
        AI
      </span>
    </div>
  );
}
