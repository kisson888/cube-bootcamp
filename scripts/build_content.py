# -*- coding: utf-8 -*-
"""生成魔方训练营内容种子：文章、关卡、案例（Markdown + frontmatter）。
运行：python3 scripts/build_content.py
"""
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CONTENT = os.path.join(ROOT, "content")
ART = os.path.join(CONTENT, "articles")
LVL = os.path.join(CONTENT, "levels")
CAS = os.path.join(CONTENT, "cases")
for d in (ART, LVL, CAS):
    os.makedirs(d, exist_ok=True)


def write(folder, name, fm, body):
    text = "---\n" + fm.strip() + "\n---\n\n" + body.strip() + "\n"
    with open(os.path.join(folder, name + ".md"), "w", encoding="utf-8") as f:
        f.write(text)


# ============================ 文章 articles ============================
articles = []

articles.append(("a01-know-cube", """title: 认识魔方：从零开始的第一课
category: 入门
difficulty: 1
duration: 8 分钟
order: 1
tags: [结构, 配色, 入门]""", """三阶魔方（3×3×3）由 **26 个块** 组成：6 个中心块（决定该面的颜色）、12 个棱块（两个颜色）、8 个角块（三个颜色）。它只有一个正确答案：让每个面都只有单一颜色。

## 为什么从三阶开始
三阶是几乎所有玩法和比赛的起点。掌握好三阶，再学二阶、四阶、盲拧都会轻松很多。

## 标准配色
国际通用（日本配色）的相对关系固定：
- 白 ↔ 黄（相对）
- 红 ↔ 橙（相对）
- 蓝 ↔ 绿（相对）

初学者常犯的错误是"把中心块拆下来重装"，请记住：**中心块永远不能动**，它们决定了配色。

## 先别急着还原
本训练营采用 **阶梯式计划**：先认识结构、学会记号，再一步步完成底层十字、还原整层，直到第一次完整还原。跟着左侧"训练计划"走，比直接背公式有效得多。

> 小目标：今天只需能正确说出 6 个面的颜色和相对关系。"""))

articles.append(("a02-notation", """title: 标准转动记号：看懂公式的语言
category: 入门
difficulty: 1
duration: 10 分钟
order: 2
tags: [记号, 公式, 入门]""", """所有教程和公式都用**记号（notation）**描述转动。掌握它，你才能读懂任何一篇攻略。

## 六个面
用首字母表示：
- **U** (Up 上) **D** (Down 下)
- **L** (Left 左) **R** (Right 右)
- **F** (Front 前) **B** (Back 后)

## 转动方向
- 无后缀：顺时针转 90°（从该面正前方看）
- **'**（撇号）：逆时针 90°，如 `R'`
- **2**：转 180°，如 `U2`

## 整层 vs 中层
- `x y z`：把整个魔方沿某轴转（少用到）
- `M E S`：中间层（Middle/Equator/Standing），进阶才用

## 练习
看着魔方，快速做出：`R R' R2 U U' U2 L L' F F'`。能做到不犹豫，就算过关。

> 提示：背公式前先练熟记号，否则后期提速会卡在"看不懂"上。"""))

articles.append(("a03-lbl-overview", """title: 层先法总览：七步还原路线
category: 还原
difficulty: 2
duration: 12 分钟
order: 3
tags: [层先法, LBL, 还原]""", """层先法（Layer By Layer, LBL）是最适合新手的还原方法，把还原拆成 7 个清晰步骤：

1. 底层十字（Cross）
2. 底层角块（第一层完成）
3. 中层棱块（前两层完成）
4. 顶层十字
5. 顶层翻色（顶面全黄）
6. 顶层角块归位
7. 顶层棱块归位

## 为什么先学层先法
- 步骤直观，每步都有明确目标
- 公式少、易记忆
- 是通往 CFOP 等高级方法的基础

## 学习顺序建议
本训练营的 L0→L2 关卡对应层先法全过程。先不求快，追求"不卡壳地走完七步"。

> 新手常见误区：一上来就背 57 个 OLL。请先稳定走完七步，再谈提速。"""))

articles.append(("a04-cross", """title: 第一步：底层十字（DaYan Cross）
category: 还原
difficulty: 2
duration: 15 分钟
order: 4
tags: [层先法, 十字, 还原]""", """目标：在**白色面**拼出一个十字，且四条棱的另一颜色与侧面中心块对齐。

## 步骤
1. 把魔方白色朝上（U 面为白）。
2. 找到带白色的棱块，把它转到白色面，且侧边颜色对准同色中心。
3. 重复 4 个白色棱块。

## 要点
- 不要只盯白色，要同时看侧边颜色是否对齐。
- 遇到卡住，用 `F` / `R` 等简单转动把棱块"放下来"再送上去。

## 达标
L0 关卡要求：2 分钟内做出对齐的底层十字。熟练后可压到 10 秒内。

> 十字是后面一切的基础，值得反复练习到形成肌肉记忆。"""))

articles.append(("a05-f2l-lbl", """title: 第二、三步：底层角块与中层棱块
category: 还原
difficulty: 2
duration: 18 分钟
order: 5
tags: [层先法, 角块, 棱块, 还原]""", """完成底层十字后，目标是把**前两层（F2L 在层先法语境下指底层+中层）**全部归位。

## 底层角块（4 个）
把白色角块送回底层正确位置。常用思路：
- 角块在顶层：用 `R U R'` 系列把它塞进空位
- 角块在底层但错位：先"挖出来"再塞回去

## 中层棱块（4 个）
不含黄色的棱块归位到中层。标准公式（以右侧为例）：
- 棱块要去左：`U' L' U L U F U' F'`
- 棱块要去右：`U R U' R' U' F' U F`

## 达标
L1 关卡要求：完整还原底层两层（白面 + 一圈侧面颜色正确）。

> 提示：角块和棱块公式可以只记"形态"——看到错位块，自然想到该怎么挖、怎么塞。"""))

