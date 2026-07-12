/** 环境重要物品只保留现实可触摸实体，剔除误写入的系统 UI / 虚拟界面 */
const 非实体关键词 = /系统|面板|浮窗|弹窗|状态栏|任务|培养|网黄|HUD|界面|虚拟|悬浮|提示框|UI/i;
const 非实体位置 = /眼前|悬浮|虚拟|界面内|视野中|脑内|意识/i;

export function filterNonPhysicalEnvItems(stat_data: Record<string, unknown>) {
  const 物品表 = _.get(stat_data, '世界信息.环境重要物品');
  if (!_.isPlainObject(物品表)) return;

  const filtered = _.pickBy(物品表 as Record<string, unknown>, item => {
    if (!_.isPlainObject(item)) return false;
    const { 名称 = '', 物品位置 = '', 物品状态 = '' } = item as Record<string, string>;
    const text = `${名称}${物品位置}${物品状态}`;
    return !非实体关键词.test(text) && !非实体位置.test(物品位置);
  });

  if (!_.isEqual(filtered, 物品表)) {
    _.set(stat_data, '世界信息.环境重要物品', filtered);
  }
}

/** 地点变化时移除旧场景物品，保留本回合新 insert 的条目 */
export function clearEnvItemsOnLocationChange(
  stat_data: Record<string, unknown>,
  stat_data_before: Record<string, unknown>,
) {
  const oldLoc = _.get(stat_data_before, '世界信息.地点');
  const newLoc = _.get(stat_data, '世界信息.地点');
  if (!newLoc || oldLoc === newLoc) return;

  const oldItems = _.get(stat_data_before, '世界信息.环境重要物品');
  const newItems = _.get(stat_data, '世界信息.环境重要物品');
  if (!_.isPlainObject(newItems)) return;

  const oldIds = _.isPlainObject(oldItems) ? Object.keys(oldItems as object) : [];
  const kept = _.pickBy(newItems as Record<string, unknown>, (_, id) => !oldIds.includes(id));

  if (!_.isEqual(kept, newItems)) {
    _.set(stat_data, '世界信息.环境重要物品', kept);
  }
}
