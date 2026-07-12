<template>
  <div class="reality">
    <div class="clock-row">
      <div class="clock-left">
        <div class="clock-time" :class="{ blank: isEmpty(world.时间) }">{{ blankOr(world.时间, '现在时间') }}</div>
        <div class="clock-date" :class="{ blank: isEmpty(world.日期) }">{{ blankOr(world.日期, '日期') }}</div>
      </div>
      <div class="clock-right">
        <div class="clock-weather" :class="{ blank: isEmpty(world.天气) }">{{ blankOr(world.天气, '今日天气') }}</div>
        <div class="clock-loc" :class="{ blank: isEmpty(world.地点) }">📍 {{ blankOr(world.地点, '当前地点') }}</div>
      </div>
    </div>

    <div class="block">
      <div class="block-head">👥 在场人物</div>
      <div class="people">
        <div v-for="person in people" :key="person.id" class="person" :class="{ self: person.isSelf }">
          <div class="person-top">
            <span class="person-name" :class="{ blank: isBlank(person.姓名) }">{{ person.姓名 }}</span>
            <span class="person-rel" :class="{ self: person.isSelf }">{{ person.关系 }}</span>
          </div>
          <p class="person-state" :class="{ blank: isEmpty(person.人物状态) }">
            {{ blankOr(person.人物状态, '当前状态') }}
          </p>
          <div class="attire">
            <span v-for="slot in 衣着槽位" :key="slot" class="attire-tag">
              <em>{{ slot }}</em>
              <span :class="{ unworn: isBlank(person.人物衣着?.[slot]) }">{{ wear(person.人物衣着?.[slot]) }}</span>
            </span>
          </div>
          <div v-if="person.isSelf && acquiredPowers.length" class="powers">
            <div v-for="power in acquiredPowers" :key="power.key" class="power-item">
              <span class="power-name">{{ blank(power.名称) }}</span>
              <span v-if="!isBlank(power.效果)" class="power-effect">{{ blank(power.效果) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="block">
      <div class="block-head">🎀 环境物品</div>
      <div v-if="!_.isEmpty(world.环境重要物品)" class="chips">
        <span v-for="(item, id) in world.环境重要物品" :key="id" class="chip">
          <em>{{ blank(item.名称) }}</em>
          <span class="chip-sub">{{ blank(item.物品位置) }} · {{ blank(item.物品状态) }}</span>
        </span>
      </div>
      <div v-else class="empty">周围空空荡荡～</div>
    </div>

    <div class="block">
      <div class="block-head">💰 我的财富</div>
      <div class="wealth-row">
        <div class="assets">
          <div v-if="!_.isEmpty(world.资产)" class="assets-list">
            <div v-for="(asset, id) in world.资产" :key="id" class="asset">
              <span class="asset-name" :class="{ blank: isBlank(asset.名称) }">{{ blank(asset.名称) }}</span>
              <span class="asset-type">{{ blank(asset.类型) }}</span>
              <span class="asset-state">{{ blank(asset.状态) }}</span>
              <span class="asset-note">{{ blank(asset.备注) }}</span>
            </div>
          </div>
          <div v-else class="empty">暂无资产～</div>
        </div>
        <div class="wealth-card">
          <span class="wealth-key">余额</span>
          <span class="wealth-val">{{ num(world.财富) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { blank, blankOr, isBlank, isEmpty, num } from '../format';
import { useDataStore } from '../store';

const store = useDataStore();
const world = computed(() => store.data.世界信息);

const 衣着槽位 = ['头部', '上衣', '外套', '下装', '内衣裤', '袜子', '鞋子', '手持物'] as const;

/** 在场人物列表：主角(user)恒定排在最前，其后才是其他人物 */
const people = computed(() => {
  const 主角 = world.value.主角;
  const 主角姓名 = isBlank(主角.姓名) ? blank(store.data.空间信息.账号名称) : String(主角.姓名);
  const list = [
    {
      id: '__self__',
      姓名: 主角姓名,
      关系: '我',
      人物状态: 主角.人物状态,
      人物衣着: 主角.人物衣着 ?? {},
      isSelf: true,
    },
  ];
  for (const [id, person] of Object.entries(world.value.人物)) {
    list.push({
      id,
      姓名: blank(person.姓名),
      关系: blank(person.与user关系),
      人物状态: person.人物状态,
      人物衣着: person.人物衣着 ?? {},
      isSelf: false,
    });
  }
  return list;
});

const 超能力槽位 = ['槽位一', '槽位二', '槽位三'] as const;

const acquiredPowers = computed(() => {
  const 槽 = world.value.主角.超能力槽 ?? {};
  return 超能力槽位
    .filter(key => !isPowerEmpty(槽[key]))
    .map(key => ({ key, 名称: 槽[key]?.名称 ?? '', 效果: 槽[key]?.效果 ?? '' }));
});

/** 衣着槽位为空时恒定显示「无」 */
function wear(value: unknown): string {
  return isBlank(value) ? '无' : String(value);
}

function isPowerEmpty(slot: { 名称?: string; 效果?: string } | undefined): boolean {
  return isBlank(slot?.名称) && isBlank(slot?.效果);
}
</script>

<style lang="scss" scoped>
.reality {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.clock-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 16px 13px;
  background: rgba(255, 255, 255, 0.72);
  border: 1.5px solid var(--sn-card-line);
  border-radius: var(--sn-radius);
  overflow: hidden;
}

.clock-left {
  flex: 0 0 auto;
  min-width: 5.2rem;
  max-width: 46%;
}

.clock-time {
  font-size: 2.3rem;
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: 0.01em;
  color: var(--sn-text);
  white-space: nowrap;
}

.clock-time.blank {
  font-size: 1.4rem;
}

.clock-date {
  margin-top: 3px;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--sn-text-soft);
  word-break: keep-all;
}

.clock-right {
  flex: 1 1 0;
  min-width: 0;
  max-width: 54%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  text-align: right;
}

.clock-weather {
  max-width: 100%;
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1.4;
  color: var(--sn-lav-deep);
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.clock-loc {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--sn-text-soft);
}

.wealth-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.assets {
  flex: 1 1 auto;
  min-width: 0;
}

.wealth-card {
  flex: 0 0 92px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 10px 8px;
  background: linear-gradient(150deg, rgba(255, 217, 122, 0.24), rgba(243, 182, 220, 0.2));
  border: 1.5px solid rgba(255, 217, 122, 0.55);
  border-radius: var(--sn-radius);
}

.wealth-icon {
  font-size: 1.15rem;
}

.wealth-key {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--sn-text-soft);
}

.wealth-val {
  font-size: 1.05rem;
  font-weight: 800;
  color: #c79a2e;
}

.block-head {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--sn-lav-deep);
  margin-bottom: 7px;
  padding-left: 2px;
}

.people {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.person {
  padding: 9px 11px;
  background: rgba(255, 255, 255, 0.75);
  border: 1.5px solid var(--sn-card-line);
  border-radius: var(--sn-radius-sm);
  transition: transform 0.22s ease;
}

.person:hover {
  transform: translateX(4px);
}

.person.self {
  background: linear-gradient(135deg, rgba(185, 164, 236, 0.16), rgba(243, 182, 220, 0.14));
  border-color: rgba(185, 164, 236, 0.55);
}

.person-top {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.person-name {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--sn-text);
}

.person-rel {
  font-size: 0.7rem;
  color: #fff;
  background: linear-gradient(120deg, var(--sn-lav), var(--sn-peri));
  padding: 1px 8px;
  border-radius: 999px;
}

.person-rel.self {
  background: linear-gradient(120deg, #f5a3c7, #d9a4ec);
  font-weight: 700;
}

.person-state {
  margin-top: 3px;
  font-size: 0.76rem;
  color: var(--sn-text-soft);
  line-height: 1.4;
}

.attire {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.attire-tag {
  font-size: 0.68rem;
  color: var(--sn-text);
  background: rgba(185, 164, 236, 0.16);
  border-radius: 7px;
  padding: 2px 7px;
}

.attire-tag em {
  font-style: normal;
  font-weight: 700;
  color: var(--sn-lav-deep);
  margin-right: 4px;
}

.attire-tag .unworn {
  color: var(--sn-text-faint);
}

.powers {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(185, 164, 236, 0.35);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.power-item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  padding: 5px 8px;
  background: rgba(185, 164, 236, 0.1);
  border-radius: 7px;
  font-size: 0.68rem;
}

.power-name {
  font-weight: 700;
  color: var(--sn-text);
}

.power-effect {
  color: var(--sn-text-soft);
}

.power-effect::before {
  content: '·';
  margin-right: 4px;
  color: var(--sn-text-faint);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.chip {
  display: flex;
  flex-direction: column;
  padding: 6px 11px;
  background: rgba(255, 255, 255, 0.75);
  border: 1.5px solid var(--sn-card-line);
  border-radius: var(--sn-radius-sm);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.chip:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 12px rgba(154, 130, 216, 0.26);
}

.chip em {
  font-style: normal;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--sn-text);
}

.chip-sub {
  font-size: 0.66rem;
  color: var(--sn-text-soft);
}

.assets-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.asset {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 7px;
  padding: 7px 11px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--sn-card-line);
  border-radius: var(--sn-radius-sm);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.asset:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 10px rgba(154, 130, 216, 0.22);
}

.asset-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--sn-text);
}

.asset-type {
  font-size: 0.66rem;
  color: var(--sn-lav-deep);
  background: rgba(185, 164, 236, 0.18);
  padding: 1px 7px;
  border-radius: 999px;
}

.asset-state,
.asset-note {
  font-size: 0.72rem;
  color: var(--sn-text-soft);
}

.asset-note {
  width: 100%;
}

.empty {
  text-align: center;
  font-size: 0.78rem;
  font-style: italic;
  color: var(--sn-text-faint);
  padding: 12px;
}

.blank {
  color: var(--sn-text-faint);
  font-style: italic;
  font-weight: 600;
}
</style>
