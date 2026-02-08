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
  const [canLike, setCanLike] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    // 检查冷却时间
    const cooldownKey = `cooldown:${date}`;
    const cooldownEnd = localStorage.getItem(cooldownKey);
    
    if (cooldownEnd) {
      const remainingMs = parseInt(cooldownEnd) - Date.now();
      if (remainingMs > 0) {
        setCanLike(false);
        setCooldownSeconds(Math.ceil(remainingMs / 1000));
        
        // 倒计时
        const timer = setInterval(() => {
          const remaining = parseInt(localStorage.getItem(cooldownKey) || '0') - Date.now();
          if (remaining <= 0) {
            setCanLike(true);
            setCooldownSeconds(0);
            clearInterval(timer);
          } else {
            setCooldownSeconds(Math.ceil(remaining / 1000));
          }
        }, 1000);
        
        return () => clearInterval(timer);
      }
    }
  }, [date]);

  const handleLike = async () => {
    if (!canLike || isLoading) return;

    setIsLoading(true);
    const result = await addLike(date);

    if (result.success && result.likes !== undefined) {
      setLikes(result.likes);
      onLikeChange?.(result.likes);
      
      // 设置30秒冷却
      const cooldownKey = `cooldown:${date}`;
      const cooldownEnd = Date.now() + 30000; // 30秒
      localStorage.setItem(cooldownKey, cooldownEnd.toString());
      
      setCanLike(false);
      setCooldownSeconds(30);
      
      // 启动倒计时
      const timer = setInterval(() => {
        const remaining = parseInt(localStorage.getItem(cooldownKey) || '0') - Date.now();
        if (remaining <= 0) {
          setCanLike(true);
          setCooldownSeconds(0);
          clearInterval(timer);
        } else {
          setCooldownSeconds(Math.ceil(remaining / 1000));
        }
      }, 1000);
    } else {
      // 显示错误但不阻止再次点击
      console.error(result.error || '点赞失败');
    }

    setIsLoading(false);
  };

  return (
    <button
      onClick={handleLike}
      disabled={!canLike || isLoading}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
        transition-all duration-200
        ${!canLike
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
          : 'bg-gray-100 hover:bg-pink-50 text-gray-600 hover:text-pink-600 hover:scale-105 cursor-pointer'
        }
        ${isLoading ? 'opacity-50' : ''}
      `}
      title={!canLike ? `${cooldownSeconds}秒后可再次点赞` : '点赞'}
    >
      <svg 
        className={`w-4 h-4 transition-all ${!canLike ? 'fill-pink-400' : 'fill-transparent stroke-current hover:fill-pink-200'}`}
        viewBox="0 0 24 24" 
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className="font-medium">
        {!canLike && cooldownSeconds > 0 ? `${cooldownSeconds}s` : likes}
      </span>
    </button>
  );
}
