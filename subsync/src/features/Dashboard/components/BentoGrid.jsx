import { cn } from "@/lib/utils";

/**
 * BentoGrid - A responsive CSS grid container for bento-style layouts
 * Supports drag-and-drop reordering with react-beautiful-dnd
 */
function BentoGrid({ children, className, columns = 4 }) {
    return (
        <div
            className={cn(
                "grid gap-4 auto-rows-[minmax(180px,auto)]",
                columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                columns === 2 && "grid-cols-1 sm:grid-cols-2",
                className
            )}
        >
            {children}
        </div>
    );
}

export default BentoGrid;
