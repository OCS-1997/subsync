import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePicker({ date, setDate, placeholder = "Pick a date", className }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "h-11 w-full justify-start text-left font-bold rounded-xl border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all hover:bg-gray-50 dark:hover:bg-slate-900",
            !date && "text-slate-500",
            className
          )}
        >
          <CalendarIcon className="mr-3 h-4 w-4 text-slate-400" />
          {date ? format(new Date(date), "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl border-gray-100 dark:border-slate-800 shadow-2xl dark:bg-slate-900" align="start">
        <Calendar
          mode="single"
          selected={date ? new Date(date) : undefined}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
