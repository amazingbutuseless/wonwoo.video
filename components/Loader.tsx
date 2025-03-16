export const Loader: React.FC<{
  size?: number;
  weight?: number;
  color?: string;
  duration?: number;
  className?: string;
}> = ({
  size = 40,
  weight = 4,
  color = "oklch(0.627 0.265 303.9)",
  duration = 1,
  className = "",
}) => {
  return (
    <div
      className={`animate-spin rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth: weight,
        borderStyle: "solid",
        borderColor: color,
        borderTopColor: "transparent",
        animationDuration: `${duration}s`,
      }}
    />
  );
};
