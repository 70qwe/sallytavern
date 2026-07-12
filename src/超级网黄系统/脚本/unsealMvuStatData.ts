/** 深度解冻 MVU/zod 冻结的 record，使 insert 新键不再报 non-extensible */
export function unsealMvuStatData(stat_data: Record<string, unknown>) {
  const thaw = (value: unknown): unknown => {
    if (_.isPlainObject(value)) {
      const out: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(value)) {
        out[key] = thaw(child);
      }
      return out;
    }
    if (_.isArray(value)) {
      return value.map(thaw);
    }
    return value;
  };

  const thawed = thaw(stat_data) as Record<string, unknown>;
  for (const key of Object.keys(stat_data)) {
    delete stat_data[key];
  }
  Object.assign(stat_data, thawed);
}
