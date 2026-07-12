const 人物衣着 = z
  .partialRecord(
    z.enum(['头部', '上衣', '外套', '下装', '内衣裤', '袜子', '鞋子', '手持物']),
    z.string(),
  )
  .transform(data => ({ ...data }))
  .prefault({});

/** MVU 解析后 record 可能被冻结，insert 新键前须得到可扩展的普通对象 */
function extensibleRecord(key: z.ZodString, value: z.ZodType) {
  return z.record(key, value).transform(data => ({ ...data })).prefault({});
}

const 人物条目 = z
  .object({
    姓名: z.string().prefault(''),
    与user关系: z.string().prefault(''),
    人物状态: z.string().prefault(''),
    人物衣着,
  })
  .prefault({});

const 超能力条目 = z
  .object({
    名称: z.string().prefault(''),
    效果: z.string().prefault(''),
  })
  .prefault({});

const 超能力槽 = z
  .partialRecord(z.enum(['槽位一', '槽位二', '槽位三']), 超能力条目)
  .transform(data => ({ ...data }))
  .prefault({});

const 主角条目 = z
  .object({
    姓名: z.string().prefault(''),
    人物状态: z.string().prefault(''),
    人物衣着,
    超能力槽,
  })
  .prefault({});

const 视频条目 = z
  .object({
    视频标题: z.string().prefault(''),
    视频简介: z.string().prefault(''),
    时长: z.string().prefault(''),
    发布时间: z.string().prefault(''),
    播放量: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
    留言: extensibleRecord(
        z.string().describe('留言id'),
        z
          .object({
            留言用户: z.string().prefault(''),
            留言内容: z.string().prefault(''),
            留言时间: z.string().prefault(''),
            user的回复: z.string().prefault(''),
            回复时间: z.string().prefault(''),
          })
          .prefault({}),
      ),
    打赏: extensibleRecord(
        z.string().describe('打赏id'),
        z
          .object({
            打赏用户: z.string().prefault(''),
            打赏数额: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
          })
          .prefault({}),
      ),
    视频内容: z
      .object({
        参演人员: extensibleRecord(z.string().describe('参演者id'), z.string().prefault('')),
        演出地点: z.string().prefault(''),
        视频内容: z.string().prefault(''),
        重要台词: extensibleRecord(z.string().describe('台词id'), z.string().prefault('')),
      })
      .prefault({}),
  })
  .prefault({});

export const Schema = z
  .object({
    世界信息: z
      .object({
        日期: z.string().prefault(''),
        时间: z.string().prefault(''),
        地点: z.string().prefault(''),
        天气: z.string().prefault(''),
        主角: 主角条目,
        人物: extensibleRecord(z.string().describe('人物id'), 人物条目),
        环境重要物品: extensibleRecord(
          z.string().describe('物品id'),
          z
            .object({
              名称: z.string().prefault(''),
              物品位置: z.string().prefault(''),
              物品状态: z.string().prefault(''),
            })
            .prefault({}),
        ),
        财富: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
        资产: extensibleRecord(
          z.string().describe('资产id'),
          z
            .object({
              名称: z.string().prefault(''),
              类型: z.string().prefault(''),
              状态: z.string().prefault(''),
              备注: z.string().prefault(''),
            })
            .prefault({}),
        ),
      })
      .prefault({}),
    空间信息: z
      .object({
        账号名称: z.string().prefault('纯情小猫猫'),
        个性签名: z.string().prefault('暂无个性签名'),
        当前装扮: z
          .string()
          .prefault('初始空间，空白主页，仅有默认头像和浅色背景，氛围干净但缺少辨识度。'),
        人气值: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
        粉丝量: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
        视频数量: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
        是否正在直播: z.enum(['是', '否']).prefault('否'),
        总打赏: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
      })
      .prefault({}),
    视频信息: extensibleRecord(z.string().describe('视频id'), 视频条目),
  });
export type Schema = z.output<typeof Schema>;
