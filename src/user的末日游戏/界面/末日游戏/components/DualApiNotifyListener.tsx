import React, { useEffect, useState } from 'react';
import {
  TH_DUAL_API_NOTIFY,
  type DualApiNotifyPayload,
} from '../../../dualApiEvents';
import { AlertModal } from './AlertModal';

export const DualApiNotifyListener: React.FC = () => {
  const [payload, setPayload] = useState<DualApiNotifyPayload | null>(null);

  useEffect(() => {
    const stop = eventOn(TH_DUAL_API_NOTIFY, (data: DualApiNotifyPayload) => {
      setPayload(data);
    });
    return () => stop.stop();
  }, []);

  if (!payload) {
    return null;
  }

  const open = true;
  const onClose = () => setPayload(null);

  if (payload.kind === 'second_pass_ok') {
    return (
      <AlertModal
        open={open}
        onClose={onClose}
        title="第二路变量已更新"
        tone="success"
      >
        <p>
          已合并至楼层 <strong>#{payload.messageId}</strong>
          {payload.hasUpdateVariable
            ? '，含 UpdateVariable 块。'
            : '；未检测到 UpdateVariable，已尝试从正文兜底写入地点/天气等。'}
        </p>
      </AlertModal>
    );
  }

  if (payload.kind === 'reroll_ok') {
    return (
      <AlertModal open={open} onClose={onClose} title="变量重 roll 完成" tone="success">
        <p>
          楼层 <strong>#{payload.messageId}</strong> 已重新请求第二路并写入变量。
          {!payload.hasUpdateVariable && (
            <span className="mt-2 block text-xs text-gray-500">
              未返回 UpdateVariable，已尝试正文兜底。
            </span>
          )}
        </p>
      </AlertModal>
    );
  }

  return (
    <AlertModal open={open} onClose={onClose} title="变量重 roll 失败" tone="error">
      <p>{payload.message}</p>
    </AlertModal>
  );
};
