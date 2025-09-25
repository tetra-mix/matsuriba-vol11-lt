import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import UnoCSS from 'unocss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import viteCompression from "vite-plugin-compression"

export default defineConfig({
  plugins: [
    preact(),
    UnoCSS(),
    viteSingleFile(),
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",        // 出力を .gz にする
      deleteOriginFile: false, // trueにすると .html を消して .gz だけ残す
    }),
  ],
  build: {
    target: 'es2017',           // 出力するJSのターゲット（古すぎず軽め）
    minify: 'esbuild',          // esbuildで高速圧縮
    sourcemap: false,           // ソースマップは不要
    cssCodeSplit: false,        // CSSを別ファイルにせずまとめる
    assetsInlineLimit: 1000000, // 画像等をBase64でインライン化（実質すべてまとめる）
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',      // 出力ファイル名を固定
        chunkFileNames: 'index.js',      // チャンク分割を防ぐ
        assetFileNames: 'index.[ext]'    // アセットも固定
      }
    }
  }
})
