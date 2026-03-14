import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import React from "react"

export const typographyVariants = cva("text-foreground", {
    variants: {
        variant: {
            h1: "text-4xl md:text-6xl font-extrabold uppercase tracking-tight font-heading",
            h2: "text-3xl font-bold text-secondary uppercase tracking-tight font-heading",
            h3: "text-xl font-bold text-secondary uppercase font-heading",
            p: "text-base font-normal text-muted-foreground font-sans",
            label: "text-sm font-bold text-secondary uppercase tracking-wider font-sans",
            highlight: "font-bold text-primary font-sans",
        }
    },
    defaultVariants: {
        variant: "p"
    }
})

export type TypographyProps = React.HTMLAttributes<HTMLElement> & VariantProps<typeof typographyVariants> & {
    as?: "h1" | "h2" | "h3" | "p" | "span" | "div" | "label"
}

export const Typography = ({ className, variant, as, ...props }: TypographyProps) => {
    const Component = as || (variant === "highlight" ? "span" : variant!) || "p"

    return (
        <Component className={cn(typographyVariants({ variant, className }))} {...props} />
    )
}
