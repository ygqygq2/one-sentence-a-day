/**
 * Cloudflare Worker API 客户端
 * 需要配置环境变量 NEXT_PUBLIC_WORKER_URL
 */

// 从环境变量读取 Worker URL，或使用默认值
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://sentence-likes-api.ygqygq2.workers.dev';

export interface LikesData {
  [date: string]: number;
}

/**
 * 获取所有点赞数据
 */
export async function getAllLikes(): Promise<LikesData> {
  try {
    const response = await fetch(`${WORKER_URL}/likes`, {
      method: 'GET',
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error('Failed to fetch likes:', response.statusText);
      return {};
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching likes:', error);
    return {};
  }
}

/**
 * 获取单条句子的点赞数
 */
export async function getLikes(date: string): Promise<number> {
  try {
    const response = await fetch(`${WORKER_URL}/likes/${date}`, {
      method: 'GET',
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return 0;
    }
    
    const data = await response.json();
    return data.likes || 0;
  } catch (error) {
    console.error('Error fetching likes for date:', date, error);
    return 0;
  }
}

/**
 * 点赞
 */
export async function addLike(date: string): Promise<{ success: boolean; likes?: number; error?: string }> {
  try {
    const response = await fetch(`${WORKER_URL}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || '点赞失败' };
    }
    
    return { success: true, likes: data.likes };
  } catch (error) {
    console.error('Error adding like:', error);
    return { success: false, error: '网络错误' };
  }
}

/**
 * 检查是否已点赞（通过 localStorage）
 */
export function hasLiked(date: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`liked:${date}`) === '1';
}

/**
 * 标记已点赞
 */
export function markAsLiked(date: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`liked:${date}`, '1');
}
