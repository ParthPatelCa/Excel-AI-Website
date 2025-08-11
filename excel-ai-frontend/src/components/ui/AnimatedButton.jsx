import { forwardRef } from 'react'
import { cn } from '@/lib/utils.js'

const buttonVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
  
  // Enhanced animated variants
  gradient: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 active:scale-95",
  glow: "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 transform hover:-translate-y-0.5 active:translate-y-0",
  bounce: "bg-green-600 text-white hover:bg-green-700 transform hover:scale-110 active:scale-95 hover:rotate-2",
  slide: "bg-blue-600 text-white hover:bg-blue-700 relative overflow-hidden hover:shadow-lg",
  pulse: "bg-red-600 text-white hover:bg-red-700 animate-pulse hover:animate-none",
  shake: "bg-yellow-600 text-white hover:bg-yellow-700 hover:animate-shake",
  float: "bg-purple-600 text-white hover:bg-purple-700 transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300",
  ripple: "bg-teal-600 text-white hover:bg-teal-700 relative overflow-hidden"
}

const buttonSizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  xl: "h-14 rounded-lg px-12 text-lg",
  icon: "h-10 w-10"
}

export const AnimatedButton = forwardRef(({
  className,
  variant = "default",
  size = "default",
  animation = "none",
  children,
  onClick,
  disabled = false,
  ...props
}, ref) => {
  
  const handleClick = (e) => {
    // Add ripple effect for ripple variant
    if (animation === "ripple" && !disabled) {
      const button = e.currentTarget
      const rect = button.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2
      
      const ripple = document.createElement('span')
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      `
      
      button.appendChild(ripple)
      
      setTimeout(() => {
        ripple.remove()
      }, 600)
    }
    
    if (onClick) onClick(e)
  }

  const getAnimationClasses = () => {
    switch (animation) {
      case "gradient":
        return "transition-all duration-300 ease-out"
      case "glow":
        return "transition-all duration-300 ease-out"
      case "bounce":
        return "transition-all duration-200 ease-out"
      case "slide":
        return "transition-all duration-300 ease-out before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
      case "float":
        return "transition-all duration-300 ease-out"
      case "shake":
        return "transition-all duration-200 hover:animate-wiggle"
      default:
        return "transition-colors duration-200"
    }
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        getAnimationClasses(),
        className
      )}
      ref={ref}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
})

AnimatedButton.displayName = "AnimatedButton"

// Floating Action Button with animation
export const FloatingActionButton = forwardRef(({
  className,
  children,
  onClick,
  variant = "gradient",
  size = "lg",
  position = "bottom-right",
  ...props
}, ref) => {
  
  const positionClasses = {
    "bottom-right": "fixed bottom-6 right-6",
    "bottom-left": "fixed bottom-6 left-6",
    "top-right": "fixed top-6 right-6",
    "top-left": "fixed top-6 left-6"
  }

  return (
    <AnimatedButton
      ref={ref}
      className={cn(
        "rounded-full shadow-lg z-50",
        positionClasses[position],
        className
      )}
      variant={variant}
      size={size}
      animation="float"
      onClick={onClick}
      {...props}
    >
      {children}
    </AnimatedButton>
  )
})

FloatingActionButton.displayName = "FloatingActionButton"

// Button with loading state and animations
export const LoadingButton = forwardRef(({
  className,
  variant = "default",
  size = "default",
  loading = false,
  loadingText = "Loading...",
  children,
  disabled = false,
  ...props
}, ref) => {
  
  return (
    <AnimatedButton
      ref={ref}
      className={cn(
        "relative",
        loading && "pointer-events-none",
        className
      )}
      variant={variant}
      size={size}
      disabled={disabled || loading}
      animation={loading ? "pulse" : "glow"}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        </div>
      )}
      <span className={loading ? "opacity-0" : "opacity-100"}>
        {loading ? loadingText : children}
      </span>
    </AnimatedButton>
  )
})

LoadingButton.displayName = "LoadingButton"

// Icon button with hover animations
export const IconButton = forwardRef(({
  className,
  icon: Icon,
  label,
  variant = "ghost",
  size = "icon",
  animation = "bounce",
  ...props
}, ref) => {
  
  return (
    <AnimatedButton
      ref={ref}
      className={cn("group", className)}
      variant={variant}
      size={size}
      animation={animation}
      aria-label={label}
      {...props}
    >
      <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
      <span className="sr-only">{label}</span>
    </AnimatedButton>
  )
})

IconButton.displayName = "IconButton"

// Call-to-action button with special animations
export const CTAButton = forwardRef(({
  className,
  children,
  size = "lg",
  ...props
}, ref) => {
  
  return (
    <AnimatedButton
      ref={ref}
      className={cn(
        "group relative overflow-hidden",
        "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600",
        "hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700",
        "text-white font-semibold shadow-lg",
        "transform hover:scale-105 active:scale-95",
        "transition-all duration-300 ease-out",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0",
        "before:translate-x-[-100%] hover:before:translate-x-[100%]",
        "before:transition-transform before:duration-1000",
        className
      )}
      size={size}
      {...props}
    >
      <span className="relative z-10 flex items-center">
        {children}
      </span>
    </AnimatedButton>
  )
})

CTAButton.displayName = "CTAButton"
