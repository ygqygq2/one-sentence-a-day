"use client";

import { Sentence } from '@/lib/data';
import { useEffect, useMemo, useState } from 'react';
import { getTopLikes } from '@/lib/cloudflare-api';
import { Box, Button, Flex, HStack, Skeleton, Text, VStack } from '@chakra-ui/react';
import LikeButton from './LikeButton';

interface TopLikesProps {
  sentences: Sentence[];
}

interface RankedSentence extends Sentence {
  likes: number;
}

// 用于 lineClamp hover 时显示全部内容的大数值
const MAX_LINE_CLAMP = 999;

/**
 * 根据视口高度计算排行榜每页显示条数
 * 纯数学计算，不依赖 DOM 测量，避免循环依赖
 */
function calcItemsFromViewport(): number {
  if (typeof window === 'undefined') return 5;

  const vh = window.innerHeight;

  // 各区域高度预估（像素）:
  // header: ~115(lg) / ~95(sm) / ~80(base)
  // layout py*2: ~32
  // container padding*2: ~48(lg) / ~40(sm) / ~32(base)
  // title row + margin-bottom: ~48
  // pagination + pt + border: ~56
  // grid gap: ~24(lg)
  // safety margin: ~30
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
  const overhead = isDesktop ? 355 : 305;

  // 单个卡片高度 ≈ minH(68px) + gap(10px) = 78px，取 80 更保守
  const cardHeightWithGap = 80;

  const available = vh - overhead;
  return Math.max(3, Math.min(10, Math.floor(available / cardHeightWithGap)));
}

