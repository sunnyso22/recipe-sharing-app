import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "flex h-12 w-72 rounded-2xl border-2 border-primary focus:border-accent font-light px-3 py-4 placeholder:text-black/20 outline-hidden",
                className
            )}
            {...props}
        />
    );
}

export { Input };