articles.append(("a06-OLL-cross", """title: 第四、五步：顶层十字与翻色
category: 还原
difficulty: 3
duration: 15 分钟
order: 6
tags: [层先法, 顶层, 翻色, 还原]""", """现在白色在底，黄色在顶但可能散乱。这一步让**顶面变成全黄**。

## 顶层十字
看顶层黄色棱块形状：
- 点（无）：`F R U R' U' F'`
- 直线：`F R U R' U' F'`（方向对准后再做）
- 直角：同上公式调整后做

## 顶层翻色（使全黄）
常见公式：`R U R' U R U2 R'`（小鱼公式，反复用到黄色块呈小鱼形态）。

## 达标
L2 关卡要求：顶面全黄（之后只需把块"归位"即可）。

> 这一步公式最易混，建议把"小鱼"练到闭眼能做。"""))

articles.append(("a07-PLL-lbl", """title: 第六、七步：顶层角块与棱块归位
category: 还原
difficulty: 3
duration: 15 分钟
order: 7
tags: [层先法, 顶层, 归位, 还原]""", """顶面已经全黄，最后把角块和棱块**归位**到正确位置（颜色可能对但朝向错，需再翻）。

## 顶层角块归位
公式：`x R' U R U' R' U' R U' R' U2 R U2 x'`（或常用 `A Perm` 思路）。

## 顶层棱块归位（三棱换）
公式：`R U' R U R U R U' R' U' R2`。

## 恭喜——第一次完整还原！
当六面都只有一种颜色，你就完成了人生第一次还原。把它记进"我的档案"。

> L2 达标线：完成任意一次完整还原。接下来进入提速阶段。"""))

articles.append(("a08-after-first", """title: 第一次完整还原之后该做什么
category: 过渡
difficulty: 2
duration: 8 分钟
order: 8
tags: [心态, 进阶, 提速]""", """完成首次还原值得庆祝，但真正的训练才刚开始。

## 三个方向
1. **稳定**：连续 10 次不看公式走完七步
2. **提速**：把每步公式做顺，目标单次 < 1:30
3. **进阶**：了解 CFOP，为未来提速打基础

## 不要急着背全公式
很多新手在"会还原"后立刻去背 57 个 OLL，结果越背越乱。建议先把层先法做到 1 分钟以内，再自然过渡到 CFOP。

## 建立你的档案
在"我的档案"里记录每次成绩、方法和感受，训练才有迹可循。"""))

articles.append(("a09-fingertricks", """title: 手法（Fingertricks）基础
category: 提速
difficulty: 3
duration: 20 分钟
order: 9
tags: [手法, 提速, fingertricks]""", """提速的关键不是手快，而是**用对手指、少转动手腕**。

## 核心手法
- **U / U'**：用食指推、无名指勾，而非整只手转
- **R / R'**：食指推 R，中指/无名指拉 R'
- **F / F'**：食指推 F，拇指勾 F'
- **双指拨 U2**：食指+无名指连续拨

## 练习方法
- 慢速、夸张地做，确保每一下都"弹"而不是"拧"
- 用 `R U R' U'` 循环练习（著名的 T 排列练习）
- 录视频回看手腕是否晃动

## 达标
L3 关卡要求：底层十字稳定做到 2 秒内，整体均速 < 1:30。"""))

articles.append(("a10-timer-review", """title: 计时、复盘与目标设定
category: 提速
difficulty: 2
duration: 12 分钟
order: 10
tags: [计时, 复盘, 目标]""", """没有计时就没有进步。专业选手看的是 **Ao5 / Ao12**（最近 5 / 12 次去掉最好最差的平均）。

## 工具
- 在线：cstimer.net（免费、功能强）
- 实体：计时器 + 打乱公式（标准 WCA 打乱）

## 复盘三问
1. 这次卡在哪一步？（十字？F2L？PLL？）
2. 是公式不熟还是手法慢？
3. 下一步专门练什么？

## 设定目标
用 SMART 原则：例如"两周内层先法均速从 1:50 降到 1:20"。把它写进档案。

> 案例库里有"用 cstimer 计时与统计"和"职业选手训练节奏"可参考。"""))

articles.append(("a11-cfop-overview", """title: CFOP 概览与 Cross
category: 进阶
difficulty: 4
duration: 18 分钟
order: 11
tags: [CFOP, 进阶, Cross]""", """CFOP 是当今最主流的速拧方法，由四大步骤组成：
- **C**ross 十字
- **F**irst 2 **L**ayers 前两层
- **O**rientation of **L**ast **L**ayer 顶层朝向
- **P**ermutation of **L**ast **L**ayer 顶层排列

## 为什么 CFOP 快
- 减少"逐块找位置"的思考
- F2L 把第一、二层一起做，省步骤
- OLL/PLL 公式化，可练到极快

## 从 Cross 开始
CFOP 的 Cross 与层先法十字类似，但要求**在观察阶段就规划好 4 条棱的落点**，开拧即做。

> L4 关卡目标：理解 F2L 原理，均速 < 1:00。"""))

articles.append(("a12-f2l", """title: F2L 原理入门
category: 进阶
difficulty: 4
duration: 22 分钟
order: 12
tags: [CFOP, F2L, 进阶]""", """F2L（First Two Layers）把"角块+棱块"成对插入，一次完成前两层。

## 基本思路
1. 在顶层找到一对属于同一空位的角块和棱块
2. 把它们配成"对"，再一起插入底部空位

## 三种常见情况
- 角棱已配对：直接插入
- 角棱分离：先制造配对
- 角棱在错误位置：用 `U` 调整到可插入形态

## 建议
先**不背公式**，用直觉插入；熟练后再学标准 F2L 算法提速。网上有大量 F2L 可视化练习工具。

> 提示：F2L 是 CFOP 里最"烧脑"也最值得练的部分，占总步数一半以上。"""))

