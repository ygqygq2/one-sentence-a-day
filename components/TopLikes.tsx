"use client";

import { Sentence } from '@/lib/data';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getTopLikes } from '@/lib/cloudflare-api';

interface TopLikesProps {
  sentences: Sentence[];
}

interface RankedSentence extends Sentence {
  likes: number;
}

export default function TopLikes({ sentences }: TopLikesProps) {
  const [topSentences, setTopSentences] = useState<RankedSentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(5); // 移动端默认5条
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLDivElement>(null);

  const sentenceMap = useMemo(() => {
    return new Map(sentences.map((s) => [s.date, s]));
  }, [sentences]);

  const itemsPerPageRef = useRef(itemsPerPage);
  
  useEffect(() => {
    itemsPerPageRef.current = itemsPerPage;
  }, [itemsPerPage]);

  useEffect(() => {
    let active = true;

    async function fetchPage() {
      setIsLoading(true);
      try {
        const data = await getTopLikes(currentPage, itemsPerPageRef.current);
        if (!active) return;

        const ranked = data.items.map((item) => {
          const sentence = sentenceMap.get(item.date);
          return {
            date: item.date,
            content: sentence?.content || '（内容缺失）',
            likes: item.likes,
          };
        });

        setTopSentences(ranked);
        setTotal(data.total || 0);
      } catch (error) {
        console.error('Failed to fetch likes:', error);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchPage();

    const interval = setInterval(fetchPage, 600000); // 10分钟刷新一次
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [currentPage, sentenceMap]);

  // 根据屏幕尺寸设置每页条数（移动端5条，桌面端10条）
  useEffect(() => {
    const updateItemsPerPage = () => {
      // lg 断点是 1024px
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
      setItemsPerPage(isDesktop ? 10 : 5);
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);

    return () => {
      window.removeEventListener('resize', updateItemsPerPage);
    };
  }, []);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / itemsPerPage));
  }, [itemsPerPage, total]);

  // 当itemsPerPage变化时，重新计算当前页码以保持位置
  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(total / itemsPerPage));
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  }, [itemsPerPage, total, currentPage]);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(month)}月${parseInt(day)}日`;
  };

  return (
    <div ref={containerRef} className="bg-white rounded-lg shadow-md p-4 sm:p-5 lg:p-6 flex flex-col h-auto lg:h-full">
      <div ref={headerRef}>
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🏆</span>
          点赞排行榜
        </h2>
      </div>

      <div className="space-y-2 sm:space-y-2.5 flex-1 min-h-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : total === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">暂无点赞数据</p>
        ) : (
          topSentences.map((sentence, index) => (
            <div
              key={sentence.date}
              ref={index === 0 ? firstItemRef : undefined}
              className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors min-h-[60px] sm:min-h-[68px]"
            >
              {/* 排名 */}
              {(() => {
                const rank = index + 1 + (currentPage - 1) * itemsPerPage;
                if (rank === 1) {
                  return <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-lg sm:text-xl">🥇</div>;
                } else if (rank === 2) {
                  return <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-lg sm:text-xl">🥈</div>;
                } else if (rank === 3) {
                  return <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-lg sm:text-xl">🥉</div>;
                } else {
                  return (
                    <div className={`
                      flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${rank === 4 ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-sm' : ''}
                      ${rank === 5 ? 'bg-gradient-to-br from-purple-400 to-purple-500 text-white shadow-sm' : ''}
                      ${rank > 5 ? 'bg-gray-200 text-gray-600' : ''}
                    `}>
                      {rank}
                    </div>
                  );
                }
              })()}

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">{formatDate(sentence.date)}</p>
                <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">{sentence.content}</p>
              </div>

              {/* 点赞数 */}
              <div className="flex-shrink-0 flex items-center gap-0.5 sm:gap-1 text-pink-600">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="text-xs sm:text-sm font-semibold">{sentence.likes}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div ref={paginationRef} className="pt-2 sm:pt-3 mt-auto border-t">
        {total > 0 && !isLoading && (
          <>
            {/* 移动端分页 */}
            <div className="flex sm:hidden items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded border text-gray-600 disabled:text-gray-300 disabled:border-gray-200 hover:bg-gray-50 active:bg-gray-100"
              >
                上一页
              </button>
              
              <span className="text-gray-600">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded border text-gray-600 disabled:text-gray-300 disabled:border-gray-200 hover:bg-gray-50 active:bg-gray-100"
              >
                下一页
              </button>
            </div>

            {/* 桌面端分页 */}
            <div className="hidden sm:flex items-center justify-between gap-2 text-sm">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded border text-gray-600 disabled:text-gray-300 disabled:border-gray-200 hover:bg-gray-50"
              >
                上一页
              </button>

              <div className="flex items-center gap-1">
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded text-xs border ${
                      page === currentPage
                        ? 'bg-pink-50 border-pink-300 text-pink-600'
                        : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded border text-gray-600 disabled:text-gray-300 disabled:border-gray-200 hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
