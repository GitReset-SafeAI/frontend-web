import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

import { type ButtonVariant, buttonClasses } from './buttonStyles'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: ReactNode
  loading?: boolean
}

export function Button({ variant = 'primary', icon, loading = false, className = '', children, disabled, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
  icon?: ReactNode
}

export function ButtonLink({ variant = 'primary', icon, className = '', children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, className)} {...rest}>
      {icon}
      {children}
    </Link>
  )
}