articles.append(("a13-oll-pll", """title: OLL 与 PLL 入门
category: 进阶
difficulty: 4
duration: 20 分钟
order: 13
tags: [CFOP, OLL, PLL, 进阶]""", """完成 F2L 后，顶层需要：先让黄色朝上（OLL），再排好位置（PLL）。

## OLL（57 个公式）
新手不必全背，先学 **2-look OLL**：
- 先让顶层十字（6 个公式）
- 再翻其余（7 个公式）
这样只用 2 步、约 13 个公式即可覆盖全部情况。

## PLL（21 个公式）
同样可先学 **2-look PLL**：
- 先排角（2 个公式）
- 再排棱（2 个公式）

## 达标
L5 关卡目标：掌握 2-look OLL/PLL，均速 < 40 秒。

> 完整 57 OLL + 21 PLL 是长期工程，循序渐进即可。"""))

articles.append(("a14-blind-other", """title: 盲拧与异形魔方简介
category: 专题
difficulty: 5
duration: 15 分钟
order: 14
tags: [盲拧, 异形, 专题]""", """当你三阶稳进 30 秒，可以探索更广阔的世界。

## 盲拧（Blindfolded）
靠记忆+编码一次性完成。最经典入门法：**Old Pochmann**（仅用 R 和 L 的换棱算法）。盲拧锻炼记忆力与空间想象，非常硬核。

## 异形魔方
- **二阶（2×2）**：无中心无棱，本质是三阶的角块
- **四阶（4×4）**：降阶法——先拼中心再拼棱，最后当三阶解
- **金字塔（Pyraminx）/斜转（Skewb）**：转动逻辑完全不同，入门极快
- **五阶及以上**：高阶降阶

## 建议
L6 关卡鼓励按兴趣选一个方向深入。案例库有各类玩法详解。"""))

articles.append(("a15-wca-rules", """title: WCA 比赛规则入门
category: 专题
difficulty: 3
duration: 14 分钟
order: 15
tags: [WCA, 比赛, 规则, 专题]""", """想参加比赛？先了解世界魔方协会（WCA）的基本规则。

## 比赛流程
- 每轮有若干**尝试（attempt）**，取最好单次和平均（Ao5）
- 裁判判罚：如转动中松手、超时（通常 10 分钟）、违规观察
- 观察时间：标准 15 秒，需先归位再开始

## 主要项目
三阶、二阶、四阶、五阶、三阶单手、三阶盲拧、三阶最少步（FMC）、金字塔、斜转、魔表等共 **17 个项目**。

## 如何参赛
在 WCA 官网查你所在城市的赛事，免费注册即可。第一次参赛建议从三阶开始。

> 案例库有"WCA 2025 世锦赛"等真实赛事可参考。"""))

articles.append(("a16-buy-guide", """title: 速拧魔方选购指南
category: 专题
difficulty: 2
duration: 12 分钟
order: 16
tags: [器材, 选购, 专题]""", """选对魔方，训练事半功倍。

## 核心参数
- **磁力（Magnetic）**：块内有磁片，定位更稳，速拧首选
- **尺寸**：三阶常见 54–56mm，手大选 56，手小选 54
- **调校**：现代魔方多支持张力/磁力调节
- **磁感等级**：弱磁灵活、强磁稳定，按手感选

## 主流品牌
- **GAN**：高端、手感顺滑、价格高
- **MoYu（魔域）**：性价比高、型号多
- **QiYi（奇艺）**：入门友好、价格亲民

## 新手建议
第一颗选 50–80 元带磁的三阶（如 MoYu RS3 M / GAN 356 M），足够用到进 15 秒。

> 案例库有"主流品牌对比"与"魔方调校"可深入阅读。"""))

for n, fm, body in articles:
    write(ART, n, fm, body)

# ============================ 关卡 levels ============================
levels = []

levels.append(("L0", """title: L0 萌新起步：认识与记号
level: L0
order: 0
goal: 认识魔方结构、标准配色，掌握基础转动记号
target: 能不犹豫地做出 R R' R2 U U' U2 L L' F F' 等基础转动；说出六面相对配色
knowledge:
  - 三阶结构：6 中心 / 12 棱 / 8 角
  - 相对配色：白↔黄、红↔橙、蓝↔绿
  - 六个面记号与顺/逆/180° 表示
tasks:
  - 阅读《认识魔方》《标准转动记号》
  - 在魔方上慢速完成所有基础记号转动各 5 次
recommend:
  - a01-know-cube
  - a02-notation""", """欢迎来到魔方训练营！L0 是一切的起点。

## 本关任务
1. 搞清楚魔方由哪些块组成，记住中心块不动。
2. 记住相对配色（白↔黄、红↔橙、蓝↔绿）。
3. 把六个面记号（U/D/L/R/F/B）练到闭眼能做。

## 为什么先练记号
记号是后面所有公式的"语言"。前期多花 20 分钟在记号上，未来背公式能省好几小时。

## 完成后
在"我的档案"里把 L0 标记为已完成，进入 L1 拼底层十字。"""))

levels.append(("L1", """title: L1 层先·底层两层
level: L1
order: 1
goal: 完成底层十字 + 底层角块 + 中层棱块，还原前两层
target: 稳定拼出白面十字（侧边对齐）并还原前两层，不卡壳
knowledge:
  - 底层十字的对齐判断
  - 角块"挖-塞"思路
  - 中层棱块左右公式
tasks:
  - 练习底层十字至 30 秒内对齐
  - 连续 5 次完整还原前两层
recommend:
  - a04-cross
  - a05-f2l-lbl""", """L1 进入真正的还原：把白色那一面（底层）和中间一层做好。

## 底层十字
白色朝上，拼出十字并让侧边颜色对齐同色中心。

## 底层角块 + 中层棱块
用"挖出来再塞回去"的思路处理角块；中层棱块记两个方向公式即可。

## 本关陷阱
- 只盯白色忘了侧边对齐 → 十字后还要返工
- 角块公式死记 → 理解"空位在哪、块往哪走"更重要

完成后进入 L2，挑战完整还原！"""))

