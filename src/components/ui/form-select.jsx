import * as React from "react"
import SelectWrapper from "./Select"

const FormSelect = React.forwardRef(
  ({ label, name, register, required, error, options = [], placeholder, className, helperText, value, ...props }, ref) => {
    return (
      <SelectWrapper
        ref={ref}
        label={label}
        name={name}
        register={register}
        required={required}
        error={error}
        options={options}
        placeholder={placeholder}
        helperText={helperText}
        value={value}
        className={className}
        {...props}
      />
    )
  }
)
FormSelect.displayName = "FormSelect"

export { FormSelect }
