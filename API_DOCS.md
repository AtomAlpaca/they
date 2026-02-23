# API 接口文档

## 基础信息

- 基础路径: `/api`
- 认证方式: Bearer Token (JWT)
- 公共接口: 无需认证
- 受保护接口: 需要在请求头中添加 `Authorization: Bearer <token>`

---

## 认证相关 `/api/auth`

### 用户注册
```
POST /api/auth/register
Content-Type: application/json

请求体:
{
  "username": "string",    // 必填, 3-30位字母数字
  "email": "string",      // 必填, 有效邮箱
  "password": "string"    // 必填, 至少6位
}

响应 (201):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "username": "string",
    "email": "string",
    "role": "user",
    "isActive": true,
    "_id": "string"
  }
}
```

### 用户登录
```
POST /api/auth/login
Content-Type: application/json

请求体:
{
  "email": "string",      // 邮箱或用户名
  "password": "string"
}

响应 (200):
{
  "success": true,
  "message": "Login successful",
  "jwt": "string",        // JWT令牌
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "user|admin",
    "profile": {
      "firstName": "string",
      "lastName": "string"
    }
  }
}
```

### 获取用户资料
```
GET /api/auth/profile
Authorization: Bearer <token>

响应 (200):
{
  "success": true,
  "data": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "user|admin",
    "profile": {
      "firstName": "string",
      "lastName": "string"
    }
  }
}
```

### 更新用户资料
```
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

请求体 (所有字段可选):
{
  "email": "string",                    // 新邮箱
  "password": "string",                 // 新密码, 至少6位
  "profile": {
    "firstName": "string",             // 名
    "lastName": "string"               // 姓
  }
}

响应 (200):
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "user|admin",
    "profile": {...}
  }
}
```

---

## 教师相关 `/api/teachers`

### 获取教师列表
```
GET /api/teachers
GET /api/teachers?page=1&limit=20&search=关键词

请求参数 (可选):
- page: 页码, 默认1
- limit: 每页数量, 默认20
- search: 搜索关键词(教师姓名)

响应 (200):
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "rating": "4.5",        // 平均分
      "ratingCount": 10       // 评分次数
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### 获取教师详情
```
GET /api/teachers/:id

路径参数:
- id: 教师ID

响应 (200):
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "rating": "4.5",
    "ratingCount": 10
  }
}
```

### 获取教师评价
```
GET /api/teachers/:id/ratings
GET /api/teachers/:id/ratings?page=1&limit=10

路径参数:
- id: 教师ID

响应 (200):
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "teacherId": "string",
      "userId": "string",
      "comment": "string",
      "isAnonymous": false,
      "rating": 5,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {...}
}
```

---

## 评分相关 `/api/ratings`

### 提交评价
```
POST /api/ratings
Authorization: Bearer <token>
Content-Type: application/json

请求体:
{
  "teacherId": "string",     // 必填, 教师ID
  "rating": 5,               // 必填, 1-5整数
  "comment": "string",       // 必填, 至少10字
  "isAnonymous": false       // 可选, 是否匿名
}

响应 (201):
{
  "success": true,
  "message": "Rating submitted successfully",
  "rating": {
    "teacherId": "string",
    "userId": "string",
    "comment": "string",
    "isAnonymous": false,
    "rating": 5,
    "_id": "string",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 获取我的评价
```
GET /api/ratings/my
Authorization: Bearer <token>

响应 (200):
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "teacherId": "string",
      "userId": "string",
      "comment": "string",
      "isAnonymous": false,
      "rating": 5,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 投稿相关 `/api/submissions`

### 提交投稿
```
POST /api/submissions
Authorization: Bearer <token>
Content-Type: application/json

请求体:
{
  "name": "string",          // 必填, 教师姓名
  "description": "string"    // 可选, 教师简介
}

响应 (201):
{
  "success": true,
  "message": "投稿成功，等待审核",
  "data": {
    "name": "string",
    "description": "string",
    "submittedBy": "string",
    "status": "pending",
    "_id": "string",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 获取我的投稿
```
GET /api/submissions/my
Authorization: Bearer <token>

响应 (200):
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "name": "string",
      "description": "string",
      "status": "pending|approved|rejected",
      "adminNote": "string",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 管理员相关 `/api/admin`

### 获取所有教师
```
GET /api/admin/teachers
Authorization: Bearer <token> (需admin权限)

响应 (200):
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "name": "string",
      "description": "string",
      "ratingCount": 10,
      "ratingSum": 45,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 添加教师
```
POST /api/admin/teachers
Authorization: Bearer <token> (需admin权限)
Content-Type: application/json

请求体:
{
  "name": "string",          // 必填
  "description": "string"    // 可选
}

响应 (201):
{
  "success": true,
  "message": "教师创建成功",
  "data": {...}
}
```

### 审核通过教师
```
POST /api/admin/teachers/:id/approve
Authorization: Bearer <token> (需admin权限)

响应 (200):
{
  "success": true,
  "message": "教师审核通过"
}
```

### 删除教师
```
DELETE /api/admin/teachers/:id
Authorization: Bearer <token> (需admin权限)

响应 (200):
{
  "success": true,
  "message": "教师已删除"
}
```

### 获取所有用户
```
GET /api/admin/users
Authorization: Bearer <token> (需admin权限)

响应 (200):
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "username": "string",
      "email": "string",
      "role": "user|admin",
      "isActive": true,
      "profile": {...}
    }
  ]
}
```

### 切换用户状态
```
POST /api/admin/users/:id/toggle
Authorization: Bearer <token> (需admin权限)

响应 (200):
{
  "success": true,
  "message": "用户已封禁|已解封"
}
```

### 获取所有评价
```
GET /api/admin/ratings
Authorization: Bearer <token> (需admin权限)

响应 (200):
{
  "success": true,
  "data": [...]
}
```

### 删除评价
```
DELETE /api/admin/ratings/:id
Authorization: Bearer <token> (需admin权限)

响应 (200):
{
  "success": true,
  "message": "评价已删除"
}
```

### 获取待审核投稿
```
GET /api/admin/submissions
Authorization: Bearer <token> (需admin权限)

响应 (200):
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "name": "string",
      "description": "string",
      "submittedBy": "string",
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 通过投稿
```
POST /api/admin/submissions/:id/approve
Authorization: Bearer <token> (需admin权限)
Content-Type: application/json

请求体 (可选):
{
  "adminNote": "string"     // 备注
}

响应 (200):
{
  "success": true,
  "message": "投稿已通过，教师已添加"
}
```

### 拒绝投稿
```
POST /api/admin/submissions/:id/reject
Authorization: Bearer <token> (需admin权限)
Content-Type: application/json

请求体 (可选):
{
  "adminNote": "string"     // 拒绝原因
}

响应 (200):
{
  "success": true,
  "message": "投稿已拒绝"
}
```

---

## 错误响应格式

所有错误响应遵循以下格式:

```json
{
  "success": false,
  "message": "错误信息描述"
}
```

常见状态码:
- 200: 成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未认证或认证失败
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器错误