levels.append(("L2", """title: L2 层先·完成首次还原
level: L2
order: 2
goal: 走完七步，完成人生第一次完整还原
target: 任意时间内完成六面单色还原
knowledge:
  - 顶层十字与翻色（小鱼公式）
  - 顶层角块 / 棱块归位
tasks:
  - 完整走完七步还原一次
  - 把这次成绩记入"我的档案"
recommend:
  - a03-lbl-overview
  - a06-OLL-cross
  - a07-PLL-lbl""", """这是最有成就感的一关——第一次把六面都还原！

## 七步回顾
十字 → 底层角 → 中层棱 → 顶层十字 → 翻色 → 角归位 → 棱归位。

## 关键公式
- 翻色"小鱼"：`R U R' U R U2 R'`
- 棱归位：`R U' R U R U R U' R' U' R2`

## 第一次之后
别急着背全公式。先稳定走完七步 10 次，再进入提速（L3）。

> 把你的第一次还原时间写进档案，那是你进步故事的开始。"""))

levels.append(("L3", """title: L3 提速入门：手法与稳定
level: L3
order: 3
goal: 优化手法、稳定底层十字，把层先法均速压到 1:30 内
target: 层先法均速（Ao5）< 90 秒，十字稳定 5 秒内
knowledge:
  - 食指/无名指拨 U 层
  - R/F 推拉手法
  - 计时与 Ao5 概念
tasks:
  - 用 cstimer 计时，记录 20 次成绩
  - 专练十字至 5 秒内
recommend:
  - a08-after-first
  - a09-fingertricks
  - a10-timer-review
  - c16-cstimer""", """会还原只是起点，提速才是乐趣所在。

## 手法优先
手快不等于拧得快。先练 `R U R' U'` 循环，让 U 层用食指/无名指"弹"出来。

## 用数据驱动
每次训练都用计时器，关注 Ao5（去头去尾平均）。目标：层先法 Ao5 < 90 秒。

## 常见瓶颈
- 十字慢 → 练习在观察阶段规划 4 条棱
- 顶层公式卡 → 慢做、分段练

完成后进入 L4，了解 CFOP。"""))

levels.append(("L4", """title: L4 CFOP·Cross 与 F2L
level: L4
order: 4
goal: 理解 CFOP 框架，掌握 Cross 与 F2L 原理，均速 < 1:00
target: 用 CFOP 思路（或混合）完成，Ao5 < 60 秒
knowledge:
  - CFOP 四步结构
  - Cross 观察规划
  - F2L 角棱配对插入
tasks:
  - 学习 F2L 直觉插对（不背公式版）
  - 把 Cross 压到 3 秒内
recommend:
  - a11-cfop-overview
  - a12-f2l
  - c01-cfop""", """CFOP 是速拧主流方法。L4 先吃下 Cross 与 F2L 两块硬骨头。

## Cross
与层先法十字类似，但要求**开拧前就规划好**四条棱落点，争取 3 秒内完成。

## F2L
把角块与棱块配对后一起插入。先凭直觉（不背公式），理解"配对—插入"的循环。

## 本关心态
F2L 初期可能比层先法还慢，这是正常的"转型期"。坚持 1–2 周，会明显变快。"""))

levels.append(("L5", """title: L5 CFOP·OLL 与 PLL
level: L5
order: 5
goal: 掌握 2-look OLL/PLL，均速 < 40 秒
target: Ao5 < 40 秒，顶层用 2-look 法稳定完成
knowledge:
  - 2-look OLL（十字+翻色，约13公式）
  - 2-look PLL（角+棱，约4公式）
tasks:
  - 背熟 2-look OLL/PLL
  - 把 PLL 练到肌肉记忆
recommend:
  - a13-oll-pll
  - c01-cfop""", """L5 补齐 CFOP 最后两段：OLL（朝向）与 PLL（排列）。

## 2-look 是捷径
不必一上来背 57+21 个公式。先学 2-look：
- OLL：先十字（6）再翻色（7）
- PLL：先角（2）再棱（2）

## 之后
当你 2-look 稳了，再逐步补全完整 OLL/PLL。L5 达标线：Ao5 < 40 秒。"""))

levels.append(("L6", """title: L6 专项突破：盲拧 / 异形 / 比赛
level: L6
order: 6
goal: 按兴趣选择专项深入，或备战首场比赛
target: 完成至少一个专项的入门，或报名一次 WCA 赛事
knowledge:
  - 盲拧 Old Pochmann 入门
  - 四阶降阶法 / 二阶 / 异形
  - WCA 参赛流程
tasks:
  - 任选：盲拧一次 / 还原四阶 / 报名比赛
  - 在档案记录专项成果
recommend:
  - a14-blind-other
  - a15-wca-rules
  - c05-wc2025
  - c24-blind
  - c22-4x4""", """恭喜走到专项阶段！这里没有统一终点，按兴趣选路。

## 可选方向
- **盲拧**：练记忆与编码（Old Pochmann）
- **高阶/异形**：四阶降阶、二阶、金字塔
- **比赛**：报名人生第一场 WCA 赛事
- **极致提速**：补全 OLL/PLL，冲击 sub-20 / sub-15

## 关于"训练营"的意义
到这里你已经拥有自学任何魔方玩法的能力。案例库里大量真实选手与赛事，正是你继续前进的燃料。

> 把你的专项目标写进档案，训练营会一直陪你记录成长。"""))

for n, fm, body in levels:
    write(LVL, n, fm, body)

# ============================ 案例 cases ============================
cases = []

