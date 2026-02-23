# 技术实现文档

本文档详细介绍 TeacherRate 项目的技术实现细节。

## 目录

1. [系统架构](#系统架构)
2. [数据库设计](#数据库设计)
3. [认证授权](#认证授权)
4. [API 实现](#api-实现)
5. [前端实现](#前端实现)
6. [部署方案](#部署方案)

---

## 系统架构

### 整体架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │────▶│  Database   │
│  (Browser)  │◀────│ (Express)   │◀────│  (MongoDB)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 技术选型理由

| 技术 | 选型理由 |
|------|----------|
| Express.js | 轻量、灵活、社区成熟 |
| MongoDB | 文档模型适合评分系统、JSON 友好 |
| JWT | 无状态认证、适合分布式 |
| Tailwind CSS | 快速开发、响应式支持 |

---

## 数据库设计

### 数据模型

#### User（用户）

```javascript
{
  username: String,        // 用户名 (3-30位, 唯一)
  email: String,           // 邮箱 (唯一)
  password: String,        // 加密后的密码
  role: String,           // 'user' | 'admin'
  isActive: Boolean,       // 账户状态
  profile: {
    firstName: String,    // 名
    lastName: String,     // 姓
    avatarUrl: String     // 头像 URL
  },
  createdAt: Date
}
```

**索引**：
- `username` (唯一)
- `email` (唯一)
- `role`
- `isActive`

#### Teacher（教师）

```javascript
{
  name: String,           // 教师姓名
  description: String,   // 教师简介
  ratingCount: Number,    // 评分次数
  ratingSum: Number,      // 评分总和
  isActive: Boolean,      // 是否启用
  createdAt: Date
}
```

**计算属性**：
- 平均评分 = `ratingSum / ratingCount`

#### Rating（评价）

```javascript
{
  teacherId: ObjectId,    // 关联教师
  userId: String,         // 评价用户
  comment: String,        // 评论内容 (10-32768字)
  isAnonymous: Boolean,   // 是否匿名
  rating: Number,         // 评分 (1-5)
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 更新时间
}
```

**索引**：
- `teacherId`
- `userId`
- 复合索引: `{ teacherId: 1, userId: 1 }` (防止重复评分)

#### Submission（投稿）

```javascript
{
  name: String,           // 待添加的教师姓名
  description: String,    // 教师简介
  submittedBy: String,    // 投稿用户ID
  status: String,         // 'pending' | 'approved' | 'rejected'
  adminNote: String,     // 管理员备注
  createdAt: Date,
  processedAt: Date
}
```

---

## 认证授权

### JWT 实现

使用 `jose` 库实现 JWT：

```javascript
// 生成 Token
const jwt = await new SignJWT({ 
  userId: user._id.toString(),
  username: user.username,
  email: user.email,
  role: user.role
})
.setProtectedHeader({ alg: 'HS256' })
.setIssuedAt()
.setExpirationTime('12h')
.sign(new TextEncoder().encode(secret));

// 验证 Token
const verified = await jwtVerify(token, new TextEncoder().encode(secret));
```

### 中间件

```javascript
const Auth = (req, res, next) => {
  // 1. 从 Header 获取 Token
  const token = req.headers.authorization?.split(' ')[1];
  
  // 2. 验证 Token
  const verified = await jwtVerify(token, secret);
  
  // 3. 注入用户信息到 request
  req.user = {
    userId: verified.payload.userId,
    username: verified.payload.username,
    email: verified.payload.email,
    role: verified.payload.role
  };
  
  next();
};
```

### 管理员权限验证

```javascript
const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: '权限不足' 
    });
  }
  next();
};
```

---

## API 实现

### 路由结构

```
/api
├── /auth
│   ├── POST /register      # 注册
│   ├── POST /login         # 登录
│   ├── GET  /profile      # 获取资料
│   └── PUT  /profile      # 更新资料
├── /teachers
│   ├── GET /              # 教师列表
│   ├── GET /:id           # 教师详情
│   └── GET /:id/ratings   # 教师评价
├── /ratings
│   ├── POST /             # 提交评价
│   └── GET /my            # 我的评价
├── /submissions
│   ├── POST /             # 投稿
│   └── GET /my            # 我的投稿
└── /admin
    ├── /teachers          # 教师管理
    ├── /users            # 用户管理
    ├── /ratings          # 评价管理
    └── /submissions      # 投稿审核
```

### 核心业务逻辑

#### 提交评分流程

```javascript
// 1. 验证输入
if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
  return res.status(400).json({ error: '评分必须是1-5的整数' });
}

// 2. 检查是否已评分
const existing = await ratings.findOne({ userId, teacherId });
if (existing) {
  return res.status(400).json({ error: '您已经评价过该教师' });
}

// 3. 创建评价
const newRating = await ratings.create({ ... });

// 4. 更新教师统计
await teachers.findByIdAndUpdate(teacherId, {
  $inc: { ratingCount: 1, ratingSum: rating }
});
```

#### 投稿审核流程

```javascript
// 1. 验证投稿
const submission = await submissions.findById(id);

// 2. 检查重复教师名
const exists = await teachers.findOne({ name: submission.name });
if (exists) {
  return res.status(400).json({ error: '该教师已存在' });
}

// 3. 创建教师
await teachers.create({ name: submission.name, ... });

// 4. 更新投稿状态
submission.status = 'approved';
submission.processedAt = new Date();
await submission.save();
```

---

## 前端实现

### 页面结构

| 页面 | 功能 |
|------|------|
| `index.html` | 首页、教师列表、搜索 |
| `login.html` | 用户登录 |
| `register.html` | 用户注册 |
| `profile.html` | 个人中心、我的评价 |
| `teacher.html` | 教师详情、提交评价 |
| `submit.html` | 投稿页面 |
| `admin.html` | 管理后台 |

### 认证状态管理

```javascript
// 保存 Token
localStorage.setItem('token', jwt);
localStorage.setItem('user', JSON.stringify(user));

// 获取 Token
const token = localStorage.getItem('token');

// API 请求头
headers: {
  'Authorization': `Bearer ${token}`
}
```

### 姓名显示优先级

```javascript
function getDisplayName(user) {
  if (user.profile?.firstName && user.profile?.lastName) {
    return user.profile.lastName + user.profile.firstName;  // 姓+名
  } else if (user.profile?.firstName) {
    return user.profile.firstName;  // 仅名
  }
  return user.username;  // 用户名
}
```

---

## 部署方案

### Docker Compose

```yaml
services:
  mongodb:
    image: mongo:7
    ports:
      - "27018:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - "5001:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/they
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
```

### 构建优化

1. **多阶段构建**（可选优化）
2. **.dockerignore** 排除不需要的文件
3. **环境变量** 使用 .env 文件

---

## 安全措施

### 已实现的安全特性

| 措施 | 实现方式 |
|------|----------|
| 密码加密 | bcryptjs (12轮salt) |
| SQL注入防护 | MongoDB 参数化查询 |
| XSS防护 | 前端 escapeHtml 转义 + Content-Type |
| CORS | express-cors 白名单配置 |
| 速率限制 | express-rate-limit (全局 + 认证 + 投稿) |
| Helmet | X-Frame-Options, CSP, X-Content-Type-Options 等 |
| 输入验证 | Joi 验证 + 自定义验证 |
| ObjectId 验证 | validateObjectId 中间件 |
| ReDoS 防护 | escapeRegex 转义正则元字符 |
| 分页验证 | parsePagination 限制 page/limit 范围 |

### 中间件说明

#### 1. 速率限制 (Rate Limiting)

```javascript
// config/rateLimit.js
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15分钟
  max: 100                      // 最多100次请求
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,                      // 登录失败最多5次
  skipSuccessfulRequests: true
});

const submissionLimiter = rateLimit({
  windowMs: 60 * 1000,         // 1分钟
  max: 10                      // 最多10次投稿
});
```

#### 2. ObjectId 验证

```javascript
// middleware/validateObjectId.js
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && 
         new mongoose.Types.ObjectId(id).toString() === id;
};
```

#### 3. ReDoS 防护

```javascript
// 转义正则元字符
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
```

#### 4. 分页参数验证

```javascript
const parsePagination = (page, limit, defaultPage = 1, defaultLimit = 20) => {
  const parsedPage = parseInt(page) || defaultPage;
  const parsedLimit = parseInt(limit) || defaultLimit;
  return {
    page: Math.max(1, parsedPage),
    limit: Math.min(100, Math.max(1, parsedLimit))
  };
};
```

### 日志系统

使用 Winston 日志库：

```javascript
// config/logger.js
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

---

## 测试

### 运行测试

```bash
cd backend
npm test
```
