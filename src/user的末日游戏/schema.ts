const Rarity = z.enum(['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']);

/** 精液质量：E~SSS 基准，允许带 ± 后缀（如 A-、A+）表示档内浮动；非法输入归一化为 C */
const SemenQuality = z
  .string()
  .transform(v => {
    const matched = String(v)
      .trim()
      .toUpperCase()
      .match(/^(SSS|SS|S|A|B|C|D|E)([+-]?)$/);
    return matched ? matched[1] + matched[2] : 'C';
  })
  .prefault('C');

const StatPair = z
  .object({
    当前: z.coerce.number().transform(v => _.clamp(v, 0, 9999)).prefault(10),
    上限: z.coerce.number().transform(v => _.clamp(v, 0, 9999)).prefault(30),
  })
  .prefault({});

/** 主角三维：initvar 不写死「当前」，仅保留上限基准，首次开局盘点时由 Patch 写入 */
const PlayerStatPair = z
  .object({
    当前: z.coerce.number().transform(v => _.clamp(v, 0, 9999)).optional(),
    上限: z.coerce.number().transform(v => _.clamp(v, 1, 9999)).prefault(100),
  })
  .prefault({ 上限: 100 });

const Clothing = z
  .object({
    上衣: z.string().prefault(''),
    下装: z.string().prefault(''),
    外套: z.string().prefault(''),
    帽子: z.string().prefault(''),
    内衣裤: z.string().prefault(''),
    袜子: z.string().prefault(''),
    鞋子: z.string().prefault(''),
    饰品: z.string().prefault(''),
    手持物: z.string().prefault(''),
  })
  .prefault({});

const HuntActiveEntry = z
  .object({
    姓名: z.string().prefault(''),
    uid: z.string().prefault(''),
    昵称: z.string().prefault(''),
    种族: z.string().prefault('人类'),
    污染值: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
    身份: z.string().prefault(''),
    年龄: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(20),
    精液质量: SemenQuality,
    天赋: z.string().prefault(''),
    力量: StatPair,
    体质: StatPair,
    敏捷: StatPair,
    沦陷度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
    当前位置: z.string().prefault(''),
    当前状态: z.string().prefault(''),
    预计产出SP: z.coerce.number().transform(v => _.clamp(v, 0, 999999999)).prefault(0),
    衣着: Clothing,
  })
  .prefault({});

const SlaveEntry = z
  .object({
    姓名: z.string().prefault(''),
    uid: z.string().prefault(''),
    昵称: z.string().prefault(''),
    种族: z.string().prefault('人类'),
    污染值: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
    身份: z.string().prefault(''),
    年龄: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(20),
    精液质量: SemenQuality,
    天赋: z.string().prefault(''),
    力量: StatPair,
    体质: StatPair,
    敏捷: StatPair,
    当前位置: z.string().prefault(''),
    当前状态或用途: z.string().prefault(''),
    预计产出SP: z.coerce.number().transform(v => _.clamp(v, 0, 999999999)).prefault(0),
    衣着: Clothing,
  })
  .prefault({});

const LeaderboardRankEntry = z
  .object({
    排名: z.coerce.number().transform(v => _.clamp(v, 1, 10)).prefault(1),
    昵称: z.string().prefault('匿名'),
  })
  .prefault({});

const KillLeaderboardEntry = z
  .object({
    排名: z.coerce.number().transform(v => _.clamp(v, 1, 10)).prefault(1),
    昵称: z.string().prefault('匿名'),
    杀怪数量: z.coerce.number().transform(v => _.clamp(v, 0, 999999999)).prefault(0),
  })
  .prefault({});

const WealthLeaderboardEntry = z
  .object({
    排名: z.coerce.number().transform(v => _.clamp(v, 1, 10)).prefault(1),
    昵称: z.string().prefault('匿名'),
    SP: z.coerce.number().transform(v => _.clamp(v, 0, 999999999)).prefault(0),
  })
  .prefault({});

const Top10KillBoard = z.record(z.string(), KillLeaderboardEntry).prefault({});
const Top10WealthBoard = z.record(z.string(), WealthLeaderboardEntry).prefault({});
const Top10OverallBoard = z.record(z.string(), LeaderboardRankEntry).prefault({});

