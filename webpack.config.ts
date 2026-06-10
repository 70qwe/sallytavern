import { FSWatcher, watch } from 'chokidar';
import HtmlInlineScriptWebpackPlugin from 'html-inline-script-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import _ from 'lodash';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { ChildProcess, exec, spawn } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import RemarkHTML from 'remark-html';
import { Server } from 'socket.io';
import TerserPlugin from 'terser-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import unpluginAutoImport from 'unplugin-auto-import/webpack';
import { VueUseComponentsResolver, VueUseDirectiveResolver } from 'unplugin-vue-components/resolvers';
import unpluginVueComponents from 'unplugin-vue-components/webpack';
import { VueLoaderPlugin } from 'vue-loader';
import webpack from 'webpack';
import WebpackObfuscator from 'webpack-obfuscator';
const require = createRequire(import.meta.url);
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;

interface Config {
  port: number;
  entries: Entry[];
}
interface Entry {
  script: string;
  html?: string;
}

<<<<<<< HEAD
/** 禁止 Sass 输出 @charset，避免多个 vue 样式块内联进同一 `<style>` 时在中间出现 @charset 触发 CSS 校验错误 */
const sassLoader = {
  loader: 'sass-loader',
  options: { sassOptions: { charset: false } },
};

function parse_entry(script_file: string) {
  const dir = path.dirname(script_file);
  const html =
    ['index.ejs', 'index.html'].map(f => path.join(dir, f)).find(f => fs.existsSync(f)) ?? null;
  if (html) {
=======
function parse_entry(script_file: string) {
  const html = path.join(path.dirname(script_file), 'index.html');
  if (fs.existsSync(html)) {
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
    return { script: script_file, html };
  }
  return { script: script_file };
}

function common_path(lhs: string, rhs: string) {
  const lhs_parts = lhs.split(path.sep);
  const rhs_parts = rhs.split(path.sep);
  for (let i = 0; i < Math.min(lhs_parts.length, rhs_parts.length); i++) {
    if (lhs_parts[i] !== rhs_parts[i]) {
      return lhs_parts.slice(0, i).join(path.sep);
    }
  }
  return lhs_parts.join(path.sep);
}

function glob_script_files() {
  const results: string[] = [];

  fs.globSync(`{示例,src}/**/index.{ts,tsx,js,jsx}`)
    .filter(
      file => process.env.CI !== 'true' || !fs.readFileSync(path.join(import.meta.dirname, file)).includes('@no-ci'),
    )
    .forEach(file => {
      const file_dirname = path.dirname(file);
      for (const [index, result] of results.entries()) {
        const result_dirname = path.dirname(result);
        const common = common_path(result_dirname, file_dirname);
        if (common === result_dirname) {
          return;
        }
        if (common === file_dirname) {
          results.splice(index, 1, file);
          return;
        }
      }
      results.push(file);
    });

  return results;
}

const config: Config = {
  port: 6621,
  entries: glob_script_files().map(parse_entry),
};

let io: Server;
function watch_tavern_helper(compiler: webpack.Compiler) {
  if (compiler.options.watch) {
    if (!io) {
      const port = config.port ?? 6621;
      io = new Server(port, { cors: { origin: '*' } });
      console.info(`\x1b[36m[tavern_helper]\x1b[0m 已启动酒馆监听服务`);
      io.on('connect', socket => {
        console.info(`\x1b[36m[tavern_helper]\x1b[0m 成功连接到酒馆网页 '${socket.id}', 初始化推送...`);
        io.emit('iframe_updated');
        socket.on('disconnect', reason => {
          console.info(`\x1b[36m[tavern_helper]\x1b[0m 与酒馆网页 '${socket.id}' 断开连接: ${reason}`);
        });
      });
    }

    compiler.hooks.done.tap('watch_tavern_helper', () => {
      console.info('\n\x1b[36m[tavern_helper]\x1b[0m 检测到完成编译, 推送更新事件...');
      if (compiler.options.plugins.some(plugin => plugin instanceof HtmlWebpackPlugin)) {
        io.emit('message_iframe_updated');
      } else {
        io.emit('script_iframe_updated');
      }
    });
  }
}

let watcher: FSWatcher;
const dump = () => {
  exec('pnpm dump', { cwd: import.meta.dirname });
  console.info('\x1b[36m[schema_dump]\x1b[0m 已将所有 schema.ts 转换为 schema.json');
};
const dump_debounced = _.debounce(dump, 500, { leading: true, trailing: false });
function schema_dump(compiler: webpack.Compiler) {
  if (!compiler.options.watch) {
    dump_debounced();
    return;
  }
  if (!watcher) {
    watcher = watch('src', {
      awaitWriteFinish: true,
    }).on('all', (_event, path) => {
      if (path.endsWith('schema.ts')) {
        dump_debounced();
      }
    });
  }
}

let child_process: ChildProcess;
const bundle = () => {
  exec('pnpm sync bundle all', { cwd: import.meta.dirname });
  console.info('\x1b[36m[tavern_sync]\x1b[0m 已打包所有配置了的角色卡/世界书/预设');
};
const bundle_debounced = _.debounce(bundle, 500, { leading: true, trailing: false });
function tavern_sync(compiler: webpack.Compiler) {
  if (!compiler.options.watch) {
    bundle_debounced();
    return;
  }
  compiler.hooks.watchRun.tap('watch_tavern_sync', () => {
    if (!child_process) {
      child_process = spawn('pnpm', ['sync', 'watch', 'all', '-f'], {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: import.meta.dirname,
        env: { ...process.env, FORCE_COLOR: '1' },
      });
      child_process.stdout?.on('data', (data: Buffer) => {
        console.info(
          data
            .toString()
            .trimEnd()
            .split('\n')
            .map(string => (/^\s*$/s.test(string) ? string : `\x1b[36m[tavern_sync]\x1b[0m ${string}`))
            .join('\n'),
        );
      });
      child_process.stderr?.on('data', (data: Buffer) => {
        console.error(
          data
            .toString()
            .trimEnd()
            .split('\n')
            .map(string => (/^\s*$/s.test(string) ? string : `\x1b[36m[tavern_sync]\x1b[0m ${string}`))
            .join('\n'),
        );
      });
      child_process.on('error', error => {
        console.error(`\x1b[31m[tavern_sync]\x1b[0m Error: ${error.message}`);
      });
    }
  });
  compiler.hooks.watchClose.tap('watch_tavern_sync', () => {
    child_process?.kill();
  });
  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => {
      child_process?.kill();
    });
  });
}