cases.append(("c01-cfop", """title: 方法案例｜CFOP：最主流的速拧方法
category: 方法
source: https://www.speedsolving.com/wiki/index.php?title=CFOP_method
source_name: Speedsolving Wiki
order: 1
tags: [CFOP, 方法, 速拧]
summary: Cross-F2L-OLL-PLL 四步法，当今选手首选，平衡易学与上限。""", """CFOP 由 Jessica Fridrich 等人系统化推广，是当今最流行的速拧方法。

## 四步
1. **Cross**：底面拼十字
2. **F2L**：前两层一起做（角棱配对插入）
3. **OLL**：顶层翻色（57 公式，可先学 2-look）
4. **PLL**：顶层排列（21 公式，可先学 2-look）

## 优点
- 资料最多、社区最大
- 易从层先法过渡
- 上限极高，世界顶尖几乎都用它

## 缺点
- 完整 OLL/PLL 公式量大
- 依赖手法与观察

> 适合目标"既想快上手又想冲极限"的玩家。案例库另见 Roux、ZZ 对比。"""))

cases.append(("c02-roux", """title: 方法案例｜Roux：少步数、适合单手
category: 方法
source: https://www.speedsolving.com/wiki/index.php?title=Roux_method
source_name: Speedsolving Wiki
order: 2
tags: [Roux, 方法, 单手]
summary: 块构建思路，步数少、转体少，单手（OH）热门。""", """Roux 由 Gilles Roux 提出，采用"块构建（block building）"而非逐层。

## 思路
1. 左侧建 1×2×3 块（CMLL 处理角）
2. 右侧建对称块
3. 最后用 LSE（最后六棱）收尾

## 优点
- 步数通常比 CFOP 少
- 转体极少，非常适合单手（OH）
- 思考密度高、机械重复少

## 缺点
- 入门比 CFOP 抽象
- 资料相对少

> 不少顶尖单手选手使用 Roux。想走 OH 路线的可重点了解。"""))

cases.append(("c03-zz", """title: 方法案例｜ZZ：转体最少、利于单手
category: 方法
source: https://www.speedsolving.com/wiki/index.php?title=ZZ_method
source_name: Speedsolving Wiki
order: 3
tags: [ZZ, 方法, 单手]
summary: 先定向所有棱，全程无需转体，单手友好。""", """ZZ（Zbigniew Zborowski）方法以"先定向棱块"著称。

## 思路
1. **EOLine**：定向所有棱 + 一条中线
2. **F2L**：在已定向基础上插入（无需转体）
3. **LL**：朝向+排列

## 优点
- 后半程几乎不转体，单手极佳
- 部分情况可触发 ZBLL 等高级跳过

## 缺点
- EOLine 前期学习曲线陡
- 整体生态比 CFOP 小

> 与 Roux 同属"少转体"流派，适合追求极致手感的玩家。"""))

cases.append(("c04-lbl", """title: 方法案例｜层先法（LBL）：新手的起点
category: 方法
source: https://en.wikipedia.org/wiki/Optimal_solutions_for_the_Rubik%27s_Cube
source_name: Wikipedia
order: 4
tags: [层先法, LBL, 入门]
summary: 七步逐层还原，公式少、直观，是所有进阶方法的基础。""", """层先法（Layer By Layer）把还原拆成七步：十字、底层角、中层棱、顶层十字、翻色、角归位、棱归位。

## 为什么重要
- 几乎每个教程都从它讲起
- 公式少、逻辑直观
- 是 CFOP 的"地基"——F2L 本质就是层先法前两层的高效版

## 局限
步数多、思考断点多，均速很难突破 30 秒，因此速拧选手会转向 CFOP/Roux/ZZ。

> 训练营 L0–L2 关卡即基于层先法设计。"""))

cases.append(("c05-wc2025", """title: 比赛案例｜WCA 2025 世界锦标赛（西雅图）
category: 比赛
source: https://www.worldcubeassociation.org/competitions/WC2025
source_name: World Cube Association
order: 5
tags: [WCA, 世锦赛, 2025]
summary: 第 12 届 WCA 世锦赛，2025 年 7 月 3–6 日于美国西雅图举行。""", """Rubik's WCA World Championship 2025 是历史上第 12 届魔方世锦赛，由 CubingUSA 承办。

## 基本信息
- 时间：2025 年 7 月 3–6 日
- 地点：美国西雅图会议中心（Seattle Convention Center）
- 规模：来自全球数百名选手同场竞技

## 意义
世锦赛是 WCA 体系最高级别赛事，四年一度（近年节奏调整），云集各项目世界顶尖。

> 想感受顶级氛围，案例库"王艺衡夺冠 2025"详述了三阶结果。"""))

cases.append(("c06-yiheng-win", """title: 比赛案例｜王艺衡夺冠 2025 世锦赛三阶
category: 比赛
source: https://www.worldcubeassociation.org/competitions/WC2025/results/podiums
source_name: WCA 官方成绩
order: 6
tags: [王艺衡, 世锦赛, 三阶, 2025]
summary: 王艺衡（Yiheng Wang）以均速 4.23 秒夺得 2025 世锦赛三阶冠军。""", """在 2025 西雅图世锦赛三阶项目中，中国选手 **王艺衡（Yiheng Wang）** 夺冠。

## 领奖台（三阶）
- 🥇 王艺衡（Yiheng Wang）：平均 **4.23 秒**
- 🥈 耿暄一（Geng Xuanyi）：平均 4.49 秒
- 🥉 Tymon Kolasiński（波兰）：平均 4.98 秒

## 看点
中国选手包揽冠亚军，展现三阶项目的强势统治力；Tymon 作为长期顶尖选手再度登台。

> 数据来自 WCA 官方 podiums 页面，权威可查。人物详情见"王艺衡"案例。"""))

cases.append(("c07-wca-events", """title: 比赛案例｜WCA 赛事项目一览（17 项）
category: 比赛
source: https://www.worldcubeassociation.org/regulations/
source_name: WCA Regulations
order: 7
tags: [WCA, 项目, 规则]
summary: WCA 官方赛事涵盖三阶、盲拧、最少步、异形等共 17 个项目。""", """WCA 认可的官方比赛项目非常丰富，主要包括：

## 标准阶数
三阶、二阶、四阶、五阶、六阶、七阶

## 特殊玩法
- 三阶单手（OH）
- 三阶脚拧（Fewest Moves 之外）
- 三阶盲拧、三阶多盲
- 三阶最少步（FMC）
- 魔表（Clock）
- 金字塔（Pyraminx）
- 斜转（Skewb）
- 五阶盲拧等

合计约 **17 个项目**，满足不同兴趣的玩家。

> 参赛前可在 WCA 官网查本地赛事日程，免费注册。"""))

