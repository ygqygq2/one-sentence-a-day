import { getAllSentences } from "@/lib/data";
import Timeline from "@/components/Timeline";
import TopLikes from "@/components/TopLikes";
import { Box, Grid, GridItem, Heading, Text } from "@chakra-ui/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import VisualEffects from "@/components/VisualEffects";

export default async function Home() {
  const sentences = await getAllSentences();

  return (
    <Box h="100vh" overflow="hidden" bg={{ base: "gray.50", _dark: "gray.900" }}>
      <VisualEffects />
      {/* 标题 */}
      <Box
        as="header"
        textAlign="center"
        py={{ base: 3, sm: 4, lg: 6 }}
        bg={{ base: "white", _dark: "gray.800" }}
        shadow="sm"
        position="relative"
        flexShrink={0}
      >
        <Box position="absolute" top={{ base: 2, sm: 3, lg: 4 }} right={{ base: 2, sm: 3, lg: 4 }}>
          <ThemeToggle />
        </Box>
        <Heading
          size={{ base: "lg", sm: "xl", lg: "2xl" }}
          color={{ base: "gray.800", _dark: "white" }}
          mb={{ base: 0.5, sm: 1 }}
        >
          每天一句话
        </Heading>
        <Text fontSize={{ base: "xs", sm: "sm" }} color={{ base: "gray.600", _dark: "gray.400" }}>
          每天随便一句话
        </Text>
      </Box>

      {/* 响应式两列布局 */}
      <Box
        maxW="7xl"
        mx="auto"
        py={{ base: 3, sm: 4 }}
        px={{ base: 3, sm: 4, lg: 8 }}
        h={{
          base: "calc(100vh - 80px)",  // 移动端: 标题区域高度约80px (py=3*2 + 标题 + 副标题 + theme toggle)
          sm: "calc(100vh - 95px)",    // 平板: 标题区域高度约95px (py=4*2 + 标题 + 副标题 + theme toggle)
          lg: "calc(100vh - 115px)"    // 桌面: 标题区域高度约115px (py=6*2 + 标题 + 副标题 + theme toggle)
        }}
      >
        <Grid
          templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
          gap={{ base: 3, sm: 4, lg: 6 }}
          h="full"
        >
          {/* 移动端：排行榜在上方 */}
          <GridItem display={{ base: "block", lg: "none" }} h="full">
            <TopLikes sentences={sentences} />
          </GridItem>

          {/* 时间线 */}
          <GridItem 
            h="full" 
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(0, 0, 0, 0.2)',
              },
              '_dark': {
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                },
              },
            }}
          >
            <Timeline initialSentences={sentences} />
          </GridItem>

          {/* 桌面端：排行榜在右侧 */}
          <GridItem display={{ base: "none", lg: "flex" }} h="full">
            <TopLikes sentences={sentences} />
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
}