<<<<<<< HEAD
/** 与酒馆楼层「正则替换 + $('body').load(url)」兼容：须为普通脚本（非 type=module），且勿使用 CDN 的 ESM external。 */
function is_jquery_load_compatible_ui(entry: Entry): boolean {
  const norm = entry.script.replace(/\\/g, '/');
  return norm.includes('user的末日游戏/界面/末日游戏/index.tsx');
}

/**
 * 酒馆助手脚本在 about:srcdoc 里以**非 module** 的 &lt;script&gt; 执行，不能打出 `import`/`export` 的 ESM 包。
 * 含 `…/脚本/…`（如 user的末日游戏/脚本）与示例 `…/脚本示例/…`。
 */
function is_tavern_helper_classic_script_bundle(entry: Entry): boolean {
  const norm = entry.script.replace(/\\/g, '/');
  return /\/(脚本|脚本示例)\//.test(norm);
}

/** 禁止 webpack experiments.outputModule / library.type module，须打成可在 iframe 直接执行的脚本 */
function use_classic_script_output(entry: Entry): boolean {
  return is_jquery_load_compatible_ui(entry) || is_tavern_helper_classic_script_bundle(entry);
}

/** 与 `src/user的末日游戏/index.yaml` 中 `$.load(...index.html)` 的 CDN 前缀一致，避免生产包仍指向 localhost 导致跨域。 */
const TAVERN_UI_DIST_CDN_BASE =
  'https://testingcf.jsdelivr.net/gh/70qwe/sallytavern/dist/user的末日游戏/界面/末日游戏/';

/**
 * load 进酒馆父页面后相对路径会指向酒馆域名，故用 base + 外链脚本。
 * - `TAVERN_HELPER_BASE_HREF`：完整 base URL（优先级最高）
 * - `TAVERN_HELPER_LIVE_ORIGIN`：如 `http://127.0.0.1:5500`，用于 Go Live 本地测：**任意 mode** 下都会把 base 指到该 origin（避免生产包仍写 CDN、与 $.load 本机地址不一致导致 MIME/CORS）
 * - production 且未设上述变量：使用 jsdelivr 与 index.yaml 一致
 */
/**
 * `$('…').load(cdnUrl)` 跨域时 jQuery 会丢弃响应里所有 `<script>`（含内联），外部 index.js 永远不会执行。
 * 须由正则/替换脚本在 load 回调里 `$.getScript(cdnUrl + 'index.js')`。
 * 另：load 通常只插入 `<body>` 片段，故把 `<style>` 挪到 body 开头，避免只剩背景无组件。
 */
