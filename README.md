# 白狮阿杭计划

项目由三个彼此独立、数据互通的部分组成：

- `src/`：HBuilderX 可直接打开的 Vue 3 + uni-app 用户端，支持 H5 和微信小程序。
- `admin/`：独立桌面管理网站，固定为左侧目录、右侧内容；用户端没有后台入口，也不会跳转到后台。
- `server.ts`、`server/`：Node.js + Express API，生产环境使用 MySQL。

用户端可浏览和搜索动物档案、时间线、关系和物种知识，微信登录后可投稿观察记录/照片、收藏动物、点亮纪念蜡烛。登录用户还可以发起协作任务，其他用户可为公开任务填写文字、来源和佐证照片。任务和线索均统一保存为 `pending`，只有管理端审核通过后才会公开或计入任务进度。

## 本地预览

```bash
npm install
npm run dev
```

启动日志会显示实际端口。默认端口为：

- 用户端：`http://localhost:5173/`
- 独立管理端：`http://localhost:5174/admin/`
- API：`http://localhost:3000/api/health`

本项目没有内存数据库回退。开发和生产都连接 MySQL；MySQL 未启动或配置错误时，Node API 会直接启动失败，不会显示另一套演示数据。预览管理账号为 `admin` / `ahang-admin`，只用于开发环境，生产环境必须修改默认密码。

## 前后端 IP 与端口

统一在项目根目录的 `.env` 或 `.env.development` 中配置。完整示例见 `.env.example`：

```env
# 用户端 H5 开发服务器
VITE_DEV_HOST="0.0.0.0"
VITE_DEV_PORT="5173"

# 独立管理端开发服务器
VITE_ADMIN_DEV_HOST="0.0.0.0"
VITE_ADMIN_DEV_PORT="5174"

# Node API 监听地址
HOST="0.0.0.0"
PORT="3000"

# H5 开发代理实际转发到的后端
VITE_API_PROXY_TARGET="http://127.0.0.1:3000"

# 前端直接访问的 API 域名（不要带结尾斜杠）
VITE_API_BASE_URL="https://api.example.com"

# 可单独覆盖微信小程序的 API/图片域名；不填时使用上一项
VITE_MP_API_BASE_URL="https://api.example.com"

# 后端图片文件的持久化目录
UPLOAD_DIR="./uploads"
```

- `0.0.0.0` 是监听所有本机网卡，不是客户端填写的访问地址。仅允许本机访问时改成 `127.0.0.1`。
- 同一台电脑访问使用 `http://127.0.0.1:端口` 或 `http://localhost:端口`。
- 局域网其他设备访问时，将 `localhost` 换成本机局域网 IPv4，例如 `http://192.168.1.20:5173`；Windows 可运行 `ipconfig` 查看 IPv4。
- 修改用户端端口的代码位置是 `vite.config.ts`，管理端是 `admin/vite.config.ts`，Node 后端是 `server.ts`；正常情况下只需改环境变量，不必修改代码。
- 前端 API 与图片域名的读取代码在 `src/services/api.ts`。H5 读取 `VITE_API_BASE_URL`；微信小程序优先读取 `VITE_MP_API_BASE_URL`，未配置时回退到 `VITE_API_BASE_URL`。不要在页面组件里写死后端地址。
- 本地 H5 将 `VITE_API_BASE_URL` 留空即可，此时 `/api` 和 `/uploads` 都通过 `vite.config.ts` 代理到 `VITE_API_PROXY_TARGET`。微信小程序没有该开发代理，必须在编译前填写可访问的 API 域名。
- 独立管理端默认使用相对地址 `/api`；开发时由 `admin/vite.config.ts` 使用同一个 `VITE_API_PROXY_TARGET` 转发，生产时由 Node 同域提供或由服务器反向代理。
- 微信小程序正式环境不允许使用 `localhost`、`127.0.0.1`、局域网 IP 或普通 HTTP；必须使用 HTTPS 域名，并在微信公众平台的服务器域名配置中核对 request、uploadFile 和 downloadFile 图片访问域名。

修改后需要重新启动开发服务；`VITE_API_BASE_URL` 和 `VITE_MP_API_BASE_URL` 是构建时变量，修改后还需要重新编译 H5 或微信小程序。

## MySQL 与生产配置

复制 `.env.example` 为 `.env`，设置 MySQL、管理账号、会话签名和微信参数。数据库完整初始化文件为 `database/project_ahang.sql`，包含表结构以及当前前端已有的动物、物种、回忆、纪念留言和协作任务。可用仓库中的 Compose 文件启动并导入：

```bash
docker compose up -d mysql
npm run db:init
npm run db:migrate-images
npm run build
npm start
```