export default function TopLikes({ sentences }: TopLikesProps) {
  const [topSentences, setTopSentences] = useState<RankedSentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // lazy initializer：首次渲染前就计算好正确值，首次 fetch 即用正确的 pageSize
  const [itemsPerPage, setItemsPerPage] = useState(() => calcItemsFromViewport());
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [likes, setLikes] = useState<{ [date: string]: number }>({});

  const sentenceMap = useMemo(() => {
    return new Map(sentences.map((s) => [s.date, s]));
  }, [sentences]);

  // 监听窗口大小变化，重新计算每页显示条数
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setItemsPerPage(calcItemsFromViewport());
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 获取排行数据
  useEffect(() => {
    let active = true;

    async function fetchPage() {
      setIsLoading(true);
      try {
        const data = await getTopLikes(currentPage, itemsPerPage);
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
        
        // Update likes state for LikeButton components
        const likesData: { [date: string]: number } = {};
        ranked.forEach((item) => {
          likesData[item.date] = item.likes;
        });
        setLikes(likesData);
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
  }, [currentPage, itemsPerPage, sentenceMap]);

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
    const end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const formatDate = (dateStr: string) => {
    const [, month, day] = dateStr.split('-');
    return `${parseInt(month)}月${parseInt(day)}日`;
  };

  return (
    <Box
      bg={{ base: "white", _dark: "gray.700" }}
      rounded="lg"
      shadow="md"
      p={{ base: 4, sm: 5, lg: 6 }}
      display="flex"
      flexDirection="column"
      h="full"
      overflow="hidden"
      w="full"
    >
      <Flex align="center" gap={2} mb={{ base: 3, sm: 4 }} flexShrink={0}>
        <Text fontSize={{ base: "xl", sm: "2xl" }}>🏆</Text>
        <Text fontSize={{ base: "base", sm: "lg", lg: "xl" }} fontWeight="bold" color={{ base: "gray.800", _dark: "white" }}>
          点赞排行榜
        </Text>
      </Flex>

      {/* 卡片列表：flex=1 + overflowY auto 做兜底，即使计算偏差也能滚动 */}
      <VStack
        gap={{ base: 2, sm: 2.5 }}
        flex="1"
        minH="0"
        align="stretch"
        overflowY="auto"
        css={{ scrollbarGutter: "stable" }}
      >
        {isLoading ? (
          <VStack gap={3}>
            {[1, 2, 3].map(i => (
              <Box key={i}>
                <Skeleton h={4} w="75%" mb={2} />
                <Skeleton h={3} w="50%" />
              </Box>
            ))}
          </VStack>
        ) : total === 0 ? (
          <Text color={{ base: "gray.500", _dark: "gray.400" }} fontSize="sm" textAlign="center" py={8}>
            暂无点赞数据
          </Text>
        ) : (
          topSentences.map((sentence, index) => {
            const rank = index + 1 + (currentPage - 1) * itemsPerPage;
            return (
              <Flex
                key={sentence.date}
                align="flex-start"
                gap={{ base: 2, sm: 3 }}
                p={{ base: 2.5, sm: 3 }}
                rounded="lg"
                _hover={{ bg: { base: "gray.50", _dark: "gray.700" } }}
                transition="all 0.2s"
                minH={{ base: "60px", sm: "68px" }}
                role="group"
              >
                {/* 排名 */}
                <Box flexShrink={0} w={{ base: rank <= 3 ? 6 : 5, sm: rank <= 3 ? 7 : 6 }} h={{ base: rank <= 3 ? 6 : 5, sm: rank <= 3 ? 7 : 6 }}>
                  {rank === 1 ? (
                    <Text fontSize={{ base: "lg", sm: "xl" }}>🥇</Text>
                  ) : rank === 2 ? (
                    <Text fontSize={{ base: "lg", sm: "xl" }}>🥈</Text>
                  ) : rank === 3 ? (
                    <Text fontSize={{ base: "lg", sm: "xl" }}>🥉</Text>
                  ) : (
                    <Flex
                      w="full"
                      h="full"
                      rounded="full"
                      align="center"
                      justify="center"
                      fontSize="xs"
                      fontWeight="bold"
                      bg={rank === 4 ? "blue.400" : rank === 5 ? "purple.400" : { base: "gray.200", _dark: "gray.600" }}
                      color={rank <= 5 ? "white" : { base: "gray.600", _dark: "gray.300" }}
                      bgGradient={rank === 4 ? "to-br" : rank === 5 ? "to-br" : undefined}
                      gradientFrom={rank === 4 ? "blue.400" : rank === 5 ? "purple.400" : undefined}
                      gradientTo={rank === 4 ? "blue.500" : rank === 5 ? "purple.500" : undefined}
                      shadow={rank <= 5 ? "sm" : undefined}
                    >
                      {rank}
                    </Flex>
                  )}
                </Box>

                <Box flex="1" minW="0">
                  <Text fontSize="xs" color={{ base: "gray.500", _dark: "gray.400" }} mb={{ base: 0.5, sm: 1 }}>
                    {formatDate(sentence.date)}
                  </Text>
                  {/* Content - default truncated, hover to show full */}
                  <Text 
                    fontSize={{ base: "xs", sm: "sm" }} 
                    color={{ base: "gray.700", _dark: "gray.200" }} 
                    lineClamp={2}
                    _groupHover={{ lineClamp: MAX_LINE_CLAMP }}
                    transition="all 0.2s"
                    title={sentence.content}
                  >
                    {sentence.content}
                  </Text>
                </Box>

                {/* 点赞按钮 */}
                <Box flexShrink={0}>
                  <LikeButton
                    date={sentence.date}
                    initialLikes={likes[sentence.date] || 0}
                    onLikeChange={(newCount) => {
                      setLikes(prev => ({ ...prev, [sentence.date]: newCount }));
                      // Update the sentence likes in the topSentences array as well
                      setTopSentences(prevSentences => 
                        prevSentences.map(s => 
                          s.date === sentence.date ? { ...s, likes: newCount } : s
                        )
                      );
                    }}
                  />
                </Box>
              </Flex>
            );
          })
        )}
      </VStack>

      <Box 
        pt={{ base: 2, sm: 3 }} 
        mt="auto" 
        borderTop="1px" 
        borderColor={{ base: "gray.200", _dark: "gray.700" }}
        flexShrink={0}
      >
        {total > 0 && !isLoading && (
          <>
            {/* 移动端分页 */}
            <Flex display={{ base: "flex", sm: "none" }} align="center" justify="space-between" gap={2} fontSize="xs">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              
              <Text color={{ base: "gray.600", _dark: "gray.400" }}>
                {currentPage} / {totalPages}
              </Text>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>
            </Flex>

            {/* 桌面端分页 */}
            <Flex display={{ base: "none", sm: "flex" }} align="center" justify="space-between" gap={2} fontSize="sm">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                上一页
              </Button>

              <HStack gap={1}>
                {pageNumbers.map((page) => (
                  <Button
                    key={page}
                    size="xs"
                    variant={page === currentPage ? "solid" : "outline"}
                    colorPalette={page === currentPage ? "pink" : "gray"}
                    onClick={() => setCurrentPage(page)}
                    minW={7}
                    h={7}
                  >
                    {page}
                  </Button>
                ))}
              </HStack>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>
            </Flex>
          </>
        )}
      </Box>
    </Box>
  );
}
