"use client";

import { useState, useEffect } from 'react';
import { addLike, hasLiked, markAsLiked } from '@/lib/cloudflare-api';
import { Button, Icon, Text, Box } from '@chakra-ui/react';

interface LikeButtonProps {
  date: string;
  initialLikes: number;
  onLikeChange?: (newCount: number) => void;
}

// 格式化数字，添加 k、m、b 后缀
function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

export default function LikeButton({ date, initialLikes, onLikeChange }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [canLike, setCanLike] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

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
      
      const cooldownKey = `cooldown:${date}`;
      const cooldownEnd = Date.now() + 30000;
      localStorage.setItem(cooldownKey, cooldownEnd.toString());
      
      setCanLike(false);
      setCooldownSeconds(30);
      
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
      console.error(result.error || '点赞失败');
    }

    setIsLoading(false);
  };

  const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  return (
    <Button
      onClick={handleLike}
      disabled={!canLike || isLoading}
      size="sm"
      px={3}
      py={1.5}
      rounded="full"
      fontSize="sm"
      transition="all 0.2s"
      position="relative"
      bg={!canLike ? { base: "gray.200", _dark: "gray.600" } : { base: "gray.100", _dark: "gray.700" }}
      color={!canLike ? { base: "gray.400", _dark: "gray.500" } : { base: "gray.600", _dark: "gray.300" }}
      _hover={canLike ? {
        bg: { base: "pink.50", _dark: "pink.900" },
        color: "pink.600",
        transform: "scale(1.05)"
      } : {}}
      cursor={!canLike ? "not-allowed" : "pointer"}
      opacity={isLoading ? 0.5 : 1}
      title={!canLike ? `${cooldownSeconds}秒后可再次点赞` : '点赞'}
    >
      <Box
        as="span"
        display="inline-flex"
        alignItems="center"
        boxSize={4}
        transition="all 0.2s"
        color={!canLike ? "pink.400" : "inherit"}
        _groupHover={canLike ? { fill: "pink.200" } : {}}
      >
        <HeartIcon filled={!canLike} />
      </Box>
      <Text as="span" fontWeight="medium" ml={1.5}>
        {formatNumber(likes)}
      </Text>
      {!canLike && cooldownSeconds > 0 && (
        <Box
          position="absolute"
          top="-1"
          right="-1"
          bg={{ base: "gray.500", _dark: "gray.400" }}
          color="white"
          fontSize="10px"
          rounded="full"
          w={5}
          h={5}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {cooldownSeconds}
        </Box>
      )}
    </Button>
  );
}