cases.append(("c08-wr-evolution", """title: 比赛案例｜世界纪录演进：从 22 秒到 3 秒
category: 比赛
source: https://www.cubinghistory.com/World%20Records/WorldRecordAverages2H
source_name: Cubing History
order: 8
tags: [世界纪录, 历史, 三阶]
summary: 三阶单次纪录从 1982 年的 22 秒一路刷新到 3 秒级别。""", """三阶速拧世界纪录的演进，是魔方运动发展的缩影。

## 大致脉络
- 1982 年首届世锦赛：单次约 22 秒
- 2000 年代：Fridrich 方法普及，纪录跌破 10 秒
- 2010 年代：器械（磁力魔方）+ 手法飞跃，纪录进入 5–6 秒
- 2020 年代：新生代选手将单次压到 **3 秒级**、平均压到 **4 秒级**

## 启示
纪录的刷新 = 方法成熟 + 器材进步 + 训练科学化。普通人也能从这套规律中受益。

> 具体当前纪录请以 WCA 官方 rankings 为准，纪录持续更新。"""))

cases.append(("c09-yiheng", """title: 人物案例｜王艺衡（Yiheng Wang）
category: 人物
source: https://www.worldcubeassociation.org/persons/2019WANY36
source_name: WCA 个人页
order: 9
tags: [王艺衡, 中国, 三阶]
summary: 中国天才选手，多次打破三阶世界纪录，2025 世锦赛三阶冠军。""", """**王艺衡（Yiheng Wang）**，WCA ID `2019WANY36`，中国速拧选手，被誉为天才型新生代。

## 主要成就（据公开资料）
- 2025 西雅图世锦赛 **三阶冠军**（平均 4.23 秒）
- 早年即以未成年身份多次刷新三阶世界纪录
- 在二阶、三阶多个项目长期位居世界前列

## 训练启示
年少成名背后是高频、专注的训练与极强稳定性。对新手而言，"稳定比偶然快一次更重要"。

> 数据请以 WCA 官方个人页最新成绩为准。"""))

cases.append(("c10-maxpark", """title: 人物案例｜Max Park
category: 人物
source: https://www.guinnessworldrecords.com/news/2023/6/max-park-makes-history-by-solving-cube-in-fastest-time-ever-752905
source_name: Guinness World Records
order: 10
tags: [Max Park, 美国, 三阶, 纪录]
summary: 美国选手，曾创造三阶单次 3.13 秒的世界纪录。""", """**Max Park** 是美国顶尖速拧选手，长期位居世界前列。

## 主要成就（据公开资料）
- 曾创造三阶单次 **3.13 秒** 的世界纪录（2023，吉尼斯认证）
- 在多个阶数（三阶、四阶、五阶等）均有世界级表现
- 与自闭症谱系相伴成长，其故事激励大量玩家

## 训练启示
极致成绩来自海量重复与稳定心态。他的比赛录像非常适合学习"冷静、匀速"的节奏。

> 最新纪录请以 WCA 官方 rankings 为准。"""))

cases.append(("c11-tymon", """title: 人物案例｜Tymon Kolasiński
category: 人物
source: https://www.worldcubeassociation.org/results/rankings/333/average
source_name: WCA Rankings
order: 11
tags: [Tymon, 波兰, 三阶]
summary: 波兰选手，长期世界顶尖，2025 世锦赛三阶季军。""", """**Tymon Kolasiński** 是波兰代表性速拧选手，长期稳居世界最前列。

## 主要成就（据公开资料）
- 曾与他人并列保持三阶平均世界纪录（4.86 秒）
- 多次在世锦赛、欧锦赛登上领奖台
- 2025 西雅图世锦赛三阶 **季军**（平均 4.98 秒）

## 训练启示
他与王艺衡、Max Park 构成当代三阶"第一梯队"，互相刷新纪录推动项目进步。

> 数据以 WCA 官方 rankings 为准。"""))

cases.append(("c12-feliks", """title: 人物案例｜Feliks Zemdegs
category: 人物
source: https://www.worldcubeassociation.org/results/rankings/333/average
source_name: WCA Rankings
order: 12
tags: [Feliks, 澳大利亚, 传奇]
summary: 澳大利亚传奇选手，开创多个世界纪录时代，被誉为"魔方之神"。""", """**Feliks Zemdegs** 来自澳大利亚，是魔方运动史上最具影响力的人物之一。

## 主要成就（据公开资料）
- 2010 年代长期垄断三阶单次与平均世界纪录
- 多次世锦赛冠军，推动速拧进入"5 秒时代"
- 以稳定、干净的解法风格著称

## 训练启示
他把"记录成绩、分析瓶颈、针对性练习"做到极致，是科学训练的代表。

> 即使后辈不断刷新他的纪录，其方法论仍值得所有玩家学习。"""))

cases.append(("c13-gengxuanyi", """title: 人物案例｜耿暄一（Geng Xuanyi）
category: 人物
source: https://www.worldcubeassociation.org/competitions/WC2025/results/podiums
source_name: WCA 官方成绩
order: 13
tags: [耿暄一, 中国, 三阶]
summary: 中国选手，2025 世锦赛三阶亚军（平均 4.49 秒）。""", """**耿暄一（Geng Xuanyi）** 是中国新生代三阶选手。

## 主要成就（据公开资料）
- 2025 西雅图世锦赛三阶 **亚军**（平均 4.49 秒）
- 与王艺衡一同展现中国三阶的统治力

## 训练启示
中国选手在青训与高频对抗中快速成长，说明"环境 + 大量实战"是提速捷径。

> 数据以 WCA 官方 podiums 为准。"""))

