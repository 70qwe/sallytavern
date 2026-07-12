import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js';
import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { Schema } from '../../schema';
import { clearEnvItemsOnLocationChange, filterNonPhysicalEnvItems } from '../filterEnvItems';
import { unsealMvuStatData } from '../unsealMvuStatData';

function unseal(variables: Mvu.MvuData) {
  if (variables?.stat_data) {
    unsealMvuStatData(variables.stat_data);
  }
}

function onUpdateEnded(variables: Mvu.MvuData, variablesBefore?: Mvu.MvuData) {
  unseal(variables);
  if (variables?.stat_data) {
    if (variablesBefore?.stat_data) {
      clearEnvItemsOnLocationChange(variables.stat_data, variablesBefore.stat_data);
    }
    filterNonPhysicalEnvItems(variables.stat_data);
  }
}

$(async () => {
  await waitGlobalInitialized('Mvu');

  // 插到监听队列最前，保证 JSON Patch 执行前 stat_data 已解冻
  eventMakeFirst(Mvu.events.VARIABLE_UPDATE_STARTED, unseal);
  eventMakeFirst(Mvu.events.COMMAND_PARSED, unseal);

  registerMvuSchema(Schema);

  eventOn(Mvu.events.VARIABLE_INITIALIZED, unseal);
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, onUpdateEnded);

  try {
    unseal(Mvu.getMvuData({ type: 'message', message_id: 'latest' }));
  } catch {
    // 新聊天尚未有楼层变量时忽略
  }

  console.info('[超级网黄系统] MVU schema 已注册，stat_data 解冻监听已启用');
});
