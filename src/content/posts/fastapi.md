---
title: "FastAPI 快速入门：现代 Python 后端框架"
published: 2026-09-11
description: "FastAPI 是一个现代、快速、高性能的 Python Web 框架，基于类型提示自动校验数据、自动生成文档。从 5 分钟上手到连接数据库、完整 CRUD 实战，含面试八股考点。"
tags: ["FastAPI", "Python", "后端"]
category: "Python"
image: "/blogs/Python/fastapi-cover-20261002.jpg"
author: "jojo"
draft: false
comment: true
lang: "zh-CN"
aiPolished: false
---
# FastAPI 快速入门：现代 Python 后端框架

> 目录
>
> 1. [FastAPI 是什么](#一fastapi-是什么)
> 2. [快速上手：5 分钟写一个接口](#二快速上手5-分钟写一个接口)
> 3. [路径参数和查询参数](#三路径参数和查询参数)
> 4. [请求体：接收 JSON 数据](#四请求体接收-json-数据)
> 5. [参数校验：Pydantic](#五参数校验pydantic)
> 6. [响应模型：统一返回格式](#六响应模型统一返回格式)
> 7. [异步支持：async / await](#七异步支持async--await)
> 8. [依赖注入：Depends](#八依赖注入depends)
> 9. [中间件](#九中间件)
> 10. [连接数据库](#十连接数据库)
> 11. [实战：完整 CRUD 项目](#十一实战完整-crud-项目)
> 12. [自动文档：Swagger](#十二自动文档swagger)
> 13. [部署](#十三部署)
> 14. [面试八股](#十四面试八股)
> 15. [总结](#十五总结)

---

## 一、FastAPI 是什么

一句话：**FastAPI 是一个现代、快速、高性能的 Python Web 框架，基于类型提示自动校验数据、自动生成文档。**

### 核心特点

| 特点 | 说明 |
|------|------|
| 快 | 性能接近 Node.js / Go，远超 Flask / Django |
| 类型安全 | 基于类型提示，数据校验自动完成 |
| 自动文档 | 写完代码就有 Swagger / ReDoc 文档页面 |
| 异步原生 | 原生支持 async/await |
| 开发快 | 代码量少，IDE 提示好（基于 Pydantic） |

### FastAPI vs Flask vs Django

| 对比项 | FastAPI | Flask | Django |
|--------|---------|-------|--------|
| 性能 | 高（接近 Go） | 中 | 中低 |
| 异步 | 原生支持 | 需要扩展 | 部分支持 |
| 类型提示 | 核心依赖 | 不强制 | 不强制 |
| 数据校验 | 自动（Pydantic） | 手写 | 手写/DRF |
| 自动文档 | 内置 | 需要 flask-restx | 需要 drf-spectacular |
| 上手难度 | 低 | 低 | 中（重） |
| 适合 | API 服务 | 小项目/学习 | 全功能网站 |

> 简单说：Flask 是轻量灵活，Django 是大而全，FastAPI 是快 + 类型安全 + 自动文档——专为写 API 设计的。

### 安装

```bash
pip install fastapi uvicorn[standard]
```

- `fastapi` —— 框架本体
- `uvicorn` —— ASGI 服务器，用来运行 FastAPI（类似 Flask 的 `app.run()`，但支持异步）

---

## 二、快速上手：5 分钟写一个接口

### 第一个接口

```python
# main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello FastAPI!"}

@app.get("/hello")
def hello():
    return {"message": "你好，世界"}
```

### 运行

```bash
uvicorn main:app --reload
```

- `main` —— 文件名（main.py）
- `app` —— 应用实例名
- `--reload` —— 代码修改后自动重启（开发时用，生产环境去掉）

打开浏览器访问 `http://127.0.0.1:8000/`，看到 JSON 返回就成功了。

### 自动文档（杀手锏）

运行后，打开这两个地址：

- `http://127.0.0.1:8000/docs` —— Swagger UI 交互式文档
- `http://127.0.0.1:8000/redoc` —— ReDoc 文档

**你没听错，代码写完，文档自动就有了。** 可以直接在页面上测试接口，不用 Postman。这是 FastAPI 最吸引人的地方。

### 和 Flask 对比

```python
# Flask
from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/hello")
def hello():
    return jsonify({"message": "Hello"})

# Flask: app.run(debug=True)
```

```python
# FastAPI
from fastapi import FastAPI

app = FastAPI()

@app.get("/hello")
def hello():
    return {"message": "Hello"}

# FastAPI: uvicorn main:app --reload
```

区别：
- Flask 用 `@app.route("/hello")`，FastAPI 用 `@app.get("/hello")`（方法直接写在装饰器里）
- Flask 要 `jsonify()` 包一层，FastAPI 直接 return 字典就自动转 JSON
- FastAPI 自带类型提示和数据校验，Flask 要手写

---

## 三、路径参数和查询参数

### 路径参数

```python
@app.get("/users/{user_id}")
def get_user(user_id: int):
    return {"user_id": user_id, "type": type(user_id).__name__}
```

访问 `/users/123` → `{"user_id": 123, "type": "int"}`

**注意 `user_id: int`**：类型提示让 FastAPI 自动把路径参数转成 int，传了不是数字的值会自动报错。

```python
# 访问 /users/abc → 自动返回 422 错误：
# {"detail": [{"type": "int_parsing", "msg": "Input should be a valid integer..."}]}
```

你不用手写类型转换和校验，写个 `: int` 就全搞定了。

### 查询参数

```python
@app.get("/users")
def list_users(page: int = 1, size: int = 10, keyword: str = ""):
    return {
        "page": page,
        "size": size,
        "keyword": keyword,
    }
```

访问 `/users?page=2&size=20&keyword=张三`

- `page` —— 默认 1，传了就用传的
- `size` —— 默认 10
- `keyword` —— 默认空字符串

**有默认值的参数就是查询参数，没默认值的就是必传参数。**

```python
# status 必传，keyword 可选
@app.get("/users")
def list_users(status: str, keyword: str = ""):
    return {"status": status, "keyword": keyword}

# 访问 /users?status=active → ✅
# 访问 /users → ❌ 422 错误，status 缺失
```

### 参数类型

```python
from enum import Enum

class Status(str, Enum):
    active = "active"
    inactive = "inactive"
    banned = "banned"

@app.get("/users/{status}")
def filter_users(status: Status):
    return {"status": status, "message": f"筛选 {status.value} 状态的用户"}

# 枚举类型：只能传 active / inactive / banned，传别的自动报错
# 访问 /users/active → ✅
# 访问 /users/xyz → ❌ 422 错误
```

---

## 四、请求体：接收 JSON 数据

GET 请求一般用来查询，POST/PUT/PATCH 用请求体接收数据。FastAPI 用 Pydantic 模型来定义请求体。

### 定义模型

```python
from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    age: int
    email: str
    role: str = "user"  # 有默认值，可选

# 写一个 POST 接口
@app.post("/users")
def create_user(user: UserCreate):
    return {
        "message": "创建成功",
        "user": user
    }
```

客户端发送 POST 请求，body 是 JSON：

```json
{
    "name": "张三",
    "age": 20,
    "email": "zhang@xx.com"
}
```

FastAPI 自动做了三件事：
1. **解析 JSON** —— 把 body 的 JSON 解析成 Python 字典
2. **类型转换** —— name 是 str，age 是 int，自动转换
3. **数据校验** —— name 必须是字符串，age 必须是整数，不对就报 422 错误

### 测试

```bash
# 正确请求
curl -X POST http://127.0.0.1:8000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "张三", "age": 20, "email": "zhang@xx.com"}'

# ❌ 缺少 name
curl -X POST http://127.0.0.1:8000/users \
  -H "Content-Type: application/json" \
  -d '{"age": 20, "email": "zhang@xx.com"}'
# 返回 422 错误，提示 name 字段缺失

# ❌ age 传了字符串
curl -X POST http://127.0.0.1:8000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "张三", "age": "abc", "email": "zhang@xx.com"}'
# 返回 422 错误，提示 age 应该是整数
```

**你一行校验代码都没写，全靠类型提示自动完成。** 这是 FastAPI 最大的优势——不用手写校验逻辑。

### 请求体 + 路径参数 + 查询参数混用

```python
@app.put("/users/{user_id}")
def update_user(user_id: int, user: UserCreate, force: bool = False):
    return {
        "user_id": user_id,
        "user": user,
        "force": force,
    }
```

FastAPI 自动区分：
- `user_id` 在路径里 → 路径参数
- `user` 是 Pydantic 模型 → 请求体
- `force` 是基本类型有默认值 → 查询参数

你不用配置，FastAPI 根据参数类型自动判断。

---

## 五、参数校验：Pydantic

Pydantic 是 FastAPI 的核心——用类型提示定义数据结构，自动校验。

### 基本校验

```python
from pydantic import BaseModel, Field, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="用户名")
    age: int = Field(..., ge=0, le=120, description="年龄")
    email: EmailStr           # 自动校验邮箱格式
    password: str = Field(..., min_length=6, description="密码")
    role: str = "user"
    phone: Optional[str] = None  # 可选字段，默认 None
```

| Field 参数 | 作用 |
|-----------|------|
| `...` | 必传 |
| `min_length` / `max_length` | 字符串长度限制 |
| `ge` (>=) | 大于等于 |
| `gt` (>) | 大于 |
| `le` (<=) | 小于等于 |
| `lt` (<) | 小于 |
| `description` | 描述（显示在文档里） |

```python
# age: ge=0, le=120 → 年龄必须在 0~120 之间
# name: min_length=2 → 名字至少 2 个字符
# email: EmailStr → 自动校验邮箱格式
```

### 嵌套模型

```python
class Address(BaseModel):
    city: str
    street: str
    zip_code: str

class UserCreate(BaseModel):
    name: str
    age: int
    address: Address       # 嵌套模型

# 请求体：
# {
#     "name": "张三",
#     "age": 20,
#     "address": {
#         "city": "北京",
#         "street": "某某路",
#         "zip_code": "100000"
#     }
# }
```

### 列表字段

```python
from typing import List

class ArticleCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = []      # 字符串列表，默认空

# 请求体：
# {
#     "title": "文章标题",
#     "content": "内容",
#     "tags": ["Python", "FastAPI", "后端"]
# }
```

### 自定义校验

```python
from pydantic import field_validator

class UserCreate(BaseModel):
    name: str
    age: int
    password: str

    @field_validator("name")
    @classmethod
    def name_must_not_contain_space(cls, v):
        if " " in v:
            raise ValueError("用户名不能包含空格")
        return v

    @field_validator("password")
    @classmethod
    def password_must_have_number(cls, v):
        if not any(c.isdigit() for c in v):
            raise ValueError("密码必须包含数字")
        return v
```

### Pydantic v2 提示

当前版本是 Pydantic v2，和 v1 有些区别：
- `@validator` → `@field_validator`
- `class Config:` → `model_config`
- `.dict()` → `.model_dump()`
- `.json()` → `.model_dump_json()`

FastAPI 0.100+ 默认用 Pydantic v2。

---

## 六、响应模型：统一返回格式

### 响应模型

用 `response_model` 指定返回的数据结构，FastAPI 自动过滤多余字段。

```python
class UserResponse(BaseModel):
    id: int
    name: str
    age: int
    email: str
    # 注意：没有 password 字段

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
    # 模拟从数据库查出来的数据（包含 password）
    db_user = {
        "id": user_id,
        "name": "张三",
        "age": 20,
        "email": "zhang@xx.com",
        "password": "123456",
        "is_deleted": False,
    }
    return db_user
```

返回结果：
```json
{
    "id": 1,
    "name": "张三",
    "age": 20,
    "email": "zhang@xx.com"
}
```

**password 和 is_deleted 被自动过滤掉了。** 你不用手动 select 字段，response_model 帮你搞定。

### 统一响应格式

实际项目通常统一返回格式：`{ code, message, data }`。

```python
from typing import Generic, TypeVar, Optional

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    code: int = 0
    message: str = "success"
    data: Optional[T] = None

class UserOut(BaseModel):
    id: int
    name: str
    age: int

# 使用泛型响应
@app.get("/users/{user_id}", response_model=ApiResponse[UserOut])
def get_user(user_id: int):
    user = {"id": user_id, "name": "张三", "age": 20}
    return ApiResponse(code=0, message="success", data=user)

# 返回：
# {
#     "code": 0,
#     "message": "success",
#     "data": {"id": 1, "name": "张三", "age": 20}
# }
```

### 分页响应

```python
class PageResponse(BaseModel, Generic[T]):
    code: int = 0
    message: str = "success"
    data: Optional[List[T]] = None
    total: int = 0
    page: int = 1
    size: int = 10

@app.get("/users", response_model=PageResponse[UserOut])
def list_users(page: int = 1, size: int = 10):
    users = [
        {"id": 1, "name": "张三", "age": 20},
        {"id": 2, "name": "李四", "age": 25},
    ]
    return PageResponse(data=users, total=100, page=page, size=size)
```

---

## 七、异步支持：async / await

FastAPI 原生支持异步，这是它比 Flask 快的核心原因。

### 同步 vs 异步

```python
# 同步（普通函数）
@app.get("/sync")
def get_data():
    time.sleep(3)  # 阻塞 3 秒
    return {"message": "同步"}

# 异步（async 函数 + await）
@app.get("/async")
async def get_data():
    await asyncio.sleep(3)  # 不阻塞，3 秒后继续
    return {"message": "异步"}
```

### 异步数据库操作

```python
import databases
import sqlalchemy

database = databases.Database("sqlite+aiosqlite:///./test.db")

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    query = "SELECT * FROM users WHERE id = :user_id"
    return await database.fetch_one(query, values={"user_id": user_id})
```

### 异步 HTTP 请求

```python
import httpx

@app.get("/proxy")
async def proxy():
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://api.example.com/data")
        return resp.json()
```

### 并发请求

```python
import httpx
import asyncio

@app.get("/batch")
async def batch():
    async with httpx.AsyncClient() as client:
        # 并发请求 3 个接口，等最慢的那个就行
        results = await asyncio.gather(
            client.get("https://api.example.com/1"),
            client.get("https://api.example.com/2"),
            client.get("https://api.example.com/3"),
        )
        return [r.json() for r in results]
```

### 什么时候用 async

| 场景 | 用 async？ |
|------|-----------|
| I/O 密集（数据库、HTTP 请求、文件） | ✅ 用 |
| CPU 密集（计算、加密、压缩） | ❌ 不如用同步（GIL 限制） |
| 混合场景 | 分开，I/O 用 async，CPU 放后台任务 |

> 简单原则：只要函数里有 `await`（数据库、HTTP 请求、文件操作），就用 `async def`。没有 `await` 就用普通 `def`，FastAPI 会自动放到线程池里执行。

---

## 八、依赖注入：Depends

依赖注入是 FastAPI 的核心特性之一——把公共逻辑抽成依赖，复用。

### 基本用法

```python
from fastapi import Depends

# 定义依赖
def get_db():
    db = "数据库连接"
    return db

# 使用依赖
@app.get("/users")
def list_users(db = Depends(get_db)):
    # db 自动注入，不用手动调 get_db()
    return {"db": db, "users": []}
```

`Depends(get_db)` 做了什么：
1. 调用 `get_db()`
2. 拿到返回值
3. 把返回值赋给 `db` 参数

### 分页依赖

```python
# 把分页逻辑抽成依赖，所有列表接口都能用
class PageParams:
    def __init__(self, page: int = 1, size: int = 10):
        self.page = page
        self.size = size

@app.get("/users")
def list_users(params: PageParams = Depends()):
    return {"page": params.page, "size": params.size}

@app.get("/products")
def list_products(params: PageParams = Depends()):
    return {"page": params.page, "size": params.size}
```

两个接口共用一套分页参数，不用重复写。

### 依赖嵌套

```python
def get_db():
    return "数据库连接"

def get_current_user(db = Depends(get_db)):
    return {"name": "张三", "role": "admin"}

@app.get("/me")
def get_me(user = Depends(get_current_user)):
    return user
```

依赖可以嵌套——`get_current_user` 依赖 `get_db`，FastAPI 自动处理依赖链。

### 权限校验

```python
from fastapi import Depends, HTTPException, status

def verify_token(token: str = Header(...)):
    if token != "secret-token":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token 无效",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token

# 需要认证的接口
@app.get("/admin")
def admin_data(token: str = Depends(verify_token)):
    return {"message": "欢迎管理员"}

# 不需要认证的接口
@app.get("/public")
def public_data():
    return {"message": "公开数据"}
```

加一个 `Depends(verify_token)` 就实现了鉴权，不用在每个接口里写校验逻辑。

### 全局依赖

```python
# 给整个应用加依赖（所有路由都要经过这个依赖）
app = FastAPI(dependencies=[Depends(verify_token)])

# 或者给某个路由组加
api_router = APIRouter(dependencies=[Depends(verify_token)])
```

---

## 九、中间件

中间件在每个请求前后执行，类似 Express 的 `app.use()`。

### CORS 跨域

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # 允许的前端地址
    allow_credentials=True,
    allow_methods=["*"],     # 允许所有方法
    allow_headers=["*"],     # 允许所有头
)
```

### 自定义中间件

```python
import time

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    # 请求前
    start = time.time()

    # 执行请求
    response = await call_next(request)

    # 请求后
    duration = time.time() - start
    response.headers["X-Process-Time"] = f"{duration:.3f}s"

    return response
```

每个响应都带上处理耗时，前端可以看到接口花了多久。

### 日志中间件

```python
import logging

logger = logging.getLogger("api")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"请求: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"响应: {response.status_code}")
    return response
```

---

## 十、连接数据库

### 方式一：SQLAlchemy（同步，ORM）

```python
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

# 连接
engine = create_engine("sqlite:///./test.db")
Session = sessionmaker(bind=engine)
Base = declarative_base()

# 模型
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(50))
    age = Column(Integer)

# 建表
Base.metadata.create_all(engine)

# 依赖：获取数据库 session
def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()

# 使用
@app.get("/users")
def list_users(db = Depends(get_db)):
    users = db.query(User).all()
    return users

@app.post("/users")
def create_user(user: UserCreate, db = Depends(get_db)):
    db_user = User(name=user.name, age=user.age)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
```

### 方式二：SQLAlchemy（异步）

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

engine = create_async_engine("sqlite+aiosqlite:///./test.db")

async def get_db():
    async with AsyncSession(engine) as db:
        yield db

@app.get("/users")
async def list_users(db = Depends(get_db)):
    result = await db.execute(select(User))
    return result.scalars().all()
```

### 方式三：MongoDB（Motor 异步驱动）

```python
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.mydb

@app.get("/users")
async def list_users():
    users = await db.users.find().to_list(100)
    return users

@app.post("/users")
async def create_user(user: UserCreate):
    result = await db.users.insert_one(user.model_dump())
    return {"id": str(result.inserted_id)}
```

### 数据库迁移（Alembic）

```bash
pip install alembic
alembic init alembic          # 初始化
# 修改 alembic.ini 和 env.py 配置数据库连接
alembic revision --autogenerate -m "create users table"  # 生成迁移
alembic upgrade head          # 执行迁移
```

类似 Node.js 的 Prisma migrate 或 Sequelize 的 migration——自动根据模型变化生成 SQL 迁移脚本。

---

## 十一、实战：完整 CRUD 项目

把前面学的串起来，写一套完整的用户 CRUD 接口。

### 项目结构

```
myapp/
├── main.py              ← 启动入口
├── database.py          ← 数据库配置
├── models.py            ← 数据库模型
├── schemas.py           ← Pydantic 模型（请求/响应）
├── dependencies.py      ← 公共依赖
└── routers/
    └── users.py         ← 用户路由
```

### database.py

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### models.py

```python
from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    age = Column(Integer, default=18)
    email = Column(String(100), unique=True, nullable=False)
```

### schemas.py

```python
from pydantic import BaseModel, Field, EmailStr
from typing import Optional

# 请求模型
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    age: int = Field(..., ge=0, le=120)
    email: EmailStr

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    age: Optional[int] = Field(None, ge=0, le=120)
    email: Optional[EmailStr] = None

# 响应模型
class UserOut(BaseModel):
    id: int
    name: str
    age: int
    email: str

    model_config = {"from_attributes": True}  # 从 ORM 对象读取属性
```

### routers/users.py

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User
from schemas import UserCreate, UserUpdate, UserOut

router = APIRouter(prefix="/api/users", tags=["用户管理"])

@router.get("/", response_model=List[UserOut])
def list_users(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(User).offset(skip).limit(limit).all()

@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user

@router.post("/", response_model=UserOut, status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # 检查邮箱是否已存在
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="邮箱已注册")
    db_user = User(name=user.name, age=user.age, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="用户不存在")

    update_data = user.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    db.delete(user)
    db.commit()
    return {"message": "删除成功"}
```

### main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import users

# 建表（开发用，生产用 Alembic）
Base.metadata.create_all(bind=engine)

app = FastAPI(title="用户管理 API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(users.router)

@app.get("/")
def root():
    return {"message": "用户管理 API 运行中"}
```

### 运行

```bash
uvicorn main:app --reload
```

打开 `http://127.0.0.1:8000/docs` 就能看到所有接口，可以直接在页面上测试。

---

## 十二、自动文档：Swagger

FastAPI 自动生成交互式 API 文档，这是它最大的卖点之一。

### 两个文档地址

- `/docs` —— Swagger UI，可以在线测试接口
- `/redoc` —— ReDoc，文档更美观，适合给前端看

### 自定义文档信息

```python
app = FastAPI(
    title="用户管理 API",
    description="一个完整的用户 CRUD 接口",
    version="1.0.0",
    docs_url="/docs",      # 自定义文档路径，设为 None 关闭
    redoc_url="/redoc",
)

# 给接口加描述
@app.get("/users", tags=["用户管理"], summary="获取用户列表", description="分页获取所有用户")
def list_users():
    ...
```

### 给文档加示例

```python
class UserCreate(BaseModel):
    name: str = Field(..., example="张三")
    age: int = Field(..., example=20)
    email: str = Field(..., example="zhang@xx.com")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"name": "张三", "age": 20, "email": "zhang@xx.com"}
            ]
        }
    }
```

### 分组管理

```python
# 用 tags 分组
@app.get("/users", tags=["用户"])
def list_users(): ...

@app.get("/products", tags=["商品"])
def list_products(): ...

# 或者用 APIRouter
user_router = APIRouter(prefix="/users", tags=["用户"])
product_router = APIRouter(prefix="/products", tags=["商品"])
```

---

## 十三、部署

### 开发环境

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 生产环境

生产环境用 Gunicorn + Uvicorn Worker（多进程）：

```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

- `-w 4` —— 4 个 worker 进程
- `-k uvicorn.workers.UvicornWorker` —— 用 uvicorn 的 worker

### Docker 部署

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000"]
```

```bash
docker build -t myapi .
docker run -p 8000:8000 myapi
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 十四、面试八股

### 1. FastAPI 和 Flask 有什么区别？

**参考答案：**

| 对比项 | FastAPI | Flask |
|--------|---------|-------|
| 性能 | 高（异步原生） | 中（同步为主） |
| 类型提示 | 核心依赖 | 不强制 |
| 数据校验 | Pydantic 自动 | 手写或扩展 |
| 自动文档 | 内置 Swagger/ReDoc | 需要扩展 |
| 异步 | 原生 async/await | 需要 async 扩展 |
| 设计理念 | API 优先 | 通用 Web |
| ASGI | 原生 ASGI | WSGI（需异步扩展） |

**选择**：纯 API 服务选 FastAPI，模板渲染选 Flask，全功能网站选 Django。

---

### 2. FastAPI 为什么快？

**参考答案：**

1. **ASGI 异步** —— 基于 Starlette（ASGI 框架），原生支持异步，I/O 不阻塞
2. **Pydantic v2** —— 数据校验用 Rust 编写的 Pydantic v2，速度极快
3. **类型提示编译** —— FastAPI 在启动时根据类型提示编译路由处理逻辑，不是运行时解析
4. **Starlette 底层** —— Starlette 本身就是高性能 ASGI 框架

> 类似 Node.js 之所以快——单线程异步 I/O，适合 I/O 密集型场景。FastAPI 同理，但用的是 Python 的 async/await。

---

### 3. Pydantic 是什么？在 FastAPI 里起什么作用？

**参考答案：**

Pydantic 是 Python 的数据校验库，用类型提示定义数据结构，自动校验。

在 FastAPI 里的作用：
1. **请求体校验** —— 定义 Pydantic 模型，FastAPI 自动解析 JSON、校验类型、报错
2. **响应模型** —— `response_model` 自动过滤字段，保证不泄露敏感数据
3. **参数校验** —— Field、validator 等约束自动生效
4. **文档生成** —— Pydantic 模型自动转成 OpenAPI Schema，驱动 Swagger 文档

> 没有 Pydantic，FastAPI 就没法自动校验和生成文档。Pydantic 是 FastAPI 的基石。

---

### 4. Depends（依赖注入）是什么？有什么用？

**参考答案：**

`Depends` 是 FastAPI 的依赖注入机制——把公共逻辑抽成依赖函数，自动注入到路由里。

**用途**：
1. **数据库连接** —— `Depends(get_db)` 自动获取和关闭数据库连接
2. **权限校验** —— `Depends(verify_token)` 自动检查 Token
3. **分页参数** —— 抽成依赖，所有列表接口共用
4. **依赖嵌套** —— 依赖可以依赖另一个依赖，自动处理链

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/users")
def list_users(db = Depends(get_db)):
    return db.query(User).all()
```

好处：代码复用、测试方便（mock 依赖）、关注点分离。

---

### 5. FastAPI 的异步和同步有什么区别？

**参考答案：**

- `async def` —— 异步路由，用 `await` 调用异步操作，不阻塞线程
- `def` —— 同步路由，FastAPI 自动放到线程池执行，不阻塞事件循环

```python
# 异步：适合 I/O 密集
@app.get("/")
async def get_data():
    data = await fetch_from_db()
    return data

# 同步：适合 CPU 密集或用同步库
@app.get("/")
def get_data():
    data = sync_db_query()
    return data
```

**规则**：
- 用异步库（asyncpg、motor、httpx async）→ `async def`
- 用同步库（SQLAlchemy 同步、pymongo）→ `def`（FastAPI 自动放线程池）
- 不要 `async def` 里调用同步阻塞操作（会卡住事件循环）

---

### 6. FastAPI 怎么处理异常？

**参考答案：**

两种方式：

**方式一：直接抛 HTTPException**

```python
from fastapi import HTTPException

@app.get("/users/{user_id}")
def get_user(user_id: int):
    user = find_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user
```

**方式二：自定义异常处理器**

```python
class BusinessException(Exception):
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message

@app.exception_handler(BusinessException)
async def business_exception_handler(request, exc):
    return JSONResponse(
        status_code=200,
        content={"code": exc.code, "message": exc.message, "data": None}
    )

# 使用
@app.get("/users/{user_id}")
def get_user(user_id: int):
    user = find_user(user_id)
    if not user:
        raise BusinessException(404, "用户不存在")
    return user
```

---

### 7. APIRouter 是什么？有什么用？

**参考答案：**

`APIRouter` 是 FastAPI 的路由分组工具，把相关接口组织在一起，方便模块化管理。

```python
# routers/users.py
router = APIRouter(prefix="/api/users", tags=["用户管理"])

@router.get("/")
def list_users(): ...

@router.post("/")
def create_user(): ...

# main.py
from routers import users
app.include_router(users.router)
```

好处：
1. **模块化** —— 每个业务模块一个文件
2. **前缀统一** —— `prefix="/api/users"` 自动加到所有路由
3. **文档分组** —— `tags` 在文档里自动分组
4. **依赖统一** —— 给整个 router 加依赖（如鉴权）

---

### 8. response_model 的作用是什么？

**参考答案：**

`response_model` 指定接口返回的数据结构，FastAPI 自动做两件事：

1. **过滤字段** —— 只返回模型里定义的字段，多余的不返回
2. **校验输出** —— 确保返回数据符合模型定义

```python
class UserOut(BaseModel):
    id: int
    name: str
    # 没有 password

@app.get("/users/{id}", response_model=UserOut)
def get_user(id: int):
    user = get_from_db(id)  # 包含 password
    return user  # response_model 自动过滤掉 password
```

好处：防止敏感数据泄露、统一响应格式、自动更新文档。

---

### 9. FastAPI 的中间件和 Depends 有什么区别？

**参考答案：**

| 对比项 | 中间件 | Depends |
|--------|--------|---------|
| 作用范围 | 所有请求 | 特定路由 |
| 执行时机 | 请求前 + 响应后 | 请求处理前 |
| 能修改响应 | ✅ 可以 | ❌ 不行 |
| 能短路请求 | ✅ 可以返回自定义响应 | ✅ 可以抛异常 |
| 典型用途 | CORS、日志、耗时统计 | 数据库连接、权限校验 |

简单说：中间件是「全局拦截器」，Depends 是「路由级依赖」。

---

### 10. FastAPI 怎么实现定时任务？

**参考答案：**

FastAPI 本身不带定时任务，用第三方库：

```python
# 用 APScheduler
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job("cron", hour=2, minute=30)
async def daily_report():
    # 每天凌晨 2:30 执行
    await generate_report()

@app.on_event("startup")
async def start_scheduler():
    scheduler.start()

@app.on_event("shutdown")
async def stop_scheduler():
    scheduler.shutdown()
```

或者用 Celery 做更复杂的分布式任务队列。

---

### 11. FastAPI 怎么处理 CORS？

**参考答案：**

用 `CORSMiddleware` 中间件：

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 允许的前端地址
    allow_credentials=True,                    # 允许带 Cookie
    allow_methods=["*"],                       # 允许的 HTTP 方法
    allow_headers=["*"],                       # 允许的请求头
)
```

**原理**：浏览器在跨域请求前会发 OPTIONS 预检请求，CORSMiddleware 自动响应，告诉浏览器允许跨域。

> 和 Express 的 `cors` 中间件一模一样的思路，只是配置方式不同。

---

### 12. FastAPI 和 Django REST Framework 怎么选？

**参考答案：**

| 对比项 | FastAPI | Django REST Framework |
|--------|---------|----------------------|
| 框架基础 | 轻量（只做 API） | 重（Django 全栈） |
| 性能 | 高 | 中 |
| 异步 | 原生 | Django 4+ 部分支持 |
| 类型提示 | 核心 | 不强制 |
| 自动文档 | 内置 | 需要 drf-spectacular |
| 数据库 | 自选（SQLAlchemy/Tortoise 等） | Django ORM |
| 适合 | 纯 API 微服务 | 全功能网站 + API |
| 生态 | 成长中 | 成熟（Django 生态） |

**选择**：
- 纯 API 服务、微服务、高性能需求 → FastAPI
- 需要后台管理、模板渲染、完整 Web 功能 → Django + DRF

---

## 十五、总结

FastAPI 是目前 Python 后端开发的首选框架——快、类型安全、自动文档、异步原生。学会它，你写 API 的效率会大幅提升。

**核心知识点速记：**

| 知识点 | 一句话 |
|--------|--------|
| 路由 | `@app.get("/path")` / `@app.post()` |
| 路径参数 | `def fn(user_id: int)` |
| 查询参数 | `def fn(page: int = 1)` |
| 请求体 | Pydantic 模型 `def fn(user: UserCreate)` |
| 校验 | `Field(..., min_length=2, ge=0)` |
| 响应模型 | `response_model=UserOut` 自动过滤字段 |
| 异步 | `async def` + `await` |
| 依赖注入 | `Depends(get_db)` 自动注入 |
| 中间件 | `@app.middleware("http")` |
| 文档 | `/docs`（Swagger）+ `/redoc` |
| 路由分组 | `APIRouter(prefix=..., tags=[...])` |
| 部署 | `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker` |

**学习建议**：按照第十一章的完整项目结构，自己敲一遍 CRUD。写完你就掌握了 FastAPI 的核心——路由、校验、数据库、依赖注入全用到了。之后再看中间件、异步、部署就很简单了。
