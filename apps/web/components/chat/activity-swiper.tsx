"use client";

import { useCallback } from "react";
import { MapPin, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SwiperActivity {
  id: string;
  title: string;
  type: string;
  startAt: string;
  locationName: string;
  locationHint: string;
  currentParticipants: number;
  maxParticipants: number;
  imageUrl?: string;
  distance?: number;
  creatorNickname?: string;
}

interface ActivitySwiperProps {
  activities: SwiperActivity[];
  isDarkMode?: boolean;
  onActivityClick?: (activity: SwiperActivity) => void;
}

// ── 活动类型中文映射 ──
const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  food: "🍜 美食",
  entertainment: "🎉 娱乐",
  sports: "⚽ 运动",
  boardgame: "🎲 桌游",
  other: "✨ 其他",
};

function formatType(type: string): string {
  return ACTIVITY_TYPE_LABELS[type] || type;
}

function formatTime(startAt: string): string {
  const date = new Date(startAt);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === date.toDateString();

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const timeStr = `${hours}:${minutes}`;

  if (isToday) return `今天 ${timeStr}`;
  if (isTomorrow) return `明天 ${timeStr}`;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const weekday = weekdays[date.getDay()];

  return `${month}月${day}日 ${weekday} ${timeStr}`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function ActivitySwiper({ activities, isDarkMode = false, onActivityClick }: ActivitySwiperProps) {
  const handleClick = useCallback(
    (activity: SwiperActivity) => {
      onActivityClick?.(activity);
    },
    [onActivityClick]
  );

  if (!activities.length) return null;

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex gap-3 overflow-x-auto px-4 pb-2 pt-1",
          "snap-x snap-mandatory scroll-pl-4",
          "scrollbar-hide"
        )}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {activities.map((activity) => (
          <button
            key={activity.id}
            type="button"
            onClick={() => handleClick(activity)}
            className={cn(
              "snap-center shrink-0",
              "w-[70%] min-w-[240px] max-w-[280px]",
              "rounded-[20px] border text-left transition-all duration-200",
              "overflow-hidden",
              isDarkMode
                ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.07] active:scale-[0.98]"
                : "border-black/8 bg-white/90 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.16)] hover:bg-white active:scale-[0.98]"
            )}
          >
            {/* 封面图区域 */}
            <div
              className={cn(
                "relative h-[120px] w-full",
                "flex items-center justify-center",
                isDarkMode ? "bg-white/[0.04]" : "bg-black/[0.03]"
              )}
            >
              {activity.imageUrl ? (
                <img
                  src={activity.imageUrl}
                  alt={activity.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-3xl opacity-40">{formatType(activity.type).split(" ")[0]}</span>
              )}
              {/* 类型标签 */}
              <span
                className={cn(
                  "absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  isDarkMode
                    ? "bg-black/60 text-white/80 backdrop-blur-md"
                    : "bg-white/80 text-black/70 backdrop-blur-md"
                )}
              >
                {formatType(activity.type)}
              </span>
              {/* 距离标签 */}
              {activity.distance != null && (
                <span
                  className={cn(
                    "absolute right-3 top-3 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                    isDarkMode
                      ? "bg-black/60 text-white/70 backdrop-blur-md"
                      : "bg-white/80 text-black/60 backdrop-blur-md"
                  )}
                >
                  <MapPin className="h-2.5 w-2.5" />
                  {formatDistance(activity.distance)}
                </span>
              )}
            </div>

            {/* 信息区域 */}
            <div className="space-y-1.5 p-3.5">
              <h3
                className={cn(
                  "truncate text-[15px] font-semibold leading-tight tracking-[-0.02em]",
                  isDarkMode ? "text-white/92" : "text-black/86"
                )}
              >
                {activity.title}
              </h3>

              <div className="flex items-center gap-1 text-[12px]">
                <Clock className={cn("h-3 w-3 shrink-0", isDarkMode ? "text-white/35" : "text-black/32")} />
                <span className={cn("truncate", isDarkMode ? "text-white/50" : "text-black/48")}>
                  {formatTime(activity.startAt)}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[12px]">
                <MapPin className={cn("h-3 w-3 shrink-0", isDarkMode ? "text-white/35" : "text-black/32")} />
                <span className={cn("truncate", isDarkMode ? "text-white/50" : "text-black/48")}>
                  {activity.locationName}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[12px]">
                <Users className={cn("h-3 w-3 shrink-0", isDarkMode ? "text-white/35" : "text-black/32")} />
                <span className={cn(isDarkMode ? "text-white/50" : "text-black/48")}>
                  {activity.currentParticipants}/{activity.maxParticipants} 人
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
