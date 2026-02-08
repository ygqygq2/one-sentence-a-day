import { getAllSentences } from "@/lib/data";
import Timeline from "@/components/Timeline";
import TopLikes from "@/components/TopLikes";

export default async function Home() {
  const sentences = await getAllSentences();

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* 标题 */}
      <header className="text-center py-4 sm:py-6 bg-white shadow-sm flex-shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">每天一句话</h1>
        <p className="text-xs sm:text-sm text-gray-600">每天随便一句话</p>
      </header>

      {/* 两列布局 - 各自滚动 */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-full">
          {/* 左侧：时间线（独立滚动） */}
          <div className="lg:col-span-8 h-full overflow-y-auto overscroll-contain">
            <Timeline initialSentences={sentences} />
          </div>

          {/* 右侧：点赞排行榜（独立滚动） */}
          <aside className="hidden lg:block lg:col-span-4 h-full overflow-y-auto overscroll-contain">
            <TopLikes sentences={sentences} />
          </aside>
        </div>
      </div>
    </div>
  );
}