function pack_jquery_load_ui_html_for_cross_origin_load(): webpack.WebpackPluginInstance {
  return {
    apply(compiler) {
      compiler.hooks.afterEmit.tap('PackJqueryLoadUiHtml', compilation => {
        const out_dir = compilation.outputOptions.path;
        if (!out_dir) {
          return;
        }
        const html_path = path.join(out_dir, 'index.html');
        if (!fs.existsSync(html_path)) {
          return;
        }
        let html = fs.readFileSync(html_path, 'utf8');
        const style_match = html.match(/<style[\s\S]*?<\/style>/i);
        if (style_match && !html.includes('<body><style')) {
          html = html.replace(style_match[0], '');
          html = html.replace(/(<body[^>]*>)/i, `$1${style_match[0]}`);
        }
        fs.writeFileSync(html_path, html);
      });
    },
  };
}

function tavern_embed_base_href(is_production: boolean): string {
  if (process.env.TAVERN_HELPER_BASE_HREF) {
    return process.env.TAVERN_HELPER_BASE_HREF.replace(/\/?$/, '/');
  }
  if (process.env.TAVERN_HELPER_LIVE_ORIGIN) {
    const origin = process.env.TAVERN_HELPER_LIVE_ORIGIN.replace(/\/$/, '');
    return `${origin}/dist/user的末日游戏/界面/末日游戏/`;
  }
  if (is_production) {
    return TAVERN_UI_DIST_CDN_BASE;
  }
  const origin = 'http://localhost:5500'.replace(/\/$/, '');
  return `${origin}/dist/user的末日游戏/界面/末日游戏/`;
}

