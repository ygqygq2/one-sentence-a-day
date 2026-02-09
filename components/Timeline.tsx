"use client";

import { Sentence } from "@/lib/data";
import { useEffect, useState, useRef, useCallback } from "react";
import { getLikesByDates } from "@/lib/cloudflare-api";
import LikeButton from "./LikeButton";
import { Box, Text, Spinner, Center, VStack } from "@chakra-ui/react";

interface TimelineProps {
  initialSentences: Sentence[];
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

export default function Timeline({ initialSentences }: TimelineProps) {
  const [displayedSentences, setDisplayedSentences] = useState<Sentence[]>(
    initialSentences.slice(0, ITEMS_PER_PAGE)
  );
  const [hasMore, setHasMore] = useState(initialSentences.length > ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [likes, setLikes] = useState<{ [date: string]: number }>({});
  const observerTarget = useRef<HTMLDivElement>(null);
  const fetchedDatesRef = useRef<Set<string>>(new Set());

  const fetchLikesForSentences = useCallback(async (sentences: Sentence[]) => {
    const missingDates = sentences
      .map((s) => s.date)
      .filter((date) => !fetchedDatesRef.current.has(date));

    if (missingDates.length === 0) return;

    const likesData = await getLikesByDates(missingDates);
    missingDates.forEach((date) => fetchedDatesRef.current.add(date));
    setLikes((prev) => ({ ...prev, ...likesData }));
  }, []);

  // 客户端按需获取点赞数据
  useEffect(() => {
    fetchLikesForSentences(displayedSentences);
  }, [displayedSentences, fetchLikesForSentences]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setTimeout(async () => {
      const currentLength = displayedSentences.length;
      const nextSentences = initialSentences.slice(
        currentLength,
        currentLength + ITEMS_PER_PAGE
      );

      setDisplayedSentences((prev) => [...prev, ...nextSentences]);
      setHasMore(currentLength + nextSentences.length < initialSentences.length);
      setIsLoading(false);
      await fetchLikesForSentences(nextSentences);
    }, 500);
  }, [displayedSentences.length, fetchLikesForSentences, hasMore, initialSentences, isLoading]);

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
    <Box w="full" bg={{ base: "white", _dark: "gray.800" }} rounded="lg" shadow="md" p={{ base: 4, sm: 6 }}>
      <Box position="relative">
        {/* 时间线 */}
        <Box
          position="absolute"
          left={{ base: "2.38rem", sm: "2.38rem" }}
          top="0"
          bottom="0"
          w="0.5"
          bgGradient="to-b"
          gradientFrom="blue.200"
          gradientTo="purple.200"
        />

        {/* 句子列表 */}
        <VStack gap={{ base: 6, sm: 8 }} align="stretch">
          {displayedSentences.map((sentence, index) => {
            const { monthDay, year } = formatDate(sentence.date);
            return (
              <Box
                key={sentence.date}
                position="relative"
                pl={{ base: 16, sm: 20 }}
                css={{
                  opacity: 0,
                  animation: "fadeIn 0.6s ease-out forwards",
                  animationDelay: `${(index % ITEMS_PER_PAGE) * 0.1}s`,
                  "@keyframes fadeIn": {
                    from: {
                      opacity: 0,
                      transform: "translateY(20px)",
                    },
                    to: {
                      opacity: 1,
                      transform: "translateY(0)",
                    },
                  },
                }}
              >
                {/* 时间点圆圈 */}
                <Box
                  position="absolute"
                  left={{ base: "2.425rem", sm: "2.425rem" }}
                  top="3"
                  transform="translateX(-50%)"
                  w={{ base: 3, sm: 4 }}
                  h={{ base: 3, sm: 4 }}
                  bgGradient="to-br"
                  gradientFrom="blue.400"
                  gradientTo="purple.500"
                  border="2px"
                  borderWidth={{ base: "2px", sm: "3px" }}
                  borderColor={{ base: "white", _dark: "gray.800" }}
                  rounded="full"
                  shadow="lg"
                />

                {/* 时间节点 */}
                <Box
                  position="absolute"
                  left={{ base: "2.425rem", sm: "2.425rem" }}
                  top={{ base: 8, sm: 9 }}
                  transform="translateX(-50%)"
                  minW="3rem"
                  textAlign="center"
                >
                  <Text fontSize={{ base: "11px", sm: "sm" }} fontWeight="bold" color={{ base: "gray.800", _dark: "white" }} whiteSpace="nowrap">
                    {monthDay}
                  </Text>
                  <Text fontSize={{ base: "9px", sm: "xs" }} color={{ base: "gray.600", _dark: "gray.400" }} whiteSpace="nowrap">
                    {year}
                  </Text>
                </Box>

                {/* 内容卡片 */}
                <Box
                  bg={{ base: "white", _dark: "gray.700" }}
                  rounded="lg"
                  shadow="sm"
                  p={{ base: 3, sm: 4 }}
                  _hover={{ shadow: "md" }}
                  transition="all 0.2s"
                  role="group"
                >
                  {/* 内容 - 默认省略，悬停显示完整 */}
                  <Text
                    fontSize={{ base: "xs", sm: "sm" }}
                    color={{ base: "gray.700", _dark: "gray.200" }}
                    lineHeight="relaxed"
                    mb={3}
                    lineClamp={2}
                    _groupHover={{ lineClamp: 999 }}
                    transition="all 0.2s"
                    title={sentence.content}
                  >
                    {sentence.content}
                  </Text>

                  {/* 点赞按钮 */}
                  <Box display="flex" justifyContent="flex-end">
                    <LikeButton
                      date={sentence.date}
                      initialLikes={likes[sentence.date] || 0}
                      onLikeChange={(newCount) => {
                        setLikes(prev => ({ ...prev, [sentence.date]: newCount }));
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            );
          })}
        </VStack>

        {/* 加载指示器 */}
        {hasMore && (
          <Box ref={observerTarget} py={{ base: 6, sm: 8 }}>
            {isLoading && (
              <Center>
                <Spinner size={{ base: "md", sm: "lg" }} color="blue.500" />
              </Center>
            )}
          </Box>
        )}

        {/* 结束提示 */}
        {!hasMore && displayedSentences.length > 0 && (
          <Center py={{ base: 6, sm: 8 }}>
            <Text fontSize={{ base: "sm", sm: "base" }} color={{ base: "gray.500", _dark: "gray.400" }}>
              已加载全部内容
            </Text>
          </Center>
        )}

        {/* 空状态 */}
        {displayedSentences.length === 0 && (
          <Center py={{ base: 16, sm: 20 }}>
            <Text fontSize={{ base: "base", sm: "lg" }} color={{ base: "gray.500", _dark: "gray.400" }}>
              还没有记录，开始写下第一句话吧！
            </Text>
          </Center>
        )}
      </Box>
    </Box>
  );
}
