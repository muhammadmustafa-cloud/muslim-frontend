import * as React from "react"
import Input from "./Input"

const FormInput = React.forwardRef(
  ({ label, name, register, required, error, className, helperText, ...props }, ref) => {
    const errorMessage = error?.message || error;

    return (
      <Input
        ref={ref}
        label={label}
        name={name}
        register={register}
        required={required}
        error={errorMessage}
        helperText={helperText}
        className={className}
        {...props}
      />
    )
  }
)
FormInput.displayName = "FormInput"

export { FormInput }

