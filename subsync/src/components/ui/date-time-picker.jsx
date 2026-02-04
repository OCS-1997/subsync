import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

export function DateTimePicker({ date, setDate, className }) {
  const [selectedDate, setSelectedDate] = React.useState(date ? new Date(date) : new Date())
  const [time, setTime] = React.useState(date ? format(new Date(date), "HH:mm") : format(new Date(), "HH:mm"))

  React.useEffect(() => {
    if (date) {
      const d = new Date(date);
      setSelectedDate(d);
      setTime(format(d, "HH:mm"));
    }
  }, [date]);

  const updateDateTime = (newDate, newTime) => {
    const [hours, minutes] = newTime.split(':');
    const updated = new Date(newDate);
    updated.setHours(parseInt(hours), parseInt(minutes));
    setDate(updated.toISOString());
  };

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
          {date ? format(new Date(date), "PPP p") : <span>Pick date & time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl border-gray-100 dark:border-slate-800 shadow-2xl dark:bg-slate-900" align="start">
        <div className="flex flex-col">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(newDay) => {
              if (newDay) {
                setSelectedDate(newDay);
                updateDateTime(newDay, time);
              }
            }}
            initialFocus
          />
          <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pick Time</span>
            </div>
            <Input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                updateDateTime(selectedDate, e.target.value);
              }}
              className="w-32 h-9 rounded-lg font-bold text-xs"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
