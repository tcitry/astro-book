# astro-book

一个可深度定制的 Astro 静态阅读主题，延续 [Hugo Book](https://github.com/alex-shpak/hugo-book) 的三栏阅读布局，适合博客、知识库和包含交互实验的技术笔记。

[English](README.md) · [完整入门指南](docs/getting-started.md) · [公开 API 与架构](docs/architecture.md) · [开发与升级](docs/development.md)

**独立文档与 Demo（待发布）：** [tcitry.github.io/astro-book](https://tcitry.github.io/astro-book/)。本仓库的 [examples/basic](examples/basic) 提供完整通用示例，覆盖导航、Markdown/MDX、代码、公式、图表、组件与搜索。GitHub Pages 工作流仅在站点原点与该地址一致时部署；若账号用户站的域名绑定导致继承，仍会生成可下载产物，并在运行摘要中说明阻塞。

**使用案例：** [yindongliang.com](https://yindongliang.com) · [Astro 迁移预览](https://preview.yindongliang.com)。案例站与主题文档分别维护。

## 提供什么

- 响应式侧边导航、文章目录、前后页导航，以及浅色、深色和跟随系统模式。
- Markdown 与 MDX 共用一套渲染配置：构建时生成 KaTeX 公式、按需加载 Mermaid、Shiki 代码高亮、复制代码和宽内容滚动。图表渲染失败时保留源码。
- Pagefind 搜索界面、图片放大、显式 SEO 配置和可选 Giscus 评论组件。
- 文章元数据、列表、标签、提示与分页等通用阅读组件。
- 类型化参数、具名插槽和组件替换，支持持续定制。
- Tailwind CSS v4 工具类优先，复杂规则使用 CSS Modules，字体随包提供。工具类已预编译，Modules 由 Astro 自动处理；消费端无需 Tailwind 或 Sass，旧 SCSS 兼容层已退出构建。
- 普通阅读页面不依赖 React、后端、账号或私有包仓库；交互页面可按需接入前端框架岛屿。

主题聚焦 Hugo Book 的通用阅读能力，并保留框架无关的定制入口。内容读取、URL、tag/category 关系、排序、搜索索引、RSS/sitemap、站点身份与部署由你的项目维护。Weekly、Timeline、Portfolio、Links 和 demo 等自定义页面及其组件、数据类型、专用样式属于站点项目，不进入主题。无需依赖 Starlight，也没有规定内容必须放在哪个目录。

## 运行示例

需要 Node.js 22.12 或更高版本；仓库使用 Node.js 24 验证。

```sh
git clone https://github.com/tcitry/astro-book.git
cd astro-book
npm ci
npm run dev
```

打开 [localhost:4322/astro-book/](http://127.0.0.1:4322/astro-book/)。示例使用独立的公开测试内容，覆盖 Markdown、MDX、组件、插槽与主题切换。

## 接入已有 Astro 项目

当前通过本地 tarball 验证，尚未发布 npm 版本。先在主题仓库执行：

```sh
npm ci
npm run pack:theme
```

将生成的 `tcitry-astro-book-0.1.0.tgz` 复制到站点项目根目录，再执行：

```sh
npm install ./tcitry-astro-book-0.1.0.tgz
```

在站点的 `astro.config.mjs` 中启用：

```js
import { defineConfig } from 'astro/config';
import astroBook from '@tcitry/astro-book';

export default defineConfig({
  site: 'https://example.org',
  output: 'static',
  trailingSlash: 'always',
  integrations: [astroBook()],
});
```

新建 `src/pages/index.astro`：

```astro
---
import BookLayout from '@tcitry/astro-book/components/BookLayout';
---
<BookLayout
  site={{ title: '我的笔记', lang: 'zh-CN' }}
  page={{ title: '首页', url: '/', toc: false }}
  navigation={[{ id: 'home', label: '首页', href: '/', active: true }]}
  seo={{ canonical: new URL('/', Astro.site).href }}
  search={false}
>
  <article class="markdown" data-pagefind-body>
    <h1>我的笔记</h1>
    <p>从静态文章开始，按需加入交互组件。</p>
  </article>
</BookLayout>
```

`BookLayout` 自动引入主题样式和浏览器交互。示例先关闭搜索，生成 Pagefind 索引后再开启。[完整入门指南](docs/getting-started.md) 包含可复制的 Markdown/MDX 布局，以及导航、TOC、公式、图表、SEO、Giscus、插槽覆盖和框架岛屿接入说明。

定制与上游功能移植可参考[样式契约](docs/architecture.md#styles-and-framework-islands)和 [Hugo Book 跟进记录](docs/upstream.md)。

## 开发与验收

```sh
npm run build
npm run check
npm test
npm run verify:package
```

最后一个命令会将真实打包产物安装到独立临时站点，验证类型、构建、HTML、样式、脚本和字体。该站点不使用 Tailwind 编译器，确保主题不依赖扫描消费者源码来补全样式。

升级时保留版本或 tarball 与 lockfile，先在消费者站点验证，再采用新版本。具体流程见[开发、版本管理与回滚](docs/development.md)。

## 许可

MIT。复用的 Hugo Book 代码保留 Alex Shpak 的版权声明和版本来源，详见 [LICENSE](LICENSE) 与[第三方声明](packages/astro-book/THIRD_PARTY_NOTICES.md)。
