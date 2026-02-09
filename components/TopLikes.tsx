"use client";

import { Sentence } from '@/lib/data';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getTopLikes } from '@/lib/cloudflare-api';
import { Box, Button, Flex, HStack, Skeleton, Text, VStack, Icon } from '@chakra-ui/react';
import { Tooltip } from '@/components/ui/tooltip';

interface TopLikesProps {
  sentences: Sentence[];
}

interface RankedSentence extends Sentence {
  likes: number;
}

export default function TopLikes({ sentences }: TopLikesProps) {
  const [topSentences, setTopSentences] = useState<RankedSentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(10); // 初始值较大，等计算后更新
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
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

  // 根据容器高度动态计算每页显示条数
  useEffect(() => {
    // 必须等数据加载完成且有内容才能计算
    if (isLoading || !firstItemRef.current || !containerRef.current || !contentRef.current) {
      return;
    }

    let resizeTimer: NodeJS.Timeout;
    
    const calculateItemsPerPage = () => {
      const container = containerRef.current;
      const content = contentRef.current;
      const firstItem = firstItemRef.current;
      
      if (!container || !content || !firstItem) return;

      // 获取容器总高度和内容区域的位置
      const containerRect = container.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      
      // 计算内容区域可用高度（容器底部 - 内容区域顶部 - 底部分页高度）
      // 增加预估分页高度，确保分页组件一定能显示
      const paginationHeight = 80; // 预估分页高度（包含边距）
      const safetyMargin = 20; // 额外的安全边距
      const availableHeight = containerRect.bottom - contentRect.top - paginationHeight - safetyMargin;
      
      // 获取单个卡片的实际高度（包含间距）
      const itemRect = firstItem.getBoundingClientRect();
      const itemHeight = itemRect.height;
      const gap = window.matchMedia('(min-width: 640px)').matches ? 10 : 8; // space-y
      const totalItemHeight = itemHeight + gap;
      
      // 计算可以显示的条数：最少3条，最多20条
      // 再减1确保分页组件一定能完整显示
      const calculated = Math.floor(availableHeight / totalItemHeight);
      const items = Math.max(3, Math.min(20, calculated - 1));
      
      setItemsPerPage(prev => {
        // 如果是首次计算或差异较大才更新
        if (prev === 10 || Math.abs(prev - items) >= 2) {
          return items;
        }
        return prev;
      });
    };

    // 防抖处理
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(calculateItemsPerPage, 150);
    };

    // 首次计算需要短暂延迟，确保布局稳定
    const initialTimer = setTimeout(calculateItemsPerPage, 100);

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(resizeTimer);
      clearTimeout(initialTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoading, topSentences.length]); // 依赖 isLoading 和数据长度

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

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(month)}月${parseInt(day)}日`;
  };

  const HeartIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  return (
    <Box
      ref={containerRef}
      bg={{ base: "white", _dark: "gray.800" }}
      rounded="lg"
      shadow="md"
      p={{ base: 4, sm: 5, lg: 6 }}
      display="flex"
      flexDirection="column"
      h="full"
      overflow="hidden"
    >
      <Flex align="center" gap={2} mb={{ base: 3, sm: 4 }}>
        <Text fontSize={{ base: "xl", sm: "2xl" }}>🏆</Text>
        <Text fontSize={{ base: "base", sm: "lg", lg: "xl" }} fontWeight="bold" color={{ base: "gray.800", _dark: "white" }}>
          点赞排行榜
        </Text>
      </Flex>

      <VStack ref={contentRef} gap={{ base: 2, sm: 2.5 }} flex="1" minH="0" align="stretch">
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
                ref={index === 0 ? firstItemRef : undefined}
                align="flex-start"
                gap={{ base: 2, sm: 3 }}
                p={{ base: 2.5, sm: 3 }}
                rounded="lg"
                _hover={{ bg: { base: "gray.50", _dark: "gray.700" } }}
                transition="all 0.2s"
                minH={{ base: "60px", sm: "68px" }}
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
                  {/* Show tooltip for content likely to be truncated (>50 chars) */}
                  <Tooltip 
                    content={sentence.content} 
                    showArrow
                    disabled={sentence.content.length <= 50}
                  >
                    <Text fontSize={{ base: "xs", sm: "sm" }} color={{ base: "gray.700", _dark: "gray.200" }} lineClamp={2}>
                      {sentence.content}
                    </Text>
                  </Tooltip>
                </Box>

                {/* 点赞数 */}
                <Flex flexShrink={0} align="center" gap={{ base: 0.5, sm: 1 }} color="pink.600">
                  <Icon as={HeartIcon} boxSize={{ base: 3.5, sm: 4 }} />
                  <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="semibold">
                    {sentence.likes}
                  </Text>
                </Flex>
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
