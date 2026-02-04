import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type = "text", label, name, id, required, error, placeholder, register, ...props }, ref) => {
  const inputId = id || name;
  
  // If register is provided, use it to register the input
  const registerProps = register ? register(name) : {};
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-gray-600">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        type={type}
        id={inputId}
        name={name}
        className={cn(
          "flex h-8 w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs",
          "placeholder:text-gray-400",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 focus-visible:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors",
          "hover:border-gray-300",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        ref={ref}
        placeholder={placeholder}
        {...registerProps}
        {...props}
      />
      {error && (
        <p className="text-[10px] text-red-600">{error}</p>
      )}
    </div>
  )}
)
Input.displayName = "Input"

export default Input
