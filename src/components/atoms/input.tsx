import * as React from "react"
import { Input as ShadcnInput } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type InputProps = React.ComponentProps<"input">

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, ...props }, ref) => {
        return (
            <ShadcnInput
                className={cn(
                    "rounded-xl border-border bg-white text-secondary placeholder:text-muted-foreground focus-visible:ring-primary",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
