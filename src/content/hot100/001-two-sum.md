---
no: 1
title: "两数之和"
difficulty: "简单"
category: "哈希"
leetcode: "https://leetcode.cn/problems/two-sum/"
keyIdea: "遍历时用哈希表记住「已经见过的值和下标」，查 target - x 有没有出现过。"
complexity: "O(n) / O(n)"
related: [15, 167]
---

## 思路

暴力两层循环是 O(n²)。关键在于**把「找另一个数」变成一次查表**：遍历到 `nums[i]` 时，需要的搭档是 `target - nums[i]`，只要知道这个值之前出现过没有。

用 `Map` 存 `值 → 下标`，一次遍历搞定。

## 代码

```js
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i += 1) {
    const need = target - nums[i];
    if (seen.has(need)) {
      return [seen.get(need), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}
```

## 易错点

- **先查再存**。如果先把当前值存进去，遇到 `[3, 3]`、`target = 6` 时会把同一个下标返回两次。
- 题目要求返回**下标**，不是值，所以必须存下标而不是布尔标记。
- 输出顺序无所谓，但习惯上让小的在前。

## 面试延伸

- 数组已排序时怎么做？双指针，O(1) 空间（第 167 题）。
- 要找三个数呢？排序后固定一个 + 双指针（第 15 题）。
- 如果要求返回所有不重复的组合？就得靠排序去重。
