import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout="dropdown"
      fromYear={1900}
      toYear={2100}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        // Caption / Month selection region
        month_caption: "flex justify-center pt-1 relative items-center h-10",
        caption_label: "hidden", // Hide static label when dropdown is active
        
        // Dropdowns container
        dropdowns: "flex items-center gap-2",
        
        // Root container for each select (Month/Year)
        dropdown_root: "relative inline-flex items-center",
        
        // The actual select element
        dropdown: "flex h-8 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors appearance-none pr-8",
        
        // Nav buttons
        nav: "flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-lg border-slate-200 dark:border-slate-800 absolute left-1 z-10"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-lg border-slate-200 dark:border-slate-800 absolute right-1 z-10"
        ),
        
        // The table / grid
        month_grid: "w-full border-collapse",
        weekdays: "flex w-full mb-1",
        weekday: "text-slate-500 w-9 font-bold text-[10px] uppercase tracking-widest dark:text-slate-400 text-center flex-1",
        week: "flex w-full mt-2",
        day: "flex-1 h-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-full p-0 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all aria-selected:opacity-100"
        ),
        
        // Modifiers
        selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white shadow-lg shadow-blue-500/20",
        today: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white",
        outside: "day-outside text-slate-500 opacity-50 dark:text-slate-400",
        disabled: "text-slate-500 opacity-50 dark:text-slate-400",
        range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-white",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ ...props }) => {
          if (props.orientation === 'left') return <ChevronLeft className="h-4 w-4" />;
          return <ChevronRight className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
