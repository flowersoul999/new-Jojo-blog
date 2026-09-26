---
title: "Vant移动端：小程序H5一把梭，移动端开发起飞"
published: 2026-09-07
description: ""
tags: ["前端基础"]
category: "技术总结"
draft: false
lang: "zh-CN"
---

> 💡 **写在前面**：PC端有Element Plus，移动端呢？那必须是Vant——有赞团队出品的Vue移动端组件库，国内最流行的移动端UI库，没有之一。做H5、做小程序、做混合App，Vant都是首选。这篇带你从零搞懂Vant，一篇上手移动端开发。全文约6000字，建议收藏，做移动端项目的时候随时翻！

---

## 📑 目录导航

- [一、Vant是什么？移动端开发必备](#一vant是什么移动端开发必备)
  - [1.1 一句话理解Vant](#11-一句话理解vant)
  - [1.2 为什么选Vant？](#12-为什么选vant)
  - [1.3 移动端组件库对比](#13-移动端组件库对比)
- [二、快速上手：安装和配置](#二快速上手安装和配置)
  - [2.1 安装](#21-安装)
  - [2.2 按需引入（推荐）](#22-按需引入推荐)
  - [2.3 移动端适配](#23-移动端适配)
- [三、基础组件速览](#三基础组件速览)
  - [3.1 Button按钮](#31-button按钮)
  - [3.2 Cell单元格](#32-cell单元格)
  - [3.3 输入框与表单](#33-输入框与表单)
  - [3.4 弹层类：Toast、Dialog、Popup](#34-弹层类toastdialogpopup)
- [四、列表与滚动：移动端灵魂](#四列表与滚动移动端灵魂)
  - [4.1 List列表](#41-list列表)
  - [4.2 PullRefresh下拉刷新](#42-pullrefresh下拉刷新)
  - [4.3 List滚动加载](#43-list滚动加载)
  - [4.4 Sticky粘性布局](#44-sticky粘性布局)
- [五、导航与标签](#五导航与标签)
  - [5.1 Tabbar标签栏](#51-tabbar标签栏)
  - [5.2 Tabs标签页](#52-tabs标签页)
  - [5.3 NavBar导航栏](#53-navbar导航栏)
- [六、实战项目：移动端商城首页](#六实战项目移动端商城首页)
  - [6.1 需求分析](#61-需求分析)
  - [6.2 完整代码](#62-完整代码)
- [七、新手必避的10个坑 ⚠️](#七新手必避的10个坑-️)
- [八、总结与后续学习建议](#八总结与后续学习建议)

---

## 一、Vant是什么？移动端开发必备

### 1.1 一句话理解Vant

**Vant就是移动端的"Element Plus"——一套现成的Vue移动端组件库，按钮、列表、弹窗、轮播……啥都有，做H5和小程序超好用。**

Vant是有赞团队开源的移动端组件库，从Vue2时代的Vant一直迭代到Vue3版本的Vant 4。因为有赞本身就是做电商的，所以Vant的电商属性特别强——商品卡片、购物车、地址选择、优惠券……电商场景的组件应有尽有。

打个比方：
- 做PC后台 → 用Element Plus
- 做移动端/H5 → 用Vant
- 做微信小程序 → 也能用Vant（支持uni-app）

### 1.2 为什么选Vant？

| 优势 | 说明 |
|------|------|
| 🎨 **颜值高** | 设计风格清爽现代，符合移动端审美 |
| 📦 **组件全** | 60+组件，覆盖移动端各种场景 |
| 🛒 **电商强** | 电商场景的组件特别丰富（有赞自家出品） |
| 📱 **多端支持** | Vue2/Vue3/React/小程序都有对应版本 |
| 📖 **文档好** | 中文文档，每个组件都有示例和API说明 |
| 🔥 **生态好** | 国内最流行，资料多，问题好搜 |

一句话：**做Vue移动端，Vant基本是首选。**

### 1.3 移动端组件库对比

| 组件库 | 出品方 | 特点 | 推荐指数 |
|--------|--------|------|---------|
| **Vant** | 有赞 | 组件全、电商强、生态好 | ⭐⭐⭐⭐⭐ |
| **NutUI** | 京东 | 京东风格，支持Vue/React | ⭐⭐⭐⭐ |
| **Varlet** | 社区 | Material Design风格 | ⭐⭐⭐ |
| **Mint UI** | 饿了么 | 老了，不怎么更新了 | ⭐⭐ |
| **Cube UI** | 滴滴 | 滴滴风格，偏重型 | ⭐⭐⭐ |

👉 **怎么选**：
- 电商类、普通H5 → 直接选Vant，准没错
- 公司有自己的设计规范 → 可以基于Vant二次定制
- 喜欢Material风格 → 选Varlet

---

## 二、快速上手：安装和配置

### 2.1 安装

```bash
npm i vant
```

### 2.2 按需引入（推荐）

跟Element Plus一样，用 `unplugin-vue-components` 自动导入，不用手动import：

```bash
npm i unplugin-vue-components -D
```

配置 `vite.config.js`：

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [VantResolver()]  // Vant自动导入
    })
  ]
})
```

然后就可以直接在模板里用了，不用import：

```vue
<template>
  <van-button type="primary">按钮</van-button>
  <van-cell title="单元格" value="内容" />
</template>
```

就是这么简单！组件和样式都会自动按需引入。

### 2.3 移动端适配

移动端开发第一个要解决的就是适配问题——不同屏幕尺寸怎么自适应。Vant默认用 `px` 单位，推荐用 `postcss-px-to-viewport` 插件把px转换成vw/vh。

#### 安装

```bash
npm i postcss-px-to-viewport -D
```

#### 配置

在 `postcss.config.js` 里配置：

```javascript
export default {
  plugins: {
    'postcss-px-to-viewport': {
      viewportWidth: 375,   // 设计稿宽度（一般是375或750）
      unitPrecision: 5,     // 小数点位数
      viewportUnit: 'vw',   // 转换成vw
      selectorBlackList: [], // 不需要转换的类
      minPixelValue: 1,     // 最小像素值，小于1px不转换
      mediaQuery: false,    // 媒体查询里的px也转换
    },
  },
}
```

配置完之后，你写的px单位会自动转换成vw单位，在不同尺寸的手机上自动等比缩放。

💡 **设计稿宽度**：如果设计稿是750px宽（2倍图），viewportWidth就设为750；如果是375px，就设为375。跟设计师对齐就行。

---

## 三、基础组件速览

Vant有60+组件，挑最常用的说一下。

### 3.1 Button按钮

```vue
<van-button type="primary">主要按钮</van-button>
<van-button type="success">成功按钮</van-button>
<van-button type="warning">警告按钮</van-button>
<van-button type="danger">危险按钮</van-button>
<van-button type="default">默认按钮</van-button>

<van-button size="large">大号按钮</van-button>
<van-button size="normal">普通</van-button>
<van-button size="small">小号</van-button>
<van-button size="mini">迷你</van-button>

<van-button plain>朴素按钮</van-button>
<van-button round>圆角按钮</van-button>
<van-button square>方形按钮</van-button>
<van-button block>块级按钮（占满一行）</van-button>
<van-button disabled>禁用状态</van-button>
<van-button loading>加载中</van-button>
<van-button icon="plus">图标按钮</van-button>
```

移动端按钮最常用的就是 `block`（占满宽度）和 `round`（大圆角），这是移动端的标准设计。

### 3.2 Cell单元格

Cell是移动端最最最常用的组件——设置页、个人中心、列表页，到处都是Cell。

```vue
<van-cell-group inset>
  <van-cell title="单元格" value="内容" />
  <van-cell title="单元格" value="内容" label="描述信息" />
  <van-cell title="单元格" is-link />
  <van-cell title="单元格" is-link value="右侧内容" />
  <van-cell title="单元格" is-link arrow-direction="down">
    <template #icon>
      <van-icon name="location-o" />
    </template>
  </van-cell>
</van-cell-group>
```

几个常用属性：
- `title`：左侧标题
- `value`：右侧内容
- `label`：标题下方的描述
- `is-link`：显示右侧箭头（可点击的）
- `icon`：左侧图标
- `inset`：圆角卡片风格（加在cell-group上）

个人中心页、设置页，全是Cell堆出来的，CV工程师的最爱。

### 3.3 输入框与表单

#### Field输入框

```vue
<van-cell-group inset>
  <van-field v-model="username" label="用户名" placeholder="请输入用户名" />
  <van-field v-model="password" type="password" label="密码" placeholder="请输入密码" />
  <van-field v-model="phone" label="手机号" placeholder="请输入手机号">
    <template #button>
      <van-button size="small" type="primary">获取验证码</van-button>
    </template>
  </van-field>
</van-cell-group>
```

Field的属性特别多，支持输入框、文本域、选择器、上传等各种形态。

#### Form表单校验

跟Element Plus类似，Vant也有Form组件做表单校验：

```vue
<van-form @submit="onSubmit">
  <van-cell-group inset>
    <van-field
      v-model="form.username"
      name="username"
      label="用户名"
      placeholder="请输入用户名"
      :rules="[{ required: true, message: '请填写用户名' }]"
    />
    <van-field
      v-model="form.password"
      type="password"
      name="password"
      label="密码"
      placeholder="请输入密码"
      :rules="[{ required: true, message: '请填写密码' }]"
    />
  </van-cell-group>
  
  <div style="margin: 16px;">
    <van-button round block type="primary" native-type="submit">
      提交
    </van-button>
  </div>
</van-form>
```

### 3.4 弹层类：Toast、Dialog、Popup

#### Toast轻提示

```javascript
import { showToast, showLoadingToast, showSuccessToast, showFailToast } from 'vant'

// 普通提示
showToast('提示内容')

// 加载提示
showLoadingToast({
  message: '加载中...',
  forbidClick: true
})

// 成功/失败
showSuccessToast('成功')
showFailToast('失败')
```

#### Dialog弹窗

```javascript
import { showDialog, showConfirmDialog } from 'vant'

// 提示框
showDialog({
  title: '提示',
  message: '这是一条提示信息'
})

// 确认框
showConfirmDialog({
  title: '提示',
  message: '确定要删除吗？'
}).then(() => {
  // 点了确定
  showSuccessToast('删除成功')
}).catch(() => {
  // 点了取消
})
```

#### Popup弹出层

从底部、顶部、左边、右边弹出来的层：

```vue
<van-popup v-model:show="show" position="bottom" round>
  <div style="padding: 20px;">
    底部弹出的内容
  </div>
</van-popup>
```

`position` 可以是：`top`、`bottom`、`left`、`right`、`center`。

---

## 四、列表与滚动：移动端灵魂

移动端开发，列表和滚动是灵魂——下拉刷新、上拉加载、滚动吸附……这些Vant都给你做好了。

### 4.1 List列表

普通列表用Cell，数据列表用List组件。

### 4.2 PullRefresh下拉刷新

```vue
<van-pull-refresh v-model="refreshing" @refresh="onRefresh">
  <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
    <van-cell v-for="item in list" :key="item.id" :title="item.title" />
  </van-list>
</van-pull-refresh>
```

```javascript
const refreshing = ref(false)
const loading = ref(false)
const finished = ref(false)
const list = ref([])

// 下拉刷新
const onRefresh = async () => {
  list.value = []
  finished.value = false
  await fetchList()
  refreshing.value = false
}

// 上拉加载
const onLoad = async () => {
  const newList = await fetchMore()
  list.value.push(...newList)
  loading.value = false
  
  if (list.value.length >= total.value) {
    finished.value = true
  }
}
```

下拉刷新 + 上拉加载，这俩是移动端列表的标配，配合起来用刚好。

### 4.3 List滚动加载

上面代码里的 `van-list` 就是滚动加载组件——滚到底部自动触发load事件，加载更多数据。

几个关键属性：
- `loading`：是否正在加载
- `finished`：是否全部加载完了
- `finished-text`：全部加载完显示的文字
- `offset`：滚动到底部多少距离时触发

### 4.4 Sticky粘性布局

吸顶效果，滚到顶部就粘住不动：

```vue
<van-sticky>
  <van-button type="primary">吸顶按钮</van-button>
</van-sticky>
```

还可以指定吸顶的偏移量：`offset-top="50px"`。

---

## 五、导航与标签

### 5.1 Tabbar标签栏

移动端底部导航栏，标配：

```vue
<van-tabbar v-model="active">
  <van-tabbar-item icon="home-o">首页</van-tabbar-item>
  <van-tabbar-item icon="wap-nav">分类</van-tabbar-item>
  <van-tabbar-item icon="shopping-cart-o">购物车</van-tabbar-item>
  <van-tabbar-item icon="user-o">我的</van-tabbar-item>
</van-tabbar>
```

配合Vue Router使用：

```javascript
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const active = computed(() => route.path)

const onChange = (path) => {
  router.push(path)
}
```

### 5.2 Tabs标签页

顶部切换的标签页：

```vue
<van-tabs v-model:active="active">
  <van-tab title="标签 1">内容 1</van-tab>
  <van-tab title="标签 2">内容 2</van-tab>
  <van-tab title="标签 3">内容 3</van-tab>
</van-tabs>
```

还可以是横向滚动的、卡片样式的、带图标的……各种形态都有。

### 5.3 NavBar导航栏

顶部导航栏：

```vue
<van-nav-bar
  title="标题"
  left-text="返回"
  right-text="按钮"
  left-arrow
  @click-left="onClickLeft"
  @click-right="onClickRight"
/>
```

固定在顶部，带返回按钮，移动端标配。

---

## 六、实战项目：移动端商城首页

光说不练假把式，咱们来做一个经典的移动端电商首页——轮播图、分类导航、商品瀑布流，该有的都有。

### 6.1 需求分析

一个标准的移动端商城首页：
- ✅ 顶部搜索栏
- ✅ 轮播图（Swipe）
- ✅ 分类导航图标（10个图标）
- ✅ 商品瀑布流列表
- ✅ 底部Tabbar

### 6.2 完整代码

```vue
<!-- views/Home.vue -->
<template>
  <div class="home-page">
    <!-- 顶部搜索栏 -->
    <van-nav-bar fixed placeholder>
      <template #title>
        <van-search
          v-model="searchText"
          shape="round"
          background="transparent"
          placeholder="搜索商品"
          :show-action="false"
        />
      </template>
    </van-nav-bar>
    
    <!-- 轮播图 -->
    <van-swipe class="banner" :autoplay="3000" indicator-color="#fff">
      <van-swipe-item v-for="item in banners" :key="item.id">
        <img :src="item.image" class="banner-img" alt="">
      </van-swipe-item>
    </van-swipe>
    
    <!-- 分类导航 -->
    <div class="category-grid">
      <div 
        class="category-item" 
        v-for="item in categories" 
        :key="item.id"
        @click="handleCategory(item)"
      >
        <img :src="item.icon" class="category-icon" alt="">
        <span class="category-name">{{ item.name }}</span>
      </div>
    </div>
    
    <!-- 商品标题 -->
    <div class="section-title">
      <span class="title-line"></span>
      <span class="title-text">猜你喜欢</span>
      <span class="title-line"></span>
    </div>
    
    <!-- 商品列表（瀑布流） -->
    <div class="product-list">
      <div 
        class="product-card" 
        v-for="item in products" 
        :key="item.id"
        @click="handleProduct(item)"
      >
        <img :src="item.image" class="product-img" alt="">
        <div class="product-info">
          <p class="product-title">{{ item.title }}</p>
          <div class="product-price">
            <span class="price-symbol">¥</span>
            <span class="price-num">{{ item.price }}</span>
            <span class="sales">已售{{ item.sales }}件</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 到底了 -->
    <div class="no-more">— 我是有底线的 —</div>
    
    <!-- 底部Tabbar -->
    <van-tabbar v-model="activeTab" route>
      <van-tabbar-item icon="home-o" to="/">首页</van-tabbar-item>
      <van-tabbar-item icon="wap-nav" to="/category">分类</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart-o" to="/cart">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/user">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()
const searchText = ref('')
const activeTab = ref(0)

// 轮播图数据
const banners = ref([
  { id: 1, image: 'https://picsum.photos/750/300?random=1' },
  { id: 2, image: 'https://picsum.photos/750/300?random=2' },
  { id: 3, image: 'https://picsum.photos/750/300?random=3' },
])

// 分类数据
const categories = ref([
  { id: 1, name: '限时秒杀', icon: 'https://picsum.photos/80/80?random=10' },
  { id: 2, name: '品牌优选', icon: 'https://picsum.photos/80/80?random=11' },
  { id: 3, name: '新品首发', icon: 'https://picsum.photos/80/80?random=12' },
  { id: 4, name: '积分商城', icon: 'https://picsum.photos/80/80?random=13' },
  { id: 5, name: '免费试用', icon: 'https://picsum.photos/80/80?random=14' },
  { id: 6, name: '拼团特惠', icon: 'https://picsum.photos/80/80?random=15' },
  { id: 7, name: '优惠券', icon: 'https://picsum.photos/80/80?random=16' },
  { id: 8, name: '签到', icon: 'https://picsum.photos/80/80?random=17' },
  { id: 9, name: '每日抽奖', icon: 'https://picsum.photos/80/80?random=18' },
  { id: 10, name: '全部分类', icon: 'https://picsum.photos/80/80?random=19' },
])

// 商品数据
const products = ref([
  { id: 1, title: '这是一个很长的商品标题，可能会有两行', price: '99.00', sales: 1000, image: 'https://picsum.photos/300/300?random=20' },
  { id: 2, title: '短标题', price: '19.90', sales: 200, image: 'https://picsum.photos/300/400?random=21' },
  { id: 3, title: '中等长度的商品标题', price: '299.00', sales: 500, image: 'https://picsum.photos/300/350?random=22' },
  { id: 4, title: '非常非常长的商品标题，可能需要三行才能显示完', price: '1999.00', sales: 50, image: 'https://picsum.photos/300/380?random=23' },
  { id: 5, title: '一个好商品', price: '9.90', sales: 9999, image: 'https://picsum.photos/300/320?random=24' },
  { id: 6, title: '另一个商品', price: '59.00', sales: 300, image: 'https://picsum.photos/300/360?random=25' },
])

const handleCategory = (item) => {
  showToast(`点击了${item.name}`)
}

const handleProduct = (item) => {
  router.push(`/product/${item.id}`)
}
</script>

<style scoped lang="scss">
.home-page {
  padding-bottom: 50px; // 底部tabbar高度
  background: #f7f8fa;
  min-height: 100vh;
}

.banner {
  margin: 12px;
  border-radius: 8px;
  overflow: hidden;
  
  .banner-img {
    width: 100%;
    height: 150px;
    object-fit: cover;
  }
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  background: white;
  margin: 12px;
  border-radius: 8px;
  padding: 16px 0;
  
  .category-item {
    width: 20%;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 16px;
    
    .category-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-bottom: 6px;
    }
    
    .category-name {
      font-size: 12px;
      color: #333;
    }
  }
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0 12px;
  
  .title-line {
    width: 40px;
    height: 1px;
    background: #ddd;
  }
  
  .title-text {
    margin: 0 12px;
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }
}

.product-list {
  display: flex;
  flex-wrap: wrap;
  padding: 0 8px;
  gap: 8px;
  
  .product-card {
    width: calc(50% - 4px);
    background: white;
    border-radius: 8px;
    overflow: hidden;
    
    .product-img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
    }
    
    .product-info {
      padding: 8px;
      
      .product-title {
        font-size: 13px;
        color: #333;
        line-height: 1.4;
        margin-bottom: 6px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .product-price {
        display: flex;
        align-items: baseline;
        gap: 4px;
        
        .price-symbol {
          font-size: 12px;
          color: #ff4d4f;
          font-weight: bold;
        }
        
        .price-num {
          font-size: 16px;
          color: #ff4d4f;
          font-weight: bold;
        }
        
        .sales {
          margin-left: auto;
          font-size: 11px;
          color: #999;
        }
      }
    }
  }
}

.no-more {
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 20px 0;
}
</style>
```

👉 **动手试试**：
1. 在你的Vue移动端项目里安装Vant
2. 配置按需引入和移动端适配
3. 把上面的商城首页写出来
4. 再加上下拉刷新和上拉加载（PullRefresh + List）
5. 试试自己加一个商品详情页

一个电商首页就出来了，是不是很快？CV大法好！

🤖 **AI小助手**：做移动端页面的时候，直接跟AI说："用Vue3 + Vant写一个移动端XXX页面，要求XXX"——AI生成的代码改一改就能用，效率很高。但要注意移动端的适配和交互细节，AI可能写得没那么精细。

---

## 七、新手必避的10个坑 ⚠️

### 坑1：样式不生效/组件不显示
**现象**：引入了组件但没样式，或者组件根本不显示
**原因**：按需引入配置有问题，或者组件名写错了
**解决**：检查自动导入配置对不对，组件名是不是van-开头的，驼峰和短横线别搞混

### 坑2：px转换vw不对
**现象**：页面尺寸不对，组件太大或太小
**原因**：postcss-px-to-viewport配置的viewportWidth和设计稿不一致
**解决**：跟设计师确认设计稿宽度，是375还是750，配置对应的值

### 坑3：底部Tabbar遮挡内容
**现象**：页面最下面的内容被底部Tabbar挡住了
**原因**：Tabbar是fixed定位，不占文档流
**解决**：给页面底部加padding-bottom，值等于Tabbar的高度（一般50px）

### 坑4：弹窗里的内容不响应
**现象**：Popup/Dialog里的数据改了，弹窗内容不更新
**原因**：Vant的弹层是teleport到body的，有时候响应式追踪有问题
**解决**：确保数据是响应式的，或者用v-if重新渲染

### 坑5：List组件不触发load
**现象**：List组件的load事件不触发
**原因**：很多种——内容不够高没出现滚动条、loading没设对、finished设成true了
**解决**：检查三点：1. 列表内容够不够（不够一屏会自动触发）2. loading初始值是false 3. finished是不是false

### 坑6：表单校验不触发
**现象**：van-form的校验不生效
**原因**：跟Element Plus类似，name属性没对应上，或者rules配置不对
**解决**：检查field的name属性值和rules的key是不是完全对应

### 坑7：固定定位元素被顶起
**现象**：iOS上，输入框获取焦点时，fixed定位的元素（比如底部按钮）被键盘顶起来错位
**原因**：iOS键盘弹起时webview高度变化的老问题
**解决**：用Vant的KeyboardAccessory组件，或者监听键盘事件调整

### 坑8：图片尺寸不对
**现象**：商品图片变形、拉伸
**原因**：图片宽高比不一样，直接设置宽高会变形
**解决**：用aspect-ratio固定比例，object-fit: cover裁切，或者用van-image组件的fit属性

### 坑9：滚动穿透
**现象**：弹窗打开时，后面的页面还能滚动
**原因**：弹层默认不锁定背景滚动
**解决**：Popup组件加 `lock-scroll` 属性，或者自己加overflow:hidden

### 坑10：组件库太大
**现象**：打包后Vant占了很大体积
**原因**：完整引入了所有组件
**解决**：一定要配置按需引入/自动导入，只打包用到的组件和样式，体积会小很多

---

## 八、总结与后续学习建议

### 8.1 本篇要点回顾

回顾一下这篇的核心内容：

1. **Vant是什么**：Vue移动端组件库，有赞出品，国内最流行
2. **安装配置**：npm安装 + unplugin自动导入 + px转vw适配
3. **基础组件**：Button、Cell、Field、Form、Toast、Dialog、Popup
4. **列表滚动**：PullRefresh下拉刷新 + List上拉加载 + Sticky吸顶
5. **导航类**：Tabbar底部导航、Tabs标签页、NavBar导航栏
6. **实战**：移动端商城首页（搜索栏、轮播、分类、商品流、底部Tabbar）

### 8.2 学习心得

移动端开发跟PC端思路不太一样，但组件库的用法是相通的——都是CV工程师，复制粘贴改参数。

给新手的建议：
- **先做一个完整项目**：跟着做一个完整的H5页面，常用组件就都熟悉了
- **多看官方示例**：Vant文档每个组件都有很多示例，找最接近的改
- **注意移动端细节**：适配、点击区域、滚动体验、键盘交互……移动端的细节比PC端多
- **多在真机上测**：模拟器上好好的，真机上可能有各种奇葩问题

Vant只是工具，真正考验功力的是移动端的交互体验和性能优化。

🤖 **AI时代怎么学Vant**：
- 不用记组件名和API，需要的时候问AI或者查文档
- 让AI生成组件代码，你再调整细节
- 移动端适配和性能优化的知识要扎实，这些AI帮不了你太多

### 8.3 接下来学什么？

Vue全家桶、PC组件库、移动端组件库都搞定了。接下来该学**HTTP协议**和**Axios封装**了——前后端联调是必经之路，搞懂HTTP和网络请求，才能跟后端愉快地对接。

```
Vue3 → Vue Router → Pinia → 组件通信 → 组件库 → HTTP协议 → Axios封装 → 全栈项目
```

下一篇咱们讲 **HTTP协议解密**——浏览器和服务器到底在聊什么？一篇搞懂。

### 8.4 学习资源推荐

- **Vant官方文档**：最权威的Vant教程，组件大全
- **Vant Weapp**：微信小程序版本（如果你做小程序）
- **Vant Use**：Vant官方的组合式函数库
- **有赞技术博客**：很多移动端最佳实践的文章

---

> 💬 **最后说两句**：
> 
> 恭喜你又看完了一篇Vant速成教程！现在你PC端和移动端的组件库都会了，不管做什么类型的项目都能上手。
> 
> 我第一次做移动端项目的时候，踩了好多坑——适配问题、iOS兼容性、键盘顶起、滚动穿透……各种奇奇怪怪的问题。但做多了之后就发现，其实大部分坑都有现成的解决方案，Vant也帮你踩了很多。
> 
> 移动端开发，拼的就是细节。同样的页面，做得糙和做得精致，体验天差地别。希望你做出来的页面，不仅功能能用，体验也能丝滑流畅。
> 
> 现在就去用Vant写一个属于你的移动端页面吧！CV一时爽，一直CV一直爽。
> 
> **万水千山总是情，点个👍行不行？** 你的点赞收藏是我更新的最大动力！

---

*相关推荐：《Element Plus开箱即用：CV工程师的快乐》《Tailwind CSS：不用写CSS的快乐》《Vue3入门：Composition API写起来到底有多爽》*
