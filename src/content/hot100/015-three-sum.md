---
no: 15
title: "三数之和"
difficulty: "中等"
category: "双指针"
leetcode: "https://leetcode.cn/problems/3sum/"
keyIdea: "排序后固定一个数，剩下两数用双指针夹逼，靠排序保证可以跳重。"
complexity: "O(n²) / O(1)"
related: [1, 167, 18]
---

## 思路

三数之和看着比两数之和难，其实只是**多套了一层循环**：外层固定 `nums[i]`，内层退化成「有序数组里找两数之和为 `-nums[i]`」。

排序是前提，因为它同时带来了两个好处：

1. 双指针可以自由移动（和太小右移左指针，和太大左移右指针）。
2. 重复元素一定相邻，**跳重只需要比较相邻元素**。

## 代码

```js
function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const res = [];

  for (let i = 0; i < nums.length - 2; i += 1) {
    if (nums[i] > 0) break; // 最小的都大于 0，后面不可能凑成 0
    if (i > 0 && nums[i] === nums[i - 1]) continue; // 外层去重

    let left = i + 1;
    let right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        res.push([nums[i], nums[left], nums[right]]);
        while (left < right && nums[left] === nums[left + 1]) left += 1;
        while (left < right && nums[right] === nums[right - 1]) right -= 1;
        left += 1;
        right -= 1;
      } else if (sum < 0) {
        left += 1;
      } else {
        right -= 1;
      }
    }
  }

  return res;
}
```

## 易错点

- **三处去重缺一不可**：外层 `i`、左指针、右指针。漏掉任意一处就会出现重复三元组。
- 找到答案后要先跳重**再**同时移动双指针，顺序反了会漏解。
- 剪枝 `nums[i] > 0` 可以提前结束，虽然是优化不是必须，但面试官通常会注意你有没有写。

## 面试延伸

- 为什么不用哈希做？可以，但去重逻辑会变得很脏，双指针+排序是更干净的解法。
- 四数之和？外层再套一层循环，其余照抄（第 18 题）。
- 时间复杂度为什么是 O(n²)？外层 n，内层双指针整体走一遍也是 n。
