import { getAllSentences } from "@/lib/data";
import Timeline from "@/components/Timeline";
import TopLikes from "@/components/TopLikes";

export default async function Home() {
  const sentences = await getAllSentences();

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* 标题 */}
      <header className="text-center py-3 sm:py-4 lg:py-6 bg-white shadow-sm flex-shrink-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-0.5 sm:mb-1">每天一句话</h1>
        <p className="text-xs sm:text-sm text-gray-600">每天随便一句话</p>
      </header>

      {/* 响应式两列布局 */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 overflow-y-auto lg:overflow-hidden">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6 lg:h-full">
          {/* 移动端：排行榜在上方，固定高度 */}
          <aside className="lg:hidden w-full">
            <TopLikes sentences={sentences} />
          </aside>

          {/* 时间线（响应式滚动） */}
          <div className="lg:col-span-8 flex-1 lg:h-full lg:overflow-y-auto lg:overscroll-contain">
            <Timeline initialSentences={sentences} />
          </div>

          {/* 桌面端：排行榜在右侧，固定高度不滚动 */}
          <aside className="hidden lg:block lg:col-span-4 lg:h-full">
            <TopLikes sentences={sentences} />
          </aside>
        </div>
      </div>
    </div>
  );
}