`npm run db:init` 读取 `.env`（没有 `.env` 时读取 `.env.development`）并导入完整 SQL。初始化内容使用 `INSERT IGNORE`，再次运行不会覆盖管理后台已经修改的数据。只创建/升级空表可运行 `npm run db:migrate`。已有数据库从旧 `/static` 图片地址升级时运行一次 `npm run db:migrate-images`；脚本只替换已知图片地址，并在结束前检查数据库中是否还残留 `/static` 业务图片路径。

主要表包括：`users`、`animals`、`species`、`submissions`、`collaboration_tasks`、`memories`、`memory_likes`、`memorial_comments`、`comment_flowers`、`favorites`、`observation_likes`、`candles`、`animal_metrics`、`media_files`、`review_logs`。图片原文件持久化保存在 `UPLOAD_DIR`（默认项目根目录 `uploads/`），`media_files` 保存上传者、原文件名、类型、大小、相对磁盘路径和公开 URL；动物、观察、回忆及投稿记录在各自 MySQL 数据中保存 `/uploads/...` 地址。

生产部署必须把 `uploads/` 作为持久化目录并随备份保留，不能在每次发布时清空。管理后台的动物档案和公众回忆编辑框支持上传或更换图片，并可直接在浏览器打开原图。

生产构建后，Node 服务在同一域名提供：

- `/`：用户端 H5
- `/admin/`：独立管理端
- `/api/*`：前后端共用 API
- `/uploads/*`：从后端持久化目录返回动物、回忆和用户投稿图片
- `/api/media/*`：兼容旧图片记录，并重定向到对应 `/uploads/*` 地址

这只是部署路径共用同一服务；两个前端没有互相入口或跳转关系。也可以将管理端部署到单独域名，只需把 `/api` 反向代理到同一 Node 服务。

## 后端日志

Node 服务将接口访问、响应状态、耗时、登录用户 ID、服务启动/停止和错误写入 `LOG_DIR`。默认目录是项目根目录下的 `logs/`，每天生成一个 `app-YYYY-MM-DD.log` JSON 行文件。日志不记录请求正文、密码、微信 code、AppSecret 或会话 Token。

日志日期和每周清理边界由 `LOG_TIMEZONE` 控制，默认使用 `Asia/Shanghai`。服务启动时会立即清理一次；运行期间每小时检查周次，并在进入新的一周后删除上一周及更早的日志，只保留本周日志。可在后端环境变量中修改：

```env
LOG_DIR="./logs"
LOG_TIMEZONE="Asia/Shanghai"
```

## 微信登录

在 `.env` 中配置：

```env
WECHAT_MINI_APPID="微信小程序 AppID"
WECHAT_MINI_SECRET="微信小程序 AppSecret"
WECHAT_SESSION_SECRET="足够长的随机值"
```

同时在 `src/manifest.json` 填入相同的小程序 AppID。正式环境 API 必须是微信允许的 HTTPS 域名；如前后端不同源，在构建前设置 `VITE_API_BASE_URL`。

客户端先通过微信小程序官方的 `chooseAvatar` 与 `type="nickname"` 能力取得用户主动选择的头像、昵称，再调用 `uni.login` 获取一次性 `code`。Node 后端用 `code` 向微信换取 `openid`，创建或更新 MySQL `users` 表中的账号，并签发本项目自己的会话令牌。微信 `session_key` 和 AppSecret 都不会下发到前端。

头像文件会通过 `/api/uploads` 保存到后端 `uploads/media/`，`users.avatar_url` 只保存可访问的 `/uploads/...` 地址；昵称保存在 `users.nickname`。登录后的用户可在“我的 → 头像与昵称”重新选择头像和修改昵称，前端通过 `PUT /api/auth/profile` 同步到 MySQL。管理端“用户管理”会显示同一份昵称和头像。

本地开发配置文件 `.env.development` 已填入与 `src/manifest.json` 一致的 AppID，但 `WECHAT_MINI_SECRET` 必须由小程序管理员在微信公众平台取得后自行填写，不能放进前端代码。服务器部署时也必须在服务器环境变量中配置同一组 AppID/AppSecret；只配置本地文件不会自动同步到线上服务器。

## HBuilderX

1. 在 HBuilderX 中打开项目根目录。
2. H5：运行 → 运行到浏览器。
3. 微信小程序：运行 → 运行到小程序模拟器 → 微信开发者工具。

`manifest.json`、`pages.json`、页面与静态资源均在 `src/` 下，HBuilderX 可直接识别。

## 检查与构建

```bash
npm run typecheck
npm run test:logs
npm run build:h5
npm run build:admin
npm run build:mp-weixin
npm run build:server
```

构建产物：

- 用户端 H5：`dist/build/h5`
- 微信小程序：`dist/build/mp-weixin`
- 管理端：`dist/admin`
- Node 服务：`dist/server.cjs`