export const Schema = z
  .object({
    世界: z
      .object({
        日期: z.string().prefault(''),
        地点: z.string().prefault(''),
        天气: z.string().prefault(''),
        生存天数: z.coerce.number().transform(v => _.clamp(v, 0, 99999)).prefault(1),
        季节: z.string().prefault(''),
        当前赛季: z.string().prefault(''),
        赛季预计持续时间: z.string().prefault(''),
      })
      .prefault({}),
    主角: z
      .object({
        姓名: z.string().prefault('幸存者'),
        uid: z.string().prefault('X-00010086'),
        种族: z.string().prefault('人类'),
        昵称: z.string().prefault('[未命名]'),
        梦魇欲魔: z
          .object({
            名称: z.enum(['梦魇欲魔']).prefault('梦魇欲魔'),
            阶段: z.enum(['一', '二', '三', '四']).prefault('一'),
            能力列表: z
              .record(z.enum(['一', '二', '三', '四']), z.string())
              .prefault({ 一: '', 二: '', 三: '', 四: '' }),
          })
          .prefault({}),
        sp: z.coerce.number().transform(v => _.clamp(v, 0, 999999999)).prefault(0),
        污染值: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
        饱食度: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(100),
        力量: PlayerStatPair,
        体质: PlayerStatPair,
        敏捷: PlayerStatPair,
        角色总评: Rarity.prefault('E'),
        角色总评评语: z.string().prefault(''),
        衣着: Clothing,
      })
      .prefault({}),
    背包: z
      .object({
        已用格子: z.coerce.number().transform(v => _.clamp(v, 0, 9999)).prefault(0),
        格子上限: z.coerce.number().transform(v => _.clamp(v, 1, 9999)).prefault(30),
      })
      .prefault({}),
    物品栏: z
      .record(
        z.string(),
        z.object({
          名称: z.string().prefault(''),
          数量: z.coerce.number().transform(v => _.clamp(v, 0, 999999)).prefault(1),
          最大堆叠: z.coerce.number().transform(v => _.clamp(v, 1, 999999)).prefault(99),
          描述: z.string().prefault(''),
          获取来源: z.string().prefault(''),
          稀有度: Rarity.prefault('D'),
        }),
      )
      .prefault({}),
    狩猎名单: z
      .object({
        进行中: z.record(z.string(), HuntActiveEntry),
        已奴隶: z.record(z.string(), SlaveEntry),
      })
      .prefault({ 进行中: {}, 已奴隶: {} }),
    玩家论坛: z
      .object({
        帖子: z.record(
          z.string(),
          z.object({
            主题: z.string().prefault(''),
            发帖人: z.string().prefault(''),
            内容: z.string().prefault(''),
            发帖时间: z.string().prefault(''),
          }),
        ),
        私信: z.record(
          z.string(),
          z.object({
            发送人: z.string().prefault(''),
            内容: z.string().prefault(''),
            发送时间: z.string().prefault(''),
          }),
        ),
      })
      .prefault({ 帖子: {}, 私信: {} }),
    交易行: z
      .object({
        系统商城: z.record(
          z.string(),
          z.object({
            名称: z.string().prefault(''),
            价格: z.coerce.number().transform(v => _.clamp(v, 0, 999999999)).prefault(0),
            描述: z.string().prefault(''),
            备注: z.string().prefault(''),
          }),
        ),
        玩家交易: z.record(
          z.string(),
          z.object({
            物品名称: z.string().prefault(''),
            描述: z.string().prefault(''),
            售卖人: z.string().prefault(''),
            上架时间: z.string().prefault(''),
            价格: z.coerce.number().transform(v => _.clamp(v, 0, 999999999)).prefault(0),
          }),
        ),
        /** 脚本维护：与 世界.生存天数 对齐，LLM 勿 Patch */
        _商城刷新于天数: z.coerce.number().transform(v => _.clamp(v, 0, 99999)).prefault(0),
      })
      .prefault({ 系统商城: {}, 玩家交易: {}, _商城刷新于天数: 0 }),
    副本列表: z
      .record(
        z.string(),
        z.object({
          副本名称: z.string().prefault(''),
          副本内容: z.string().prefault(''),
          副本难度: z.string().prefault(''),
          副本地点: z.string().prefault(''),
          副本奖励: z.string().prefault(''),
        }),
      )
      .prefault({}),
    排行榜: z
      .object({
        杀戮榜: z
          .object({
            地区: Top10KillBoard,
            全球: Top10KillBoard,
          })
          .prefault({ 地区: {}, 全球: {} }),
        财富榜: z
          .object({
            地区: Top10WealthBoard,
            全球: Top10WealthBoard,
          })
          .prefault({ 地区: {}, 全球: {} }),
        总榜: Top10OverallBoard,
      })
      .prefault({ 杀戮榜: { 地区: {}, 全球: {} }, 财富榜: { 地区: {}, 全球: {} }, 总榜: {} }),
  })
  .prefault({});

export type Schema = z.output<typeof Schema>;
