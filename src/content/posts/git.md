---
title: "git使用和进阶"
published: 2026-08-31
description: "git总结"
tags: ["git"]
category: "技术总结"
draft: false
lang: "zh-CN"
---
学 Git 有一阵了，平时 `add`、`commit`、`push` 三连倒是顺手，但每次一出问题就慌——撤销怎么撤来着？分支删了还能救吗？干脆把这段时间摸出来的东西记一篇，以后自己翻着方便，也算给这段学习结个尾。

![](/blogs/git/990edf642e0a8847.png)
## 先把三个区搞清楚

一开始我总记不住命令，后来发现是没搞懂 Git 的三个区。**工作区**就是我能看到的文件，**暂存区**是"准备提交的名单"，**版本库**是已经存档的历史。

```
工作区  ──git add──▶  暂存区  ──git commit──▶  版本库
                                            │
                  └──── git push ──────▶  远程仓库
```

这张图理顺之后，命令就知道往哪用了。`git add` 把改动放进暂存区，`git commit` 把暂存区冻成一个提交。平时 `git status` 多看两眼，它会告诉你每个文件现在在哪个区，比瞎猜靠谱多了。

看改了啥也有两个方向，我之前老混：

```bash
git diff              # 还没 add 的改动
git diff --staged     # 已经 add、准备 commit 的改动
```

现在 commit 前我都会 `git diff --staged` 扫一眼，好几次发现把 console.log 一起 add 进去了。

## 日常那几招

真正天天用的就那么几个：

```bash
git init                        # 当前目录建仓库
git clone <url>                 # 克隆别人的
git add .                       # 全加进暂存区
git commit -m "fix: 登录跳转丢了参数"
git log --oneline --graph --all # 看历史，加 --graph 能看到分支分叉
```

提交信息我以前随便写，后来发现回看历史根本认不出哪条干了啥。现在习惯加个前缀：`feat` 新功能、`fix` 修 bug、`refactor` 重构、`chore` 杂事。不用很正式，但一眼能分清就行。

分支这东西，一开始我嫌麻烦老在 main 上直接改，结果改到一半想回退都分不清"哪个改动属于哪次任务"。后来学乖了，新东西一律开分支：

```bash
git switch -c feature/comment   # 开个新分支并切过去
# 写代码、提交……
git switch main                 # 切回主干
git merge feature/comment       # 合进来
git branch -d feature/comment   # 合完删掉
```

`switch` 是新命令，专门切分支。老的 `checkout` 什么都能干，反而容易搞混，现在我都用 `switch`。

同步远程：

```bash
git fetch           # 拉更新但不合并，先看看别人改了啥
git pull            # 直接拉下来合并
git push            # 推上去
git push -u origin feature/x   # 第一次推新分支加 -u，之后就能直接 push
```

`fetch` 和 `pull` 的区别我琢磨了一阵：`fetch` 只更新远程的记录，不动我手上的代码；`pull` 是 `fetch` 完直接合并。想先看一眼再决定合不合并，就用 `fetch`。

## merge 还是 rebase，我踩过的坑

两个人都从主干拉分支，先后合回去，历史会长不一样。`merge` 保留两条线，多一个合并提交；`rebase` 把你的提交"挪"到别人最新的后面，历史是一条直线。

```bash
git merge feature/x     # 保留分支痕迹
git rebase main         # 把我的提交挪到 main 末端
```

这里我吃过亏：有次把自己已经推上去的分支 rebase 了，哈希全变了，队友 pull 下来冲突一坨。教训记下了——**推上去的、别人可能碰过的分支，别 rebase**，老老实实用 merge。自己本地还没推的分支随便 rebase 整理。

## 撤销这块最容易乱

撤销是我觉得 Git 最绕的地方，因为"撤销"在不同阶段完全是不同的命令。我按"东西现在在哪个区"来记：

**改了文件还没 add**——直接丢：

```bash
git restore file.txt        # 丢掉这个文件的改动
git restore .               # 全丢（小心点用）
```

