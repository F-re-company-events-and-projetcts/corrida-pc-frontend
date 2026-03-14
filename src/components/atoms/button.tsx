import { Button as ShadcnButton, type ButtonProps as ShadcnButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ButtonProps = ShadcnButtonProps;

export const Button = ({ className, variant = "default", size = "default", ...props }: ButtonProps) => {
    const baseStyles = "font-bold uppercase tracking-wide transition-all duration-300 transform shadow-lg hover:-translate-y-1";

    // Custom shadows based on variant
    const variantStyles = {
        default: "hover:shadow-orange-500/30",
        secondary: "hover:shadow-blue-500/30",
        outline: "border-2 hover:shadow-blue-500/30",
        destructive: "",
        ghost: "",
        link: ""
    };

    return (
        <ShadcnButton
            variant={variant}
            size={size}
            className={cn(
                baseStyles,
                variantStyles[variant as keyof typeof variantStyles],
                className
            )}
            {...props}
        />
    )
}