cases.append(("c14-training-rhythm", """title: 训练案例｜职业选手的训练节奏
category: 训练
source: https://www.speedsolving.com/threads/method-pros-and-cons-cfop-vs-roux-vs-zz.75425/
source_name: Speedsolving Forum
order: 14
tags: [训练, 节奏, 方法]
summary: 顶尖选手靠高频、分段、数据化的训练维持状态。""", """观察职业/顶尖选手的训练，共性很明显：

## 节奏特征
- **高频短时**：每天多次、每次 30–60 分钟，优于一次性猛练
- **分段专项**：今天专练 Cross，明天专练某组 PLL
- **数据驱动**：用 cstimer 记录 Ao5/Ao12，跟踪趋势
- **刻意慢练**：新公式先慢到精准，再提速

## 对普通玩家的建议
不必模仿强度，只学结构：固定频率 + 专项突破 + 记录复盘。

> 配合"计时、复盘与目标设定"文章效果更佳。"""))

cases.append(("c15-mindset", """title: 训练案例｜比赛心态与抗压
category: 训练
source: https://www.cubzor.com/news/yiheng-wang-crowned-3x3x3-world-champion-at-rubiks-wca-world-championship-2025
source_name: Cubzor News
order: 15
tags: [心态, 比赛, 抗压]
summary: 大赛拼的不只是手速，更是观察规划与情绪稳定。""", """顶级对决中，技术差距极小，**心态**往往决定胜负。

## 常见压力源
- 观察阶段慌乱，开拧即错
- 一次失误后连锁崩盘
- 过度关注对手成绩

## 应对
- 固定赛前流程（深呼吸、检查魔方、规划 Cross）
- 失误后立刻归零，专注下一次
- 平时模拟比赛节奏训练

> 王艺衡等选手在大赛中的稳定发挥，正是长期心理训练的结果。"""))

cases.append(("c16-cstimer", """title: 训练案例｜用 cstimer 计时与统计
category: 训练
source: https://cstimer.net/
source_name: cstimer.net
order: 16
tags: [计时, 工具, 统计]
summary: 免费在线计时器，支持打乱、Ao5/Ao12、图表分析。""", """[cstimer.net](https://cstimer.net/) 是速拧圈最常用的免费在线计时器。

## 核心功能
- 标准 WCA 打乱公式生成
- 实时计时，自动计算 Ao5 / Ao12 / 最佳
- 成绩趋势图、按方法分组
- 可导入/导出成绩，长期追踪

## 使用建议
- 每次训练都开计时，不"裸拧"
- 关注 Ao12（比单次更真实反映水平）
- 用标签区分 LBL / CFOP，看方法进步

> 训练营 L3 关卡要求用计时器记录 20 次成绩，cstimer 是最佳选择。"""))

cases.append(("c17-injury", """title: 训练案例｜手法练习与伤病预防
category: 训练
source: https://speedcubing.org/pages/guide-to-choosing-a-speedsolving-method
source_name: SpeedCubing.org
order: 17
tags: [手法, 健康, 伤病]
summary: 高频训练易伤手腕/手指，正确手法与休息缺一不可。""", """速拧是低强度运动，但每天上千次转动仍可能劳损。

## 风险点
- 手腕长期扭转 → 腱鞘炎
- 指甲/指腹磨损
- 长期低头久坐

## 预防
- 学正确手法，减少手腕代偿
- 每 20–30 分钟休息、拉伸手指手腕
- 魔方张力/磁力调舒适，别拧太紧
- 手感痛就停，避免慢性损伤

> 手法文章（a09）里的"弹而非拧"也是护手关键。"""))

cases.append(("c18-magnetic", """title: 器材案例｜磁力魔方原理
category: 器材
source: https://www.thecubicle.com/en-global/pages/cuber-profile/wang-yiheng
source_name: TheCubicle
order: 18
tags: [磁力, 器材, 原理]
summary: 块内磁片提供定位反馈，提升稳定与容错。""", """现代速拧魔方几乎标配**磁感（Magnetic）**。

## 原理
在棱块与角块内嵌入小磁片，转动到位时磁片相吸，给出清晰的"咔哒"定位感。

## 好处
- 落块更稳，减少 overshoot（转过头）
- 高速下容错更高
- 手感更"扎实"

## 磁感等级
从弱磁到强磁可选，弱磁灵活、强磁稳定，按手感与阶段选择。

> 选购指南（a16）与"魔方调校"案例可进一步了解。"""))

cases.append(("c19-brands", """title: 器材案例｜主流品牌对比 GAN / MoYu / QiYi
category: 器材
source: https://www.thecubicle.com/
source_name: TheCubicle
order: 19
tags: [品牌, GAN, MoYu, QiYi]
summary: 三大主流品牌定位不同：高端、性价比、入门友好。""", """速拧魔方三大主流品牌各有特点：

## GAN
- 定位：高端旗舰
- 特点：手感顺滑、做工精、价格高
- 适合：追求极致手感、预算充足

## MoYu（魔域）
- 定位：高性价比
- 特点：型号多、RS 系列亲民、竞赛级也很强
- 适合：大多数玩家，从入门到进阶

## QiYi（奇艺）
- 定位：入门友好
- 特点：价格亲民、异形与特殊玩法丰富
- 适合：新手与异形爱好者

> 新手第一颗选 50–80 元带磁三阶即可，不必一步到位。"""))

cases.append(("c20-tune", """title: 器材案例｜如何调校魔方（张力/润滑）
category: 器材
source: https://www.thecubicle.com/
source_name: TheCubicle
order: 20
tags: [调校, 润滑, 器材]
summary: 通过张力调节与润滑，让魔方贴合个人手感。""", """同一颗魔方，调校后手感天差地别。

## 张力（Tension）
- 调松：转动轻快、易飞棱
- 调紧：稳定、略重
- 找到"不卡又不飘"的甜区

## 润滑（Lube）
- 快油：降低阻力、提速
- 重油/硅脂：增加稳定与阻尼
- 少量多次，别过量

## 维护
定期清理灰尘、重新上油，魔方寿命与手感都能延长。

> 新手先按出厂设置练，稳定后再微调。"""))

