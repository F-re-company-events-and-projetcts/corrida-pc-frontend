import * as React from "react"
import { Separator as ShadcnSeparator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export interface SeparatorProps extends React.ComponentProps<typeof ShadcnSeparator> {
    variant?: "default" | "thick-orange"
}

const Separator = React.forwardRef<React.ElementRef<typeof ShadcnSeparator>, SeparatorProps>(
    ({ className, orientation = "horizontal", decorative = true, variant = "default", ...props }, ref) => (
        <ShadcnSeparator
            ref={ref}
            decorative={decorative}
            orientation={orientation}
            className={cn(
                variant === "default" && "bg-border",
                variant === "thick-orange" && "h-1 w-16 bg-primary rounded-full",
                className
            )}
            {...props}
        />
    )
)
Separator.displayName = "Separator"

export { Separator }
