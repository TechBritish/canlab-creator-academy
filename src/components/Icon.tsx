type IconProps = {
  id: string;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
};

export default function Icon({ id, className = 'i', style, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <use href={`#${id}`} />
    </svg>
  );
}
