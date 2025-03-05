import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "flex h-72 rounded-2xl border-2 border-primary focus:border-accent font-light px-3 py-2 placeholder:text-paragraph/50 outline-hidden",
                className
            )}
            {...props}
        />
    );
}

export { Textarea };
