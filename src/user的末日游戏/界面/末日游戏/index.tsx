import { waitUntil } from 'async-wait-until';
import { createRoot } from 'react-dom/client';
import App from './App';
import './global.css';
import { attachIframeLayoutNotify } from './notifyIframeLayout';
import { UiSettingsProvider } from './UiSettingsContext';

$(async () => {
  await waitGlobalInitialized('Mvu');
  try {
    await waitUntil(
      () => _.has(getVariables({ type: 'message', message_id: getCurrentMessageId() }), 'stat_data'),
      { timeout: 12000, intervalBetweenAttempts: 200 },
    );
  } catch {
    console.warn('[user的末日游戏] 等待 stat_data 超时，仍挂载界面');
  }
  const el = document.getElementById('root');
  if (!el) {
    console.error('[user的末日游戏] 找不到 #root');
    return;
  }
  createRoot(el).render(
    <UiSettingsProvider>
      <App />
    </UiSettingsProvider>,
  );

  const detachLayoutNotify = attachIframeLayoutNotify(el);
  $(window).on('pagehide', detachLayoutNotify);
});
