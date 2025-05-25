import { WeeklyChallenge, ChallengeSubmission } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Medal,
  CalendarRange,
  UserCheck,
  ExternalLink,
  Info,
  Loader2,
  Mail,
  Instagram,
  Video,
  Play,
} from "lucide-react";
import { getWeekRange } from "@/lib/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Function to convert URLs to embed URLs
const getEmbedUrl = (url: string): { embedUrl: string | null; type: 'tiktok' | 'instagram' | 'unknown' } => {
  if (!url) return { embedUrl: null, type: 'unknown' };
  
  // TikTok URL pattern
  const tiktokPattern = /https:\/\/(www\.)?(tiktok\.com)\/@([^\/]+)\/video\/(\d+)/i;
  const tiktokMatch = url.match(tiktokPattern);
  
  if (tiktokMatch) {
    const videoId = tiktokMatch[4];
    return {
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
      type: 'tiktok'
    };
  }
  
  // Instagram URL pattern
  const instagramPattern = /https:\/\/(www\.)?(instagram\.com)\/(p|reel)\/([^\/]+)/i;
  const instagramMatch = url.match(instagramPattern);
  
  if (instagramMatch) {
    const postType = instagramMatch[3]; // 'p' for post or 'reel' for reel
    const postId = instagramMatch[4];
    return {
      embedUrl: `https://www.instagram.com/${postType}/${postId}/embed`,
      type: 'instagram'
    };
  }
  
  return { embedUrl: null, type: 'unknown' };
};

// Video embed component with loading state
function VideoEmbed({ url, type }: { url: string, type: 'tiktok' | 'instagram' | 'unknown' }) {
  const [isLoading, setIsLoading] = useState(true);
  
  // Only render iframe for supported types
  if (type === 'unknown') {
    return null;
  }
  
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 rounded-md">
          <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
        </div>
      )}
      
      <div 
        className="relative w-full overflow-hidden" 
        style={{ 
          paddingBottom: type === 'tiktok' ? '177.77%' : '125%',
          minHeight: '250px'
        }}
      >
        <iframe 
          src={url}
          className="absolute top-0 left-0 w-full h-full border-0"
          allowFullScreen
          scrolling="no"
          frameBorder="0"
          onLoad={() => setIsLoading(false)}
          allow={type === 'tiktok' ? "encrypted-media;" : ""}
        ></iframe>
      </div>
    </div>
  );
}

interface WinnerSelectionProps {
  challenges: WeeklyChallenge[];
  submissions: ChallengeSubmission[];
  loading: boolean;
  onSelectWinner: (challengeId: string, submissionId: string) => void;
  selectedWeek: number;
  selectedYear: number;
}

