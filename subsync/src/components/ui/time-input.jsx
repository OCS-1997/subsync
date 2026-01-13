import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

const TimeInput = React.forwardRef(({ value, onChange, className, ...props }, ref) => {
    const [hours, setHours] = React.useState("");
    const [minutes, setMinutes] = React.useState("");
    const hoursRef = React.useRef(null);
    const minutesRef = React.useRef(null);

    // Parse initial value
    React.useEffect(() => {
        if (value && typeof value === "string" && value.includes(":")) {
            const [h, m] = value.split(":");
            setHours(h);
            setMinutes(m);
        }
    }, [value]);

    const handleHoursChange = (e) => {
        let val = e.target.value.replace(/\D/g, "");
        if (val.length > 2) val = val.slice(0, 2);
        if (val && parseInt(val) > 23) val = "23";
        setHours(val);

        // Only call onChange with padded values
        const paddedHours = val ? val.padStart(2, "0") : "00";
        const paddedMinutes = minutes ? minutes.padStart(2, "0") : "00";
        onChange(`${paddedHours}:${paddedMinutes}`);
    };

    const handleMinutesChange = (e) => {
        let val = e.target.value.replace(/\D/g, "");
        if (val.length > 2) val = val.slice(0, 2);
        if (val && parseInt(val) > 59) val = "59";
        setMinutes(val);

        // Only call onChange with padded values
        const paddedHours = hours ? hours.padStart(2, "0") : "00";
        const paddedMinutes = val ? val.padStart(2, "0") : "00";
        onChange(`${paddedHours}:${paddedMinutes}`);
    };

    const handleHoursBlur = () => {
        // Pad on blur for display
        if (hours) {
            setHours(hours.padStart(2, "0"));
        } else {
            setHours("00");
        }
    };

    const handleMinutesBlur = () => {
        // Pad on blur for display
        if (minutes) {
            setMinutes(minutes.padStart(2, "0"));
        } else {
            setMinutes("00");
        }
    };

    const handleHoursScroll = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -1 : 1;
        let newHours = parseInt(hours || "0") + delta;
        if (newHours < 0) newHours = 23;
        if (newHours > 23) newHours = 0;
        const newHoursStr = String(newHours).padStart(2, "0");
        setHours(newHoursStr);
        const paddedMinutes = minutes ? minutes.padStart(2, "0") : "00";
        onChange(`${newHoursStr}:${paddedMinutes}`);
    };

    const handleMinutesScroll = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -1 : 1;
        let newMinutes = parseInt(minutes || "0") + delta;
        if (newMinutes < 0) newMinutes = 59;
        if (newMinutes > 59) newMinutes = 0;
        const newMinutesStr = String(newMinutes).padStart(2, "0");
        setMinutes(newMinutesStr);
        const paddedHours = hours ? hours.padStart(2, "0") : "00";
        onChange(`${paddedHours}:${newMinutesStr}`);
    };

    return (
        <div className={cn("flex items-center gap-1", className)}>
            <Input
                ref={hoursRef}
                type="text"
                inputMode="numeric"
                value={hours}
                onChange={handleHoursChange}
                onBlur={handleHoursBlur}
                onWheel={handleHoursScroll}
                className="w-16 text-center font-mono"
                placeholder="HH"
                maxLength={2}
                {...props}
            />
            <span className="text-lg font-bold">:</span>
            <Input
                ref={minutesRef}
                type="text"
                inputMode="numeric"
                value={minutes}
                onChange={handleMinutesChange}
                onBlur={handleMinutesBlur}
                onWheel={handleMinutesScroll}
                className="w-16 text-center font-mono"
                placeholder="MM"
                maxLength={2}
                {...props}
            />
        </div>
    );
});

TimeInput.displayName = "TimeInput";

export { TimeInput };
