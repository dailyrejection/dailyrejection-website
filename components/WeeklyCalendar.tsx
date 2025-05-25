import { WeeklyChallenge } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeeklyCalendarProps {
  year: number;
  selectedWeek: number | null;
  onWeekSelect: (week: number) => void;
  challenges: WeeklyChallenge[];
  onYearChange: (year: number) => void;
}

export function WeeklyCalendar({
  year,
  selectedWeek,
  onWeekSelect,
  challenges,
  onYearChange,
}: WeeklyCalendarProps) {
  // Create array with 52 weeks
  const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

  // Map challenges by week for easy access
  const challengesByWeek = challenges.reduce((acc, challenge) => {
    acc[challenge.week] = challenge;
    return acc;
  }, {} as Record<number, WeeklyChallenge>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onYearChange(year - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">{year}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onYearChange(year + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-13 gap-1">
        {weeks.map((week) => {
          const hasChallenge = !!challengesByWeek[week];
          const isSelected = week === selectedWeek;

          return (
            <Button
              key={week}
              variant={hasChallenge ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                isSelected && "ring-2 ring-primary",
                !hasChallenge && "border-dashed"
              )}
              onClick={() => onWeekSelect(week)}
            >
              {week}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