export function WinnerSelection({
  challenges,
  submissions,
  loading,
  onSelectWinner,
  selectedWeek,
  selectedYear,
}: WinnerSelectionProps) {
  const currentChallenge = challenges.find(
    (c) => c.week === selectedWeek && c.year === selectedYear
  );
  
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{url: string, type: 'tiktok' | 'instagram' | 'unknown'} | null>(null);

  const openVideoModal = (url: string | undefined) => {
    if (!url) return;
    
    const { embedUrl, type } = getEmbedUrl(url);
    if (embedUrl) {
      setSelectedVideo({url: embedUrl, type});
      setVideoModalOpen(true);
    }
  };

  if (!currentChallenge) {
    return (
      <div className="text-center py-16 flex flex-col items-center justify-center">
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Info className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-lg text-gray-600 font-medium">
          No challenge found for week {selectedWeek}, {selectedYear}
        </p>
        <p className="text-sm mt-2 text-gray-500">
          Create a new challenge in the &quot;Weekly Challenges&quot; tab
        </p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-16 flex flex-col items-center justify-center">
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Info className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-lg text-gray-600 font-medium">
          No submissions for this week
        </p>
        <p className="text-sm mt-2 text-gray-500">
          Wait for participants to submit their entries
        </p>
      </div>
    );
  }

  const range = getWeekRange(currentChallenge.week, currentChallenge.year);
  const hasWinner = !!currentChallenge.winner_submission_id;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border border-green-200 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xl text-green-700">
            {currentChallenge.title}
          </h3>

          {hasWinner && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              <span>Winner Selected</span>
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
          <CalendarRange className="h-4 w-4" />
          <span className="font-medium">Week {currentChallenge.week}</span>
          <span>•</span>
          <span>
            {range.start.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            -{" "}
            {range.end.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        {currentChallenge.description && (
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            {currentChallenge.description}
          </p>
        )}
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-green-600" />
          <span>Submissions ({submissions.length})</span>
        </h4>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-green-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading submissions...</p>
          </div>
        ) : (
          submissions.map((submission, index) => {
            const isWinner =
              submission.id === currentChallenge.winner_submission_id;

            return (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div
                  className={`p-5 rounded-xl transition-all duration-300 ${
                    isWinner
                      ? "bg-gradient-to-br from-amber-50 to-white border-2 border-amber-300 shadow-lg"
                      : "bg-white hover:shadow-md border border-gray-200 hover:border-green-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 border border-gray-200">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/personas/svg?seed=${submission.profiles?.avatar_seed}`}
                          alt={submission.profiles?.display_name || "User"}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                          {(
                            submission.profiles?.display_name ||
                            submission.profiles?.username ||
                            "U"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">
                            {submission.profiles?.display_name ||
                              submission.profiles?.username ||
                              "Anonymous User"}
                          </span>
                          {isWinner && (
                            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white flex items-center gap-1 px-2">
                              <Medal className="h-3 w-3" />
                              <span>Winner</span>
                            </Badge>
                          )}
                        </div>

                        <p className="mt-2 text-sm text-gray-600">
                          {submission.comment}
                        </p>

                        {submission.video_url && (
                          <>
                            {(() => {
                              const { embedUrl, type } = getEmbedUrl(submission.video_url);
                              
                              if (embedUrl) {
                                return (
                                  <div className="mt-3 flex items-center">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openVideoModal(submission.video_url);
                                      }}
                                      className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 flex items-center gap-1"
                                    >
                                      <Play className="h-3 w-3" />
                                      <span>Watch {type === 'tiktok' ? 'TikTok' : 'Instagram'} Video</span>
                                    </Button>
                                  </div>
                                );
                              }
                              
                              return (
                                <a
                                  href={submission.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 text-sm text-green-600 hover:text-green-700 hover:underline inline-flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View submission
                                </a>
                              );
                            })()}
                          </>
                        )}

                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs font-medium text-gray-700 mb-2">Contact Information:</p>
                          <div className="flex items-center gap-2">
                            {submission.contact_method === "email" ? (
                              <>
                                <Mail className="h-3.5 w-3.5 text-blue-500" />
                                <a 
                                  href={`mailto:${submission.contact_value}`}
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  {submission.contact_value}
                                </a>
                              </>
                            ) : (
                              <>
                                <Instagram className="h-3.5 w-3.5 text-pink-600" />
                                <a 
                                  href={`https://instagram.com/${submission.contact_value.replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-pink-600 hover:underline"
                                >
                                  {submission.contact_value}
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => onSelectWinner(currentChallenge.id, submission.id)}
                      disabled={loading || isWinner}
                      className={`min-w-[110px] h-fit transition-all duration-300 ${
                        isWinner
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-100 cursor-default border border-amber-200"
                          : "text-white shadow-md"
                      }`}
                    >
                      {isWinner ? (
                        <span className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          Winner
                        </span>
                      ) : loading ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Selecting...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Medal className="h-4 w-4" />
                          Select
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Video Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-xl max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-green-600" />
              <span>
                {selectedVideo?.type === 'tiktok' ? 'TikTok Video' : 'Instagram Post'}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {selectedVideo && <VideoEmbed url={selectedVideo.url} type={selectedVideo.type} />}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setVideoModalOpen(false)}
              className="text-gray-700 border-gray-200 hover:bg-gray-50"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
