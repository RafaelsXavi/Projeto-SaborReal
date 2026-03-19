import type React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
  width,
  height,
  style,
}) => {
  const baseStyles: React.CSSProperties = {
    width,
    height,
    ...style,
  };

  const variantClasses = {
    text: 'rounded-md h-4 w-full mb-2',
    rect: 'rounded-2xl',
    circle: 'rounded-full',
  };

  return (
    <div
      className={`skeleton ${variantClasses[variant]} ${className}`}
      style={baseStyles}
      aria-hidden="true"
    />
  );
};