cases.append(("c21-2x2", """title: 专题案例｜二阶魔方入门
category: 专题
source: https://www.speedsolving.com/wiki/index.php?title=2x2x2
source_name: Speedsolving Wiki
order: 21
tags: [二阶, 入门, 异形]
summary: 二阶无中心无棱，本质只解角块，入门极快。""", """二阶（2×2×2）只有 8 个角块，没有中心和棱。

## 还原思路
- 先做一个小面（2×2 角块组）
- 用一层法（类似层先法第一层）处理剩余角块
- 常用公式少，几分钟可学会

## 与三阶关系
二阶是三阶的"角块部分"，理解它有助于后续学盲拧与高阶。

> 王艺衡等选手在二阶也极具统治力（平均可低至 0.8x 秒级）。"""))

cases.append(("c22-4x4", """title: 专题案例｜四阶魔方入门（降阶法）
category: 专题
source: https://www.speedsolving.com/wiki/index.php?title=4x4x4
source_name: Speedsolving Wiki
order: 22
tags: [四阶, 降阶法, 高阶]
summary: 四阶用降阶法：拼中心、拼棱，再当三阶解。""", """四阶（4×4×4）没有固定中心，需先"造中心"。

## 降阶法（Redux）三步
1. **拼中心**：每组同色 4 块聚成中心面
2. **拼棱**：把同色棱块配对成"三阶棱"
3. **当三阶解**：之后按三阶方法还原

## 特有难点
- **奇偶校验（parity）**：四阶会出现三阶没有的特殊情况，需额外公式
- 中心块方向无所谓，但需配对正确

> 掌握了三阶，四阶是自然的下一步。"""))

cases.append(("c23-wca-others", """title: 专题案例｜金字塔与斜转等异形
category: 专题
source: https://www.worldcubeassociation.org/regulations/
source_name: WCA Regulations
order: 23
tags: [异形, 金字塔, 斜转]
summary: Pyraminx 与 Skewb 转动逻辑不同，入门快、观赏性强。""", """除阶数魔方外，WCA 还有多种异形：

## 金字塔（Pyraminx）
- 四面体结构，转动围绕顶点
- 无中心块概念，解法极快
- 新手常 1 小时内学会

## 斜转（Skewb）
- 沿对角轴转动，块大、容错高
- 解法与三阶完全不同但直观
- 手感"爽快"，适合放松练

## 其他
魔表（Clock）、Square-1 等也各有独特机制。

> 想换口味、找回新鲜感，异形是最佳调剂。"""))

cases.append(("c24-blind", """title: 专题案例｜盲拧入门（Old Pochmann）
category: 专题
source: https://www.speedsolving.com/wiki/index.php?title=Blindfolded
source_name: Speedsolving Wiki
order: 24
tags: [盲拧, Old Pochmann, 专题]
summary: 用记忆+编码一次完成，Old Pochmann 是最经典入门法。""", """盲拧（Blindfolded）靠记忆与编码，蒙眼一次性完成。

## Old Pochmann 思路
- 仅用 R 和 L 的换棱算法（T 排列）处理棱块
- 角块用另一组算法处理
- 先记忆"哪块该去哪"，再按顺序执行

## 训练路径
1. 先练"记忆编码"（给每个块编号）
2. 单独练换棱/换角公式
3. 合起来做短 scramble 盲拧

## 价值
盲拧极大锻炼空间记忆，是魔方里最"烧脑"也最酷的玩法之一。

> 建议先稳定三阶 sub-30 再入门，否则容易受挫。"""))

cases.append(("c25-fmc", """title: 专题案例｜FMC 最少步数简介
category: 专题
source: https://www.worldcubeassociation.org/regulations/
source_name: WCA Regulations
order: 25
tags: [FMC, 最少步, 专题]
summary: 比谁用最少步数还原，是脑力而非手速的较量。""", """FMC（Fewest Moves Challenge）比的是**用最少的步数**还原。

## 规则
- 给定打乱，限时（通常 1 小时）求最短解法
- 选手提交自己的解法步数，越少越好
- 世界顶尖可做到 20 步左右

## 常用思路
- 用三阶"上帝之数 20"作为理论上限
- 结合 NISS（逆序插入）、块构建等技巧

## 意义
FMC 锻炼对魔方结构的深层理解，反过来提升速拧的"观察规划"能力。

> 适合喜欢解谜、不追求手速的玩家。"""))

cases.append(("c26-glossary", """title: 专题案例｜速拧术语表
category: 专题
source: https://www.speedsolving.com/wiki/
source_name: Speedsolving Wiki
order: 26
tags: [术语, 词典, 专题]
summary: sub、Ao5、PB、F2L……一张表读懂圈内黑话。""", """速拧圈常用术语速查：

| 术语 | 含义 |
|------|------|
| **sub-X** | 成绩低于 X 秒，如 sub-20 即 <20 秒 |
| **PB** | Personal Best 个人最好成绩 |
| **Ao5 / Ao12** | 最近 5 / 12 次去头去尾平均 |
| **LBL** | 层先法 Layer By Layer |
| **CFOP** | Cross-F2L-OLL-PLL |
| **F2L** | 前两层 First Two Layers |
| **OLL / PLL** | 顶层朝向 / 排列 |
| **OH** | One-Handed 单手 |
| **BLD** | Blindfolded 盲拧 |
| **FMC** | 最少步数 Fewest Moves |
| **Scramble** | 打乱公式 |
| **Parity** | 四阶等出现的特殊奇偶情况 |

> 看不懂的词，先记下来，训练中会反复遇到。"""))

for n, fm, body in cases:
    write(CAS, n, fm, body)

print("内容生成完成：")
print(f"  文章 articles: {len(articles)}")
print(f"  关卡 levels:   {len(levels)}")
print(f"  案例 cases:    {len(cases)}")
