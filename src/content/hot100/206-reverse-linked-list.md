---
no: 206
title: "反转链表"
difficulty: "简单"
category: "链表"
leetcode: "https://leetcode.cn/problems/reverse-linked-list/"
keyIdea: "两个指针一前一后走，每步把当前节点的 next 指向前一个节点。"
complexity: "O(n) / O(1)"
related: [92, 25, 234]
---

## 思路

链表题的通用手感：**先把「下一步要用到的节点」存下来，再改指针**。否则改完 `next` 就找不到后续节点了。

迭代版本只用到三个变量：

- `prev` — 已经反转好的那段的头（初始 `null`）
- `curr` — 当前正在处理的节点
- `next` — 提前存下的下一个节点

## 代码

```js
function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr !== null) {
    const next = curr.next; // 1. 先存
    curr.next = prev; // 2. 再改指针
    prev = curr; // 3. prev 前移
    curr = next; // 4. curr 前移
  }

  return prev; // 循环结束时 prev 落在原链表的尾节点，也就是新头
}
```

## 易错点

- 返回的是 `prev` 不是 `curr`——循环结束时 `curr` 已经是 `null` 了。
- 空链表（`head === null`）不用特判，循环一次都不进，直接返回 `null`，正好正确。
- 第 1 步和第 2 步的顺序绝不能换。

## 递归写法

```js
function reverseList(head) {
  if (head === null || head.next === null) return head;
  const newHead = reverseList(head.next);
  head.next.next = head;
  head.next = null;
  return newHead;
}
```

递归更好写但空间是 O(n)，因为有调用栈。面试里建议先写迭代，如果被问「还有别的解法吗」再补递归。

## 面试延伸

- 只反转中间一段（第 92 题）——多一个「记录反转区间前驱」的步骤。
- 每 k 个一组反转（第 25 题）——本题的进阶。
