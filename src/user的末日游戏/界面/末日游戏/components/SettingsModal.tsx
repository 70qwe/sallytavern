import React, { useCallback, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import toastr from 'toastr';
import { TH_DUAL_API_REROLL } from '../../../dualApiEvents';
import { applyWorldbookOutputMode } from '../worldbookOutputMode';
import { UiSettingsSchema, type UiSettings } from '../uiSettings';
import { useUiSettings } from '../UiSettingsContext';
import { AlertModal } from './AlertModal';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { settings, patchSettings, setSettings } = useUiSettings();
  const [wbBusy, setWbBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [modelsBusy, setModelsBusy] = useState(false);
  const [testHint, setTestHint] = useState<string | null>(null);
  const [testSuccessOpen, setTestSuccessOpen] = useState(false);
  const [rerollBusy, setRerollBusy] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);

  const dual = settings.dualApi;

  const applyModeToWorldbook = useCallback(
    async (mode: UiSettings['outputMode']) => {
      setWbBusy(true);
      try {
        await applyWorldbookOutputMode(mode === 'dual' ? 'dual' : 'single');
        toastr.success(mode === 'dual' ? '已切换为多 API 世界书条目' : '已切换为单 API 世界书条目');
      } catch (e) {
        console.error('[设置] 世界书切换失败', e);
        toastr.error(e instanceof Error ? e.message : '世界书切换失败');
      } finally {
        setWbBusy(false);
      }
    },
    [],
  );

  const handleOutputModeChange = async (mode: UiSettings['outputMode']) => {
    patchSettings({ outputMode: mode });
    await applyModeToWorldbook(mode);
  };

  const runConnectionTest = useCallback(async () => {
    const url = dual.apiUrl.trim();
    if (!url) {
      toastr.warning('请先填写 API URL');
      return;
    }
    setTestBusy(true);
    setTestHint(null);
    const max = Math.min(10, Math.max(0, dual.maxRetries));
    let lastMsg = '';
    for (let attempt = 0; attempt <= max; attempt++) {
      try {
        await generate({
          user_input: 'ping',
          should_silence: true,
          custom_api: {
            apiurl: url,
            key: dual.apiKey || undefined,
            model: dual.model.trim() || undefined,
            source: 'openai',
          },
        });
        setTestHint(`成功（第 ${attempt + 1} 次尝试）`);
        setTestSuccessOpen(true);
        setTestBusy(false);
        return;
      } catch (e) {
        lastMsg = e instanceof Error ? e.message : String(e);
      }
    }
    setTestHint(`失败：${lastMsg}`);
    toastr.error(`连接失败：${lastMsg}`);
    setTestBusy(false);
  }, [dual.apiKey, dual.apiUrl, dual.maxRetries, dual.model]);

  const fetchModels = useCallback(async () => {
    const url = dual.apiUrl.trim();
    if (!url) {
      toastr.warning('请先填写 API URL');
      return;
    }
    setModelsBusy(true);
    try {
      const list = await getModelList({ apiurl: url, key: dual.apiKey || undefined });
      setFetchedModels(list);
      toastr.success(`已获取 ${list.length} 个模型`);
    } catch (e) {
      console.error('[设置] 获取模型列表失败', e);
      toastr.error(e instanceof Error ? e.message : '获取模型列表失败');
      setFetchedModels([]);
    } finally {
      setModelsBusy(false);
    }
  }, [dual.apiKey, dual.apiUrl]);

  const handleRerollVariables = useCallback(async () => {
    setRerollBusy(true);
    try {
      await eventEmit(TH_DUAL_API_REROLL);
    } catch (e) {
      console.error('[设置] 变量重 roll 失败', e);
      toastr.error(e instanceof Error ? e.message : '变量重 roll 失败');
    } finally {
      setRerollBusy(false);
    }
  }, []);

  return (
    <>
    <AlertModal
      open={testSuccessOpen}
      onClose={() => setTestSuccessOpen(false)}
      title="连接测试成功"
      tone="success"
    >
      <p>第二路 API 可正常连通。关闭本窗口后可在剧情工具栏使用「变量重 roll」补写变量。</p>
    </AlertModal>
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="界面设置"
            className="note-paper flex max-h-[min(100dvh,100vh)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl shadow-xl sm:max-h-[90vh] sm:rounded-lg"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
          >
            <header className="safe-pt-header flex shrink-0 items-center justify-between gap-3 border-b border-game-border bg-game-bg/80 px-4 py-3">
              <span className="title-underlay font-heading text-base text-game-text sm:text-lg">界面设置</span>
              <button
                type="button"
                className="touch-manipulation button-retro rounded-lg p-2.5 text-game-text hover:bg-white sm:p-2"
                onClick={onClose}
                aria-label="关闭"
              >
                <X className="h-6 w-6 sm:h-5 sm:w-5" />
              </button>
            </header>

            <div className="safe-pb-nav min-h-0 flex-1 overflow-y-auto p-4 text-sm [-webkit-overflow-scrolling:touch]">
              <section className="mb-6">
                <h3 className="title-underlay-sm mb-3 text-xs font-bold uppercase tracking-wide text-game-accent">
                  外观
                </h3>
                <label className="mb-2 block text-game-text">
                  字号（{settings.fontSizePx}px）
                  <input
                    type="range"
                    min={12}
                    max={28}
                    value={settings.fontSizePx}
                    onChange={e => patchSettings({ fontSizePx: Number(e.target.value) })}
                    className="mt-1 w-full accent-game-primary"
                  />
                </label>
                <p className="text-xs leading-relaxed text-game-text-muted">
                  字体已固定：大标题为站酷小薇体，正文与标签为思源黑体（Noto Sans SC），不使用宋体。
                </p>
              </section>

              <section className="mb-6 border-t border-game-border pt-4">
                <h3 className="title-underlay-sm mb-3 text-xs font-bold uppercase tracking-wide text-game-accent">
                  输出模式
                </h3>
                <p className="mb-3 text-xs leading-relaxed text-gray-500">
                  切换后将<strong>自动启用/禁用</strong>下列条目（标题须与世界书一致，见代码{' '}
                  <code className="rounded bg-white px-1">WB_ENTRY_ALIASES</code>）：单 API 模式开启「变量列表」「变量更新规则」「变量输出格式」「单api输出格式」，并关闭「多api输出格式-主/副」与旧版单条「多API输出格式」。双 API
                  模式则关闭前四项，开启「多api输出格式-主」「多api输出格式-副」，副路在脚本中另行注入前三项全文。
                </p>
                <div className="flex flex-col gap-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-game-border bg-white/90 px-3 py-2">
                    <input
                      type="radio"
                      name="outmode"
                      checked={settings.outputMode === 'single'}
                      disabled={wbBusy}
                      onChange={() => void handleOutputModeChange('single')}
                    />
                    <span>单 API（一次生成剧情 + 变量）</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-game-border bg-white/90 px-3 py-2">
                    <input
                      type="radio"
                      name="outmode"
                      checked={settings.outputMode === 'dual'}
                      disabled={wbBusy}
                      onChange={() => void handleOutputModeChange('dual')}
                    />
                    <span>双 API（主 API 剧情，第二 API 专跑变量更新）</span>
                  </label>
                </div>
                {wbBusy && (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-game-primary">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    正在更新世界书条目…
                  </p>
                )}
              </section>

              {settings.outputMode === 'dual' && (
                <section className="border-t border-game-border pt-4">
                  <h3 className="title-underlay-sm mb-3 text-xs font-bold uppercase tracking-wide text-game-accent">
                    第二路 API（OpenAI 兼容）
                  </h3>
                  <p className="mb-3 text-xs text-gray-500">
                    请保持角色卡脚本库中的「多API串联」启用：主 API 回复完成后，会用{' '}
                    <code className="rounded bg-white px-1">generateRaw</code> 调用此处配置的接口，把变量更新追加到同一楼层。
                    连接测试仍使用 <code className="rounded bg-white px-1">generate</code> +{' '}
                    <code className="rounded bg-white px-1">custom_api</code>（仅测连通性）。
                  </p>

                  <label className="mb-3 block">
                    <span className="text-game-text">API URL</span>
                    <input
                      type="url"
                      placeholder="https://api.openai.com/v1"
                      value={dual.apiUrl}
                      onChange={e =>
                        setSettings(s =>
                          UiSettingsSchema.parse({
                            ...s,
                            dualApi: { ...s.dualApi, apiUrl: e.target.value },
                          }),
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-game-border bg-white px-3 py-2 font-mono text-xs text-game-text"
                    />
                  </label>

                  <label className="mb-3 block">
                    <span className="text-game-text">API Key</span>
                    <input
                      type="password"
                      autoComplete="off"
                      value={dual.apiKey}
                      onChange={e =>
                        setSettings(s =>
                          UiSettingsSchema.parse({
                            ...s,
                            dualApi: { ...s.dualApi, apiKey: e.target.value },
                          }),
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-game-border bg-white px-3 py-2 font-mono text-xs text-game-text"
                    />
                  </label>

                  <label className="mb-3 block">
                    <span className="text-game-text">模型</span>
                    <input
                      type="text"
                      list="th-dual-api-models"
                      placeholder="手动填写或先获取列表后选择"
                      value={dual.model}
                      onChange={e =>
                        setSettings(s =>
                          UiSettingsSchema.parse({
                            ...s,
                            dualApi: { ...s.dualApi, model: e.target.value },
                          }),
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-game-border bg-white px-3 py-2 font-mono text-xs text-game-text"
                    />
                    <datalist id="th-dual-api-models">
                      {fetchedModels.map(m => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </label>

                  <label className="mb-3 block">
                    <span className="text-game-text">最大重试次数（0–10，连接测试）</span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={dual.maxRetries}
                      onChange={e =>
                        setSettings(s =>
                          UiSettingsSchema.parse({
                            ...s,
                            dualApi: {
                              ...s.dualApi,
                              maxRetries: Math.min(10, Math.max(0, Number(e.target.value) || 0)),
                            },
                          }),
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-game-border bg-white px-3 py-2 text-game-text"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={testBusy}
                      className="touch-manipulation button-retro rounded-lg px-3 py-2 text-xs font-bold text-game-text disabled:opacity-50"
                      onClick={() => void runConnectionTest()}
                    >
                      {testBusy ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          测试中…
                        </span>
                      ) : (
                        '连接测试'
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={modelsBusy}
                      className="touch-manipulation button-retro rounded-lg px-3 py-2 text-xs font-bold text-game-text disabled:opacity-50"
                      onClick={() => void fetchModels()}
                    >
                      {modelsBusy ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          获取中…
                        </span>
                      ) : (
                        '获取可用模型'
                      )}
                    </button>
                  </div>
                  {testHint && <p className="mt-2 text-xs text-gray-600">{testHint}</p>}

                  <div className="mt-4 border-t border-game-border pt-4">
                    <h4 className="title-underlay-sm mb-2 text-xs font-bold uppercase tracking-wide text-game-accent">
                      变量补救
                    </h4>
                    <p className="mb-2 text-xs text-gray-500">
                      当<strong>最新一楼</strong>剧情已生成但侧边栏变量未更新时，可手动对最新 assistant 楼层重新请求第二路（不重复主 API 叙事）。
                    </p>
                    <button
                      type="button"
                      disabled={rerollBusy}
                      className="touch-manipulation button-retro w-full rounded-lg px-3 py-2 text-xs font-bold text-game-text disabled:opacity-50"
                      onClick={() => void handleRerollVariables()}
                    >
                      {rerollBusy ? '正在重 roll…' : '变量重 roll（最新楼层）'}
                    </button>
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};
