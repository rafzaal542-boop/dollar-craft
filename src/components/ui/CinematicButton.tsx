import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

export type CinematicButtonVariant = "primary" | "secondary" | "danger" | "utility";
export type CinematicButtonSize = "sm" | "md" | "lg";

export interface CinematicButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: CinematicButtonVariant;
  size?: CinematicButtonSize;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const CinematicButton: React.FC<CinematicButtonProps> = ({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  isLoading = false,
  fullWidth = false,
  children,
  className = "",
  disabled,
  onClick,
  ...rest
}) => {
  // Size styles
  const sizeClasses = {
    sm: "px-3.5 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-5 py-2.5 text-xs md:text-sm rounded-2xl gap-2",
    lg: "px-6 py-3.5 text-sm md:text-base rounded-2xl gap-2.5",
  }[size];

  // Variant styles
  const variantClasses = {
    primary:
      "bg-gradient-to-r from-[#00D2FF] via-[#0066FF] to-[#0040FF] text-slate-950 font-black tracking-wider uppercase border border-cyan-300/40 shadow-[0_0_20px_rgba(0,210,255,0.35)] hover:shadow-[0_0_35px_rgba(0,210,255,0.65)]",
    secondary:
      "bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-slate-100 font-bold tracking-wide uppercase border border-slate-700/80 hover:border-[#00D2FF]/70 hover:text-white hover:shadow-[0_0_25px_rgba(0,210,255,0.25)] shadow-inner",
    danger:
      "bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white font-extrabold tracking-wider uppercase border border-rose-400/40 shadow-[0_0_20px_rgba(244,63,94,0.35)] hover:shadow-[0_0_35px_rgba(244,63,94,0.6)]",
    utility:
      "bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-cyan-300 font-bold uppercase tracking-wider border border-slate-800 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(0,210,255,0.25)]",
  }[variant];

  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = disabled || isLoading ? "opacity-60 cursor-not-allowed pointer-events-none" : "cursor-pointer";

  return (
    <motion.button
      whileHover={disabled || isLoading ? {} : { scale: 1.03 }}
      whileTap={disabled || isLoading ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center overflow-hidden transition-all duration-300 select-none ${sizeClasses} ${variantClasses} ${widthClass} ${disabledClass} ${className}`}
      {...rest}
    >
      {/* Cinematic Metallic Reflection Sweep Beam */}
      {!disabled && !isLoading && (
        <motion.span
          className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 pointer-events-none"
          initial={{ x: "-180%" }}
          whileHover={{ x: "320%" }}
          transition={{ duration: 0.65, ease: "easeInOut" }}
        />
      )}

      {/* Button Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>
        )}

        <span>{children}</span>

        {!isLoading && icon && iconPosition === "right" && (
          <span className="shrink-0">{icon}</span>
        )}
      </span>
    </motion.button>
  );
};
