import { WeeklyChallenge } from "@/lib/supabase/types";
import { getWeekRange } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2, CalendarRange, Info, Edit, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { toast } from "sonner";

// Schema for challenge validation
const ChallengeEditSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
});

interface ChallengesListProps {
  challenges: WeeklyChallenge[];
  selectedWeek: number;
  selectedYear: number;
  onEdit: (
    id: string,
    data: { title: string; description: string }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ChallengesList({
  challenges,
  selectedWeek,
  selectedYear,
  onEdit,
  onDelete,
}: ChallengesListProps) {
  const [editingChallenge, setEditingChallenge] =
    useState<WeeklyChallenge | null>(null);
  const [deleteChallenge, setDeleteChallenge] =
    useState<WeeklyChallenge | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingChallenge) return;

    setIsSubmitting(true);
    setValidationError(null);
    const formData = new FormData(event.currentTarget);
    
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
    };

    try {
      // Validate with Zod
      ChallengeEditSchema.parse(data);
      
      await onEdit(editingChallenge.id, data);
      setEditingChallenge(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors.map(err => err.message).join(", "));
        toast.error(error.errors.map(err => err.message).join(", "));
      } else {
        toast.error("Failed to update challenge");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteChallenge) return;

    setIsSubmitting(true);
    try {
      await onDelete(deleteChallenge.id);
      setDeleteChallenge(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredChallenges = challenges.filter(
    (challenge) => challenge.year === selectedYear
  );

  return (
    <div className="space-y-4">
      {filteredChallenges.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Info className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-lg text-gray-600 font-medium">No challenges created for {selectedYear}</p>
          <p className="text-sm mt-2 text-gray-500">
            Create a new challenge using the form on the left.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence>
            {filteredChallenges.map((challenge) => {
              const range = getWeekRange(challenge.week, challenge.year);
              const isCurrentWeek = challenge.week === selectedWeek;
              
              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <div
                    className={`p-5 rounded-xl transition-all duration-300 ${
                      isCurrentWeek
                        ? "bg-gradient-to-br from-green-50 to-white border-2 border-green-500/30 shadow-lg"
                        : "bg-white hover:shadow-md border border-gray-200 hover:border-green-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isCurrentWeek && (
                            <Badge className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white px-2 rounded-md">
                              Selected
                            </Badge>
                          )}
                          <h3 className={`font-bold text-lg ${isCurrentWeek ? 'text-green-700' : 'text-gray-800'}`}>
                            {challenge.title}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <CalendarRange className="h-4 w-4" />
                          <span className="font-medium">Week {challenge.week}</span>
                          <span>•</span>
                          <span>
                            {range.start.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })} - {" "}
                            {range.end.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        
                        {challenge.description && (
                          <div className="mt-4 text-sm leading-relaxed text-gray-600">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 break-words whitespace-pre-wrap">
                              {challenge.description}
                            </div>
                          </div>
                        )}
                        
                        {challenge.winner_submission_id && (
                          <div className="mt-3">
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 w-fit">
                              <CheckCircle className="h-3 w-3" />
                              <span>Winner Selected</span>
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingChallenge(challenge)}
                          className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-green-600 hover:bg-green-50 hover:border-green-200"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteChallenge(challenge)}
                          className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingChallenge}
        onOpenChange={(open) => !open && setEditingChallenge(null)}
      >
        <DialogContent className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">Edit Challenge</DialogTitle>
            <DialogDescription className="text-gray-600">
              Edit the title and description of the challenge.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-5 pt-2">
            <div>
              <label htmlFor="title" className="text-sm font-medium block mb-2 text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                name="title"
                defaultValue={editingChallenge?.title}
                required
                minLength={3}
                maxLength={100}
                className="w-full border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                onChange={(e) => {
                  const count = e.target.value.length;
                  const counter = document.getElementById("edit-title-counter");
                  if (counter) counter.textContent = `${count}/100`;
                }}
              />
              <div className="flex justify-between items-center mt-1">
                <div className="text-xs text-red-500">
                  {validationError?.includes("Title") && "Title must be at least 3 characters"}
                </div>
                <div
                  className="text-xs text-gray-500 text-right"
                  id="edit-title-counter"
                >
                  {editingChallenge?.title?.length || 0}/100
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="description"
                className="text-sm font-medium block mb-2 text-gray-700"
              >
                Description (optional)
              </label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingChallenge?.description}
                maxLength={400}
                className="w-full min-h-[120px] border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg resize-none"
                onChange={(e) => {
                  const count = e.target.value.length;
                  const counter = document.getElementById(
                    "edit-description-counter"
                  );
                  if (counter) counter.textContent = `${count}/400`;
                }}
              />
              <div
                className="text-xs text-gray-500 text-right mt-1"
                id="edit-description-counter"
              >
                {editingChallenge?.description?.length || 0}/400
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingChallenge(null)}
                disabled={isSubmitting}
                className="border-gray-200 hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="text-white rounded-lg shadow-md shadow-green-200/50 transition-all duration-300"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save Changes
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={!!deleteChallenge}
        onOpenChange={(open) => !open && setDeleteChallenge(null)}
      >
        <AlertDialogContent className="bg-white border-0 shadow-2xl rounded-xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-800">
              Delete Challenge
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              This action cannot be undone. All submissions associated with this
              challenge will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="space-x-2 sm:gap-0">
            <AlertDialogCancel disabled={isSubmitting} className="border-gray-200 hover:bg-gray-50 text-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all duration-300"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </span>
              ) : (
                "Delete Challenge"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 20px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
