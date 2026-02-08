# 每天一句话

## 使用提示

下面流程照着点就行，不需要会写代码：

1. 打开这个仓库的页面，点击 **Agent**（仓库里的 AI 助手）。
2. 在对话里输入：
	- `今日一句话：每天都比昨天进步一点点 - 昵称`
3. Agent 会帮你生成改动并开一个 **Pull requests**。
4. 点击 **Pull requests**，找到刚刚新开的那个，点进去。
5. 点击 **Ready for review**（如果看到这个按钮）。
6. 点击 **Merge** 合并。
7. 合并完成后，点击 **Delete branch**。
8. 等一会儿，网页就更新生效啦 ✅

一个用 Next.js + TypeScript + Tailwind CSS 构建的静态网站，用于展示每天记录的一句话。

## 特性

- ✨ 时间线方式展示
- 📱 响应式设计
- ⚡ 懒加载，性能优化
- 🎨 优雅的动画效果
- 📦 纯静态输出，可部署到任何静态托管服务

## 技术栈

- [Next.js](https://nextjs.org/) - React 框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看效果。

### 构建静态站点

```bash
npm run build
```

构建完成后，静态文件将输出到 `out` 目录。

## 使用方法

### 添加每日一句

在 `data` 目录下创建以日期命名的文件夹，格式为 `YYYY-MM-DD`，然后在文件夹中创建 `README.md` 文件，写入当天的一句话。

示例：

```
data/
├── 2026-02-08/
│   └── README.md  (内容: 生活不是等待暴风雨过去，而是学会在雨中跳舞。)
├── 2026-02-07/
│   └── README.md  (内容: 今天开始记录每天一句话，希望能坚持下去。)
```

### 展示效果

- 最新的句子显示在最上面
- 自动按日期降序排列
- 向下滚动时自动加载更多内容
- 优雅的动画效果

## 部署

本项目配置为静态导出，可以部署到：

- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages
- 任何支持静态文件的托管服务

只需将 `out` 目录的内容上传即可。

## 许可

ISC
