import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays, Calendar } from "lucide-react";
import { WeeklyChallenge } from "@/lib/supabase/types";
import { getWeeksInYear, getWeekNumber } from "@/lib/utils";
import { motion } from "framer-motion";

interface WeekSelectorProps {
  selectedWeek: number;
  selectedYear: number;
  challenges: WeeklyChallenge[];
  onWeekSelect: (week: number) => void;
  onYearChange: (year: number) => void;
}

export function WeekSelector({
  selectedWeek,
  selectedYear,
  challenges,
  onWeekSelect,
  onYearChange,
}: WeekSelectorProps) {
  const getChallengeForWeek = (week: number) => {
    return challenges.find(
      (c) => c.week === week && c.year === selectedYear
    );
  };

  const totalWeeks = getWeeksInYear(selectedYear);

  const goToToday = () => {
    const today = new Date();
    const currentWeek = getWeekNumber(today);
    const currentYear = today.getFullYear();
    
    onWeekSelect(currentWeek);
    onYearChange(currentYear);
  };

  // Create array of weeks for animation
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center space-x-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onYearChange(selectedYear - 1)}
          className="h-10 w-10 rounded-full hover:bg-green-50 hover:text-green-600 transition-colors border-gray-200"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
          <Calendar className="h-5 w-5 text-green-600" />
          <span className="font-bold text-2xl min-w-[6rem] text-center">{selectedYear}</span>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => onYearChange(selectedYear + 1)}
          className="h-10 w-10 rounded-full hover:bg-green-50 hover:text-green-600 transition-colors border-gray-200"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex justify-center mb-6">
        <Button
          variant="outline"
          onClick={goToToday}
          className="flex items-center gap-2 hover:bg-green-50 hover:text-green-600 transition-colors px-4 py-2 rounded-lg border-gray-200"
        >
          <CalendarDays className="h-4 w-4" />
          <span>Today</span>
        </Button>
      </div>

      <div className="grid grid-cols-13 gap-2 max-w-lg mx-auto">
        {weeks.map((week) => {
          const hasChallenge = !!getChallengeForWeek(week);
          const isSelected = week === selectedWeek;

          return (
            <motion.div 
              key={week}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.3, 
                delay: week * 0.01, // Staggered delay based on week number
                ease: "easeOut"
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 w-9 p-0 rounded-full transition-all duration-300 relative ${
                  isSelected
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-200 hover:text-white"
                    : hasChallenge
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "border border-dashed border-gray-300"
                }`}
                onClick={() => onWeekSelect(week)}
              >
                <span className="relative z-10 font-medium">{week}</span>
              </Button>
            </motion.div>
          );
        })}
      </div>
      
      <div className="flex justify-center mt-4 space-x-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-500"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-50 border border-green-200"></div>
          <span>Has Challenge</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border border-dashed border-gray-300"></div>
          <span>No Challenge</span>
        </div>
      </div>
    </div>
  );
} 