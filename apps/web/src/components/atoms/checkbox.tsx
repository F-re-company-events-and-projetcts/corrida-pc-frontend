import * as React from "react"
import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export type CheckboxProps = React.ComponentPropsWithoutRef<typeof ShadcnCheckbox>

const Checkbox = React.forwardRef<React.ElementRef<typeof ShadcnCheckbox>, CheckboxProps>(
    ({ className, ...props }, ref) => {
        return (
            <ShadcnCheckbox
                ref={ref}
                className={cn(
                    "h-5 w-5 rounded-md border-border text-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
                    className
                )}
                {...props}
            />
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
