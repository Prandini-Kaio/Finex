import React from 'react';
import type { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'success' | 'warning' | 'error' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const variantColors = {
  primary: {
    bg: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
    text: 'text-white',
  },
  success: {
    bg: 'bg-green-600',
    hover: 'hover:bg-green-700',
    text: 'text-white',
  },
  warning: {
    bg: 'bg-orange-600',
    hover: 'hover:bg-orange-700',
    text: 'text-white',
  },
  error: {
    bg: 'bg-red-600',
    hover: 'hover:bg-red-700',
    text: 'text-white',
  },
  secondary: {
    bg: 'bg-gray-200',
    hover: 'hover:bg-gray-300',
    text: 'text-gray-800',
  },
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyle = variantColors[variant];
  const sizeStyle = sizeClasses[size];

  return (
    <button
      className={`
        flex items-center justify-center gap-2 rounded-lg font-medium
        transition-colors
        ${variantStyle.bg}
        ${variantStyle.hover}
        ${variantStyle.text}
        ${sizeStyle}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />}
      {children}
    </button>
  );
};

