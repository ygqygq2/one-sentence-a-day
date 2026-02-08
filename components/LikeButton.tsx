"use client";

import { useState, useEffect } from 'react';
import { addLike, hasLiked, markAsLiked } from '@/lib/cloudflare-api';

interface LikeButtonProps {
  date: string;
  initialLikes: number;
  onLikeChange?: (newCount: number) => void;
}

export default function LikeButton({ date, initialLikes, onLikeChange }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 检查是否已点赞
    setIsLiked(hasLiked(date));
  }, [date]);

  const handleLike = async () => {
    if (isLiked || isLoading) return;

    setIsLoading(true);
    const result = await addLike(date);

    if (result.success && result.likes !== undefined) {
      setLikes(result.likes);
      setIsLiked(true);
      markAsLiked(date);
      onLikeChange?.(result.likes);
    } else {
      // 显示错误
      alert(result.error || '点赞失败，请稍后重试');
    }

    setIsLoading(false);
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLiked || isLoading}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
        transition-all duration-200
        ${isLiked 
          ? 'bg-pink-100 text-pink-600 cursor-default' 
          : 'bg-gray-100 hover:bg-pink-50 text-gray-600 hover:text-pink-600 cursor-pointer'
        }
        ${isLoading ? 'opacity-50' : ''}
      `}
      title={isLiked ? '已点赞' : '点赞'}
    >
      <svg 
        className={`w-4 h-4 ${isLiked ? 'fill-pink-600' : 'fill-transparent stroke-current'}`}
        viewBox="0 0 24 24" 
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className="font-medium">{likes}</span>
    </button>
  );
}
