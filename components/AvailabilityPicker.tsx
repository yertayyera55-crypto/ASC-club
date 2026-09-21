"use client";

import type { Weekday } from "@/data/types";

export const weekdays: Weekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function AvailabilityPicker({ value, onChange }: { value: Weekday[]; onChange: (days: Weekday[]) => void }) {
  const toggle = (day: Weekday) => {
    const next = value.includes(day) ? value.filter((item) => item !== day) : [...value, day];
    onChange(weekdays.filter((item) => next.includes(item)));
  };

  return <fieldset className="availability-picker wide">
    <legend>Available for meetings</legend>
    <p>Choose every day when club meetings usually work for you. Only organizers can see this schedule.</p>
    <div>{weekdays.map((day) => <label key={day} className={value.includes(day) ? "selected" : ""}><input type="checkbox" checked={value.includes(day)} onChange={() => toggle(day)} /><span>{day.slice(0, 3)}</span></label>)}</div>
  </fieldset>;
}
