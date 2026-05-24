/** 界面 iframe 与「多API串联」脚本之间的事件名（须完全一致） */

export const TH_DUAL_API_NOTIFY = 'th_mori_dual_api_notify';
export const TH_DUAL_API_REROLL = 'th_mori_dual_api_reroll';

export type DualApiNotifyPayload =
  | {
      kind: 'second_pass_ok';
      messageId: number;
      hasUpdateVariable: boolean;
    }
  | {
      kind: 'reroll_ok';
      messageId: number;
      hasUpdateVariable: boolean;
    }
  | {
      kind: 'reroll_fail';
      message: string;
    };