**add 了但还没 commit**——撤回暂存，改动还在：

```bash
git restore --staged file.txt
```

**已经 commit 但还没 push**——用 reset，三个模式我列个表对着记：

| 模式 | 提交 | 改动去哪了 |
| --- | --- | --- |
| `--soft` | 撤销 | 回到暂存区，能直接重新 commit |
| `--mixed`（默认） | 撤销 | 回到工作区，要重新 add |
| `--hard` | 撤销 | **直接没了** |

```bash
git reset --soft HEAD~1     # 撤销提交，改动留着
git reset --hard HEAD~1     # 撤销提交，改动也没了——这个我每次用前都停三秒
```

**已经 push 了**——别用 reset，用 revert 反向提交，安全：

```bash
git revert <commit-hash>    # 新建一个"反着来"的提交
git push
```

线上出问题回滚，一律 revert，别动历史。

## stash 和 cherry-pick，偶尔用但很救命

有次写到一半要切分支修 bug，又不想把半成品提交。`git stash` 就是干这个的：

```bash
git stash                   # 改动先收起来，工作区变干净
git stash pop               # 回来后取回，顺手删掉这条记录
git stash list              # 看存了哪些
```

`cherry-pick` 是只想要别的分支某一个提交，不要整个分支：

```bash
git cherry-pick <commit-hash>
```

我用它的场景：feature 分支修了个 bug，main 上也急着要，但 feature 还没做完不能整个合——就把那一个修复摘过来。

## 很重要的两个指令

**reflog**。有次我 `reset --hard` 把半天的活儿冲掉了，以为完蛋了。结果 reflog 记着 HEAD 走过的每一步：

```bash
git reflog
# 8d9e0f2 HEAD@{1}: commit: 就是那个被冲掉的提交
git reset --hard 8d9e0f2    # 回去！
```

从那以后我知道了：**Git 几乎不真删东西**，reset 掉的、误删的分支，reflog 里基本都能翻回来。慌之前先 `git reflog`。

**bisect**。有次不知道哪个提交引入的 bug，十几个提交手测太累。bisect 帮你二分：

```bash
git bisect start
git bisect bad               # 现在是坏的
git bisect good v1.2.0       # 这个版本是好的
# Git 自动切到中间，你测一下，告诉它 bad 还是 good
# 几轮就定位到那个提交了
git bisect reset             # 搞定收工
```

## rebase -i：整理乱七八糟的提交

本地写的时候难免一堆 `wip`、`typo`、`再改改` 的提交，推之前想收拾干净，`git rebase -i` 派上用场：

```bash
git rebase -i HEAD~4    # 整理最近 4 个提交
```

它会弹出来一个列表，每行一个提交前面带个动作：

```
pick   a1b2c3 feat: 加评论框
pick   d4e5f6 fix: 样式
squash 7g8h9j wip            # 这个并到上一个里
pick   9k0l1m refactor: 抽 hook
```

常用的就几个：`pick` 保留、`squash` 并到上一个、`reword` 改提交信息、`drop` 丢掉。把一堆碎提交合成一条干净的，看着舒服多了。再次提醒自己：只整理还没推的，推过的别碰。

## 一些小配置

别名，把长命令缩短，在 `~/.gitconfig` 里加：

```ini
[alias]
    lg = log --oneline --graph --all --decorate
    st = status -sb
    co = checkout
```

现在 `git lg` 就能看那张分支图，比敲一长串省事。

钩子我还没怎么玩，只知道 pre-commit 能在提交前自动跑 lint，等以后团队协作再研究。

大文件别直接塞进 Git，仓库会越撑越大。要用 Git LFS 单独管，这个我还没实际用过，先记着。

## 最后记几条给自己

- 提交别太大，一个提交干一件事，回退和查 bug 都好定位
- 新东西开分支，main 永远是能用的
- 推过的历史别 rebase，用 revert
- 出事先 `git reflog`，多半能救

写这篇的过程中又把几个命令过了一遍，感觉比刚学时清晰多了。剩下就是多用，用多了这些命令就不用现查了。