=======
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
function parse_configuration(entry: Entry): (_env: any, argv: any) => webpack.Configuration {
  const should_obfuscate = fs
    .readFileSync(path.join(import.meta.dirname, entry.script), 'utf-8')
    .includes('@obfuscate');
  const script_filepath = path.parse(entry.script);
<<<<<<< HEAD
  const jquery_load_ui = is_jquery_load_compatible_ui(entry);
  const classic_output = use_classic_script_output(entry);

  return (_env, argv) => {
    const is_production_build = argv.mode === 'production';
    return {
    experiments: classic_output ? {} : { outputModule: true },
=======

  return (_env, argv) => ({
    experiments: {
      outputModule: true,
    },
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
    devtool: argv.mode === 'production' ? 'source-map' : 'eval-source-map',
    watchOptions: {
      ignored: ['**/dist', '**/node_modules'],
    },
    entry: path.join(import.meta.dirname, entry.script),
    target: 'browserslist',
    output: {
      devtoolNamespace: 'tavern_helper_template',
      devtoolModuleFilenameTemplate: info => {
        const resource_path = decodeURIComponent(info.resourcePath.replace(/^\.\//, ''));
        const is_direct = info.allLoaders === '';
        const is_vue_script =
          resource_path.match(/\.vue$/) &&
          info.query.match(/\btype=script\b/) &&
          !info.allLoaders.match(/\bts-loader\b/);

        return `${is_direct === true ? 'src' : 'webpack'}://${info.namespace}/${resource_path}${is_direct || is_vue_script ? '' : '?' + info.hash}`;
      },
      filename: `${script_filepath.name}.js`,
      path: path.join(
        import.meta.dirname,
        'dist',
        path.relative(import.meta.dirname, script_filepath.dir).replace(/^[^\\/]+[\\/]/, ''),
      ),
      chunkFilename: `${script_filepath.name}.[contenthash].chunk.js`,
      asyncChunks: true,
      clean: true,
      publicPath: '',
<<<<<<< HEAD
      ...(classic_output
        ? {}
        : {
            library: {
              type: 'module',
            },
          }),
=======
      library: {
        type: 'module',
      },
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          use: 'vue-loader',
          exclude: /node_modules/,
        },
        {
          oneOf: [
            {
              test: /\.tsx?$/,
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                onlyCompileBundledFiles: true,
                compilerOptions: {
                  noUnusedLocals: false,
                  noUnusedParameters: false,
                },
              },
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              test: /\.(sa|sc)ss$/,
<<<<<<< HEAD
              use: ['postcss-loader', sassLoader],
=======
              use: ['postcss-loader', 'sass-loader'],
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              test: /\.css$/,
              use: ['postcss-loader'],
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              test: /\.tsx?$/,
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                onlyCompileBundledFiles: true,
                compilerOptions: {
                  noUnusedLocals: false,
                  noUnusedParameters: false,
                },
              },
              resourceQuery: /url/,
              type: 'asset/inline',
              exclude: /node_modules/,
            },
            {
              test: /\.(sa|sc)ss$/,
<<<<<<< HEAD
              use: ['postcss-loader', sassLoader],
=======
              use: ['postcss-loader', 'sass-loader'],
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
              resourceQuery: /url/,
              type: 'asset/inline',
              exclude: /node_modules/,
            },
            {
              test: /\.css$/,
              use: ['postcss-loader'],
              resourceQuery: /url/,
              type: 'asset/inline',
              exclude: /node_modules/,
            },
            {
              resourceQuery: /url/,
              type: 'asset/inline',
              exclude: /node_modules/,
            },
            {
              test: /\.tsx?$/,
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                onlyCompileBundledFiles: true,
                compilerOptions: {
                  noUnusedLocals: false,
                  noUnusedParameters: false,
                },
              },
              exclude: /node_modules/,
            },
            {
              test: /\.html$/,
              use: 'html-loader',
              exclude: /node_modules/,
            },
            {
              test: /\.md$/,
              use: [
                {
                  loader: 'html-loader',
                },
                {
                  loader: 'remark-loader',
                  options: {
                    remarkOptions: {
                      plugins: [RemarkHTML],
                    },
                  },
                },
              ],
            },
            {
              test: /\.ya?ml$/,
              loader: 'yaml-loader',
              options: { asStream: true },
              resourceQuery: /stream/,
            },
            {
              test: /\.ya?ml$/,
              loader: 'yaml-loader',
            },
          ].concat(
            entry.html === undefined
              ? ([
                  {
                    test: /\.vue\.s(a|c)ss$/,
                    use: [
                      { loader: 'vue-style-loader', options: { ssrId: true } },
                      { loader: 'css-loader', options: { url: false } },
                      'postcss-loader',
<<<<<<< HEAD
                      sassLoader,
=======
                      'sass-loader',
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
                    ],
                    exclude: /node_modules/,
                  },
                  {
                    test: /\.vue\.css$/,
                    use: [
                      { loader: 'vue-style-loader', options: { ssrId: true } },
                      { loader: 'css-loader', options: { url: false } },
                      'postcss-loader',
                    ],
                    exclude: /node_modules/,
                  },
                  {
                    test: /\.s(a|c)ss$/,
                    use: [
                      'style-loader',
                      { loader: 'css-loader', options: { url: false } },
                      'postcss-loader',
<<<<<<< HEAD
                      sassLoader,
=======
                      'sass-loader',
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
                    ],
                    exclude: /node_modules/,
                  },
                  {
                    test: /\.css$/,
                    use: ['style-loader', { loader: 'css-loader', options: { url: false } }, 'postcss-loader'],
                    exclude: /node_modules/,
                  },
                ] as any[])
              : ([
                  {
                    test: /\.s(a|c)ss$/,
                    use: [
                      MiniCssExtractPlugin.loader,
                      { loader: 'css-loader', options: { url: false } },
                      'postcss-loader',
<<<<<<< HEAD
                      sassLoader,
=======
                      'sass-loader',
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
                    ],
                    exclude: /node_modules/,
                  },
                  {
                    test: /\.css$/,
                    use: [
                      MiniCssExtractPlugin.loader,
                      { loader: 'css-loader', options: { url: false } },
                      'postcss-loader',
                    ],
                    exclude: /node_modules/,
                  },
                ] as any[]),
          ),
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js', '.tsx', '.jsx', '.css'],
      plugins: [
        new TsconfigPathsPlugin({
          extensions: ['.ts', '.js', '.tsx', '.jsx'],
          configFile: path.join(import.meta.dirname, 'tsconfig.json'),
        }),
      ],
      alias: {},
    },
    plugins: (entry.html === undefined
      ? [new MiniCssExtractPlugin()]
      : [
          new HtmlWebpackPlugin({
<<<<<<< HEAD
            ...(jquery_load_ui
              ? {
                  templateContent: () =>
                    _.template(fs.readFileSync(path.join(import.meta.dirname, entry.html!), 'utf8'))({
                      BASE_HREF: tavern_embed_base_href(is_production_build),
                    }),
                }
              : {
                  template: path.join(import.meta.dirname, entry.html),
                }),
            filename: path.parse(entry.html!).base.replace(/\.ejs$/i, '.html'),
            scriptLoading: jquery_load_ui ? 'blocking' : 'module',
            cache: false,
          }),
          ...(jquery_load_ui ? [] : [new HtmlInlineScriptWebpackPlugin()]),
          ...(jquery_load_ui ? [pack_jquery_load_ui_html_for_cross_origin_load()] : []),
=======
            template: path.join(import.meta.dirname, entry.html),
            filename: path.parse(entry.html).base,
            scriptLoading: 'module',
            cache: false,
          }),
          new HtmlInlineScriptWebpackPlugin(),
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
          new MiniCssExtractPlugin(),
          new HTMLInlineCSSWebpackPlugin({
            styleTagFactory({ style }: { style: string }) {
              return `<style>${style}</style>`;
            },
          }),
        ]
    )
      .concat(
        { apply: watch_tavern_helper },
        { apply: schema_dump },
        { apply: tavern_sync },
        new VueLoaderPlugin(),
        unpluginAutoImport({
          dts: true,
          dtsMode: 'overwrite',
          imports: [
            'vue',
            'pinia',
            '@vueuse/core',
            { from: 'dedent', imports: [['default', 'dedent']] },
            { from: 'klona', imports: ['klona'] },
            { from: 'vue-final-modal', imports: ['useModal'] },
            { from: 'zod', imports: ['z'] },
<<<<<<< HEAD
=======
            { from: 'type-fest', imports: [['*', 'TypeFest']], type: true },
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
          ],
        }),
        unpluginVueComponents({
          dts: true,
          syncMode: 'overwrite',
          // globs: ['src/panel/component/*.vue'],
          resolvers: [VueUseComponentsResolver(), VueUseDirectiveResolver()],
        }),
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
        new webpack.DefinePlugin({
          __VUE_OPTIONS_API__: false,
          __VUE_PROD_DEVTOOLS__: process.env.CI !== 'true',
          __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
        }),
      )
      .concat(
        should_obfuscate
          ? [
              new WebpackObfuscator({
                controlFlowFlattening: true,
                numbersToExpressions: true,
                selfDefending: true,
                simplify: true,
                splitStrings: true,
                seed: 1,
              }),
            ]
          : [],
      ),
    optimization: {
      minimize: true,
      minimizer: [
        argv.mode === 'production'
          ? new TerserPlugin({
              terserOptions: { format: { quote_style: 1 }, mangle: { reserved: ['_', 'toastr', 'YAML', '$', 'z'] } },
            })
          : new TerserPlugin({
              extractComments: false,
              terserOptions: {
                format: { beautify: true, indent_level: 2 },
                compress: false,
                mangle: false,
              },
            }),
      ],
      splitChunks: {
        chunks: 'async',
        minSize: 20000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
          },
          default: {
            name: 'default',
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    },
    externals: ({ context, request }, callback) => {
      if (!context || !request) {
        return callback();
      }

      if (
        request.startsWith('-') ||
        request.startsWith('.') ||
        request.startsWith('/') ||
        request.startsWith('!') ||
        request.startsWith('http') ||
        request.startsWith('@/') ||
        request.startsWith('@util/') ||
        path.isAbsolute(request) ||
        fs.existsSync(path.join(context, request)) ||
        fs.existsSync(request)
      ) {
        return callback();
      }

      if (
        ['vue', 'vue-router'].every(key => request !== key) &&
        ['pixi', 'react', 'vue'].some(key => request.includes(key))
      ) {
        return callback();
      }
<<<<<<< HEAD
      /* 独立打开 Live Server 的 index.html 时不存在酒馆注入的全局 $ / z / YAML 等，须先于 global 映射整体打进包 */
      if (jquery_load_ui) {
        return callback();
      }
=======
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
      const global = {
        jquery: '$',
        lodash: '_',
        showdown: 'showdown',
        toastr: 'toastr',
        vue: 'Vue',
        'vue-router': 'VueRouter',
        yaml: 'YAML',
        zod: 'z',
      };
      if (request in global) {
        return callback(null, 'var ' + global[request as keyof typeof global]);
      }
      const cdn = {
        sass: 'https://jspm.dev/sass',
      };
      return callback(
        null,
        'module-import ' + (cdn[request as keyof typeof cdn] ?? `https://testingcf.jsdelivr.net/npm/${request}/+esm`),
      );
    },
<<<<<<< HEAD
  };
  };
=======
  });
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
}

export default config.entries.map(parse_configuration);
