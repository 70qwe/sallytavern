import { checkAssistantStoryFormat } from '../../界面/末日游戏/utils/messageParser';

const DEBOUNCE_MS = 400;
let timer: ReturnType<typeof setTimeout> | null = null;

const BLOCK_LABEL: Record<'maintext' | 'option' | 'sum', string> = {
  maintext: '<maintext> 叙事块',
  option: '<option> 四条选项 (A～D)',
  sum: '<sum> 回合摘要',
};

function formatMissingHint(missing: readonly ('maintext' | 'option' | 'sum')[], optionCount: number): string {
  const parts = missing.map(k => BLOCK_LABEL[k]);
  if (missing.includes('option') && optionCount > 0) {
    parts[parts.indexOf(BLOCK_LABEL.option)] = `${BLOCK_LABEL.option}（当前仅 ${optionCount} 条）`;
  }
  return parts.join('、');
}

async function inspectLatestAssistantFormat(): Promise<void> {
  const rows = getChatMessages(-1, { role: 'assistant', hide_state: 'all' });
  const last = rows[rows.length - 1];
  if (!last?.message?.trim()) {
    return;
  }

  const check = checkAssistantStoryFormat(last.message);
  if (check.ok) {
    return;
  }

  const hint = formatMissingHint(check.missing, check.optionCount);
  console.warn('[输出格式] 最新 assistant 楼层缺少:', check.missing, { optionCount: check.optionCount });
  toastr.warning(
    `本楼缺少：${hint}。请点「重新生成」或检查世界书是否启用「主叙事输出格式-共用」与「多api输出格式-主」。`,
    '输出格式不完整',
    { timeOut: 12000 },
  );
}

export function scheduleFormatGuard(): void {
  if (timer !== null) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    timer = null;
    void inspectLatestAssistantFormat();
  }, DEBOUNCE_MS);
}
