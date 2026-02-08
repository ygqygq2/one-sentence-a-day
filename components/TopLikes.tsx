"use client";

import { Sentence } from '@/lib/data';
import { useEffect, useState } from 'react';
import { getAllLikes } from '@/lib/cloudflare-api';

interface TopLikesProps {
  sentences: Sentence[];
}

interface RankedSentence extends Sentence {
  likes: number;
}

export default function TopLikes({ sentences }: TopLikesProps) {
  const [topSentences, setTopSentences] = useState<RankedSentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAndRank() {
      try {
        const likesData = await getAllLikes();
        
        // 合并句子和点赞数据，排序
        const ranked = sentences
          .map(s => ({
            ...s,
            likes: likesData[s.date] || 0
          }))
          .filter(s => s.likes > 0)  // 只显示有点赞的
          .sort((a, b) => b.likes - a.likes)
          .slice(0, 10); // 只显示前 10 名

        setTopSentences(ranked);
      } catch (error) {
        console.error('Failed to fetch likes:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAndRank();
    
    // 每30秒刷新一次
    const interval = setInterval(fetchAndRank, 30000);
    return () => clearInterval(interval);
  }, [sentences]);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(month)}月${parseInt(day)}日`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 h-fit">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">🏆</span>
        点赞排行榜
      </h2>

      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : topSentences.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">暂无点赞数据</p>
        ) : (
          topSentences.map((sentence, index) => (
            <div
              key={sentence.date}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* 排名 */}
              <div className={`
                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg' : ''}
                ${index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md' : ''}
                ${index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md' : ''}
                ${index === 3 ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-sm' : ''}
                ${index === 4 ? 'bg-gradient-to-br from-purple-400 to-purple-500 text-white shadow-sm' : ''}
                ${index > 4 ? 'bg-gray-200 text-gray-600' : ''}
              `}>
                {index + 1}
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">{formatDate(sentence.date)}</p>
                <p className="text-sm text-gray-700 line-clamp-2">{sentence.content}</p>
              </div>

              {/* 点赞数 */}
              <div className="flex-shrink-0 flex items-center gap-1 text-pink-600">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="text-sm font-semibold">{sentence.likes}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
