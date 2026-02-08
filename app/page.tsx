import { getAllSentences } from "@/lib/data";
import { getAllLikes } from "@/lib/cloudflare-api";
import Timeline from "@/components/Timeline";
import TopLikes from "@/components/TopLikes";

export default async function Home() {
  const sentences = await getAllSentences();
  const likesData = await getAllLikes();

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* 标题 */}
      <header className="text-center py-6 sm:py-8 bg-white shadow-sm">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">每天一句话</h1>
        <p className="text-sm sm:text-base text-gray-600">记录生活的点滴瞬间</p>
      </header>

      {/* 两列布局 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* 左侧：时间线（移动端和桌面端都显示） */}
          <div className="lg:col-span-8">
            <Timeline initialSentences={sentences} initialLikes={likesData} />
          </div>

          {/* 右侧：点赞排行榜（移动端隐藏，桌面端显示） */}
          <aside className="hidden lg:block lg:col-span-4">
            <TopLikes sentences={sentences} likesData={likesData} />
          </aside>
        </div>
      </div>
    </div>
  );
}
