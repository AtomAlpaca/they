# TeacherRate - 教师评分系统

一个类似豆瓣电影评分系统的教师评价平台，让学生可以对自己喜欢的教师进行评分和评论。

![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![Express](https://img.shields.io/badge/Express-5.x-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)
![Docker](https://img.shields.io/badge/Docker-ready-blue)

## 功能特性

### 用户系统
- 用户注册/登录（邮箱或用户名）
- JWT 身份认证
- 个人资料管理（支持设置姓名）
- 密码加密存储

### 教师评分
- 浏览教师列表（支持分页）
- 搜索教师
- 查看教师详情和评分
- 提交评分和评论（支持匿名/公开）
- 评分验证（1-5分，评论至少10字）

### 投稿系统
- 用户可以投稿添加未收录的教师
- 管理员审核投稿
- 投稿状态跟踪（待审核/已通过/已拒绝）

### 管理员后台
- 数据仪表盘
- 教师管理（添加/审核/删除）
- 用户管理（查看/封禁/解封）
- 评论管理（查看/删除）
- 投稿审核

## 技术栈

### 后端
- **Runtime**: Node.js 20.x
- **Framework**: Express.js 5.x
- **Database**: MongoDB 7.0 + Mongoose
- **Authentication**: JWT (jose)
- **Validation**: Joi
- **Security**: bcryptjs, cors

### 前端
- **UI**: Tailwind CSS
- **Icons**: Font Awesome 6
- **HTTP**: Fetch API

### 部署
- Docker + Docker Compose

## 快速开始

### 前置要求
- Node.js 20.x+
- MongoDB 7.x
- Docker & Docker Compose（可选）

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/AtomAlpaca/they
cd they
```

2. **安装依赖**
```bash
cd backend
npm install
```

3. **配置环境变量**
```bash
cp backend/.env.example backend/.env
# 编辑 .env 文件，配置 MongoDB 连接和 JWT 密钥
```

`.env` 配置示例：
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/they
JWT_SECRET=your-secret-key-here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5001
LOG_LEVEL=info
```

4. **启动 MongoDB**
```bash
# 使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo:7

# 或本地安装 MongoDB 后启动
mongod --dbpath /path/to/data
```

5. **启动后端**
```bash
cd backend
npm start
# 访问 http://localhost:5000
```

### Docker 部署

1. **构建并启动**
```bash
docker compose up -d --build
```

2. **查看服务状态**
```bash
docker compose ps
```

3. **查看日志**
```bash
docker compose logs -f
```

### 部署端口

| 服务 | 端口 |
|------|------|
| 后端 API + 前端 | 5001 |
| MongoDB | 27018 |

## 项目结构

```
they/
├── backend/
│   ├── config/              # 配置文件
│   │   ├── logger.js       # Winston 日志配置
│   │   └── rateLimit.js    # 速率限制配置
│   ├── controllers/         # 控制器
│   ├── middleware/          # 中间件
│   │   ├── auth.js         # JWT 认证
│   │   └── validateObjectId.js  # ObjectId 验证
│   ├── models/             # 数据模型
│   ├── routes/             # 路由
│   ├── __tests__/          # 测试
│   ├── jest.setup.js       # Jest 测试配置
│   ├── server.js           # 入口文件
│   └── Dockerfile          # Docker 配置
├── frontend/
│   ├── js/                 # 前端 JavaScript
│   │   └── app.js          # 主应用 (含 XSS 防护)
│   ├── index.html          # 首页
│   ├── login.html          # 登录
│   ├── register.html      # 注册
│   ├── profile.html        # 个人中心
│   ├── submit.html         # 投稿页面
│   ├── teacher.html        # 教师详情
│   └── admin.html          # 管理后台
├── docker-compose.yml      # Docker Compose 配置
├── .gitignore              # Git 忽略配置
└── API_DOCS.md             # API 文档
```

## API 文档

详细 API 文档请参考 [API_DOCS.md](./API_DOCS.md)

### 主要接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/teachers` | 获取教师列表 |
| GET | `/api/teachers/:id` | 获取教师详情 |
| POST | `/api/ratings` | 提交评分 |
| POST | `/api/submissions` | 投稿教师 |


## 开发指南

### 运行测试
```bash
docker run --name mongo-test -p 27017:27017 -v mongodbdata:/home/atal/data/db -d mongo
cd backend
npm test
```

