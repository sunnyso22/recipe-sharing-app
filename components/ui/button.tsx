import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "flex gap-1 items-center rounded-2xl font-semibold transition-colors cursor-pointer",
    {
        variants: {
            variant: {
                default: "bg-primary text-white hover:bg-primary/80",
                outline:
                    "border-2 border-primary hover:bg-accent/20 text-primary",
                secondary: "bg-secondary text-white hover:bg-secondary/70",
                link: "flex justify-center text-white hover:border-primary hover:border-2",
                destructive: "bg-accent text-white hover:bg-accent/80",
                ghost: "flex justify-center text-primary hover:bg-accent/20",
            },
            size: {
                default: "h-12 px-4 py-2 has-[>svg]:px-3",
                sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
                lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
                icon: "size-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot : "button";

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
