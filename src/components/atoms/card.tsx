import * as React from "react"
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface CardProps extends React.ComponentProps<typeof ShadcnCard> {
    variant?: "default" | "highlight-orange" | "highlight-blue"
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant = "default", ...props }, ref) => {
    return (
        <ShadcnCard
            ref={ref}
            className={cn(
                "rounded-2xl shadow-sm border-0",
                variant === "default" && "bg-white",
                variant === "highlight-orange" && "border-t-8 border-t-primary",
                variant === "highlight-blue" && "border-t-8 border-t-secondary",
                className
            )}
            {...props}
        />
    )
})
Card.displayName = "Card"

export { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter }
