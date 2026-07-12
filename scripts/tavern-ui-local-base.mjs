/**
 * 为「末日游戏」界面 dist 写入与 Go Live 一致的 <base href>（见 webpack `TAVERN_HELPER_LIVE_ORIGIN`）。
 * 用法：pnpm run build:local / pnpm run watch:local
 * 端口或主机不同：TAVERN_HELPER_LIVE_ORIGIN=http://127.0.0.1:8080 pnpm run build:local
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const origin = process.env.TAVERN_HELPER_LIVE_ORIGIN || 'http://localhost:5501';
const childEnv = { ...process.env, TAVERN_HELPER_LIVE_ORIGIN: origin };

console.info(`[build:local] TAVERN_HELPER_LIVE_ORIGIN=${origin} (index.html <base> uses this origin)`);

const passthrough = process.argv.slice(2);
const args = ['exec', 'webpack', ...passthrough];

const r = spawnSync('pnpm', args, {
  stdio: 'inherit',
  shell: true,
  env: childEnv,
});

process.exit(r.status ?? 1);
