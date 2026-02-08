"use client";

import { Sentence } from "@/lib/data";
import { useEffect, useState, useRef, useCallback } from "react";
import LikeButton from "./LikeButton";

interface TimelineProps {
  initialSentences: Sentence[];
  initialLikes: { [date: string]: number };
}

const ITEMS_PER_PAGE = 10;

// 格式化日期显示
function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  return {
    monthDay: `${parseInt(month)}月${parseInt(day)}日`,
    year: year
  };
}

export default function Timeline({ initialSentences, initialLikes }: TimelineProps) {
  const [displayedSentences, setDisplayedSentences] = useState<Sentence[]>(
    initialSentences.slice(0, ITEMS_PER_PAGE)
  );
  const [hasMore, setHasMore] = useState(initialSentences.length > ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setTimeout(() => {
      const currentLength = displayedSentences.length;
      const nextSentences = initialSentences.slice(
        currentLength,
        currentLength + ITEMS_PER_PAGE
      );

      setDisplayedSentences((prev) => [...prev, ...nextSentences]);
      setHasMore(currentLength + nextSentences.length < initialSentences.length);
      setIsLoading(false);
    }, 500);
  }, [displayedSentences.length, hasMore, initialSentences, isLoading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore]);

  return (
    <div className="w-full">
      <div className="relative">
        {/* 时间线 */}
        <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-indigo-200"></div>

          {/* 句子列表 */}
          <div className="space-y-6 sm:space-y-8">
            {displayedSentences.map((sentence, index) => {
              const { monthDay, year } = formatDate(sentence.date);
              return (
                <div
                  key={sentence.date}
                  className="relative pl-12 sm:pl-20 animate-fadeIn"
                  style={{
                    animationDelay: `${(index % ITEMS_PER_PAGE) * 0.1}s`,
                  }}
                >
                  {/* 时间点圆圈 */}
                  <div className="absolute left-4 sm:left-8 top-3 -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white border-2 sm:border-4 border-blue-400 rounded-full shadow-md"></div>

                  {/* 时间节点 */}
                  <div className="absolute left-4 sm:left-8 top-8 sm:top-9 -translate-x-1/2 w-14 sm:w-16 text-center">
                    <div className="text-[11px] sm:text-sm font-bold text-gray-800 whitespace-nowrap">
                      {monthDay}
                    </div>
                    <div className="text-[9px] sm:text-xs text-gray-600">
                      {year}
                    </div>
                  </div>

                  {/* 内容卡片 */}
                  <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
                    <p className="text-sm sm:text-base text-gray-800 leading-relaxed mb-4">{sentence.content}</p>
                    
                    {/* 点赞按钮 */}
                    <div className="flex justify-end">
                      <LikeButton 
                        date={sentence.date} 
                        initialLikes={likes[sentence.date] || 0}
                        onLikeChange={(newCount) => {
                          setLikes(prev => ({ ...prev, [sentence.date]: newCount }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 加载指示器 */}
          {hasMore && (
            <div ref={observerTarget} className="py-6 sm:py-8 text-center">
              {isLoading && (
                <div className="inline-block">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          )}

          {/* 结束提示 */}
          {!hasMore && displayedSentences.length > 0 && (
            <div className="py-6 sm:py-8 text-center text-gray-500">
              <p className="text-sm sm:text-base">已加载全部内容</p>
            </div>
          )}

          {/* 空状态 */}
          {displayedSentences.length === 0 && (
            <div className="text-center py-16 sm:py-20">
              <p className="text-gray-500 text-base sm:text-lg">还没有记录，开始写下第一句话吧！</p>
            </div>
          )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
