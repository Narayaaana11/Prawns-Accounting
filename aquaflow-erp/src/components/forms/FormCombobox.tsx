import { useState, useRef, useEffect } from "react";
import { FieldError, Controller, Control } from "react-hook-form";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormComboboxProps {
  label?: string;
  error?: FieldError;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
  name: string;
  control: Control<any>;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function FormCombobox({
  label,
  error,
  helperText,
  options,
  name,
  control,
  className,
  placeholder,
  disabled,
  required,
}: FormComboboxProps) {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? "Required" : false }}
      render={({ field }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [inputValue, setInputValue] = useState(field.value || "");
        const wrapperRef = useRef<HTMLDivElement>(null);

        // Sync local input state with external value changes
        useEffect(() => {
          setInputValue(field.value || "");
        }, [field.value]);

        useEffect(() => {
          function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
              setIsOpen(false);
            }
          }
          document.addEventListener("mousedown", handleClickOutside);
          return () => document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        const filteredOptions = options.filter(opt => 
          opt.label.toLowerCase().includes(inputValue.toLowerCase()) || 
          opt.value.toLowerCase().includes(inputValue.toLowerCase())
        );

        return (
          <div className="w-full relative" ref={wrapperRef}>
            {label && (
              <label className="block text-sm font-display font-medium text-foreground mb-1.5">
                {label.replace(/\s?\*$/, "")}
                {required && <span className="text-destructive"> *</span>}
              </label>
            )}
            
            <div className="relative">
              <input
                type="text"
                disabled={disabled}
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  field.onChange(e.target.value); // Update form state immediately
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-md border bg-surface px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50",
                  error ? "border-destructive focus:ring-destructive/50" : "border-border",
                  className
                )}
              />
              <div 
                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-muted-foreground"
                onClick={() => !disabled && setIsOpen(!isOpen)}
              >
                <ChevronDown className="h-4 w-4 opacity-50" />
              </div>
            </div>

            {isOpen && !disabled && (
              <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                <div className="p-1">
                  {filteredOptions.length === 0 ? (
                    <div className="py-2 px-2 text-sm text-muted-foreground text-center">
                      Press enter to add "{inputValue}"
                    </div>
                  ) : (
                    filteredOptions.map((opt) => (
                      <div
                        key={opt.value}
                        className={cn(
                          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                          field.value === opt.value ? "bg-accent/50 text-accent-foreground" : ""
                        )}
                        onClick={() => {
                          setInputValue(opt.label);
                          field.onChange(opt.value);
                          setIsOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            field.value === opt.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {opt.label}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {error ? (
              <p className="text-xs text-destructive mt-1.5">{error.message}</p>
            ) : helperText ? (
              <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
            ) : null}
          </div>
        );
      }}
    />
  );
}
