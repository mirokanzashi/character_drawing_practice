# 🎨 Character Copying Application

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)](https://tailwindcss.com/)
[![Gemini API](https://img.shields.io/badge/AI-Gemini_3_Pro-orange.svg)](https://aistudio.google.com/)

**好きなキャラクターを、もっと正確に、もっと楽しく。**  
Character Copying Applicationは、初心者が特定のキャラクターを「似せて描く」ことに特化した、高機能な模写練習支援Webアプリです。

---

## 🌟 主な機能

### 🛠 高精度エッジ抽出（Sobelフィルタ）
独自のSobelフィルタ実装により、単純な二値化では潰れがちな**「黒髪」や「黒服」の境界線**も鮮明に抽出。どんなキャラクター画像も、一瞬で最適な「線画お手本」に変換します。

### 🔍 透過オーバーレイ機能
お手本の線画をキャンバス上に透過させて重ねることが可能。スライダーで透明度を調整し、自分の線とお手本の線の「ミリ単位のズレ」をリアルタイムで確認しながら練習できます。

### ✍️ プロ仕様の描画エンジン
- **厳密な座標一致**: 画面解像度（DPR）を考慮した計算により、ペン先と描画位置のズレを完全に排除。
- **左右反転機能**: ゲシュタルト崩壊を防ぐため、お手本と自分の絵を個別に、あるいは同時に反転させてバランスを確認できます。
- **Undo/Clear**: 25段階の履歴管理で、失敗を恐れずに描画できます。

### 🤖 Gemini AI 添削 & 履歴管理
- **AIアドバイス**: Google Gemini API（Gemini 3 Pro）が、お手本とあなたの絵を比較。パーツの配置やシルエットの改善点を、プロの講師のように日本語で具体的にアドバイスします。
- **ギャラリー機能**: 描いた絵はIndexedDBに自動保存。上達のプロセスをいつでも振り返ることができます。

---

## 💡 開発の動機
「大好きなキャラを描きたいけれど、どこがズレているのか自分では分からない…」  
そんな悩みを解決するために開発しました。ネットで見つけたお気に入りのイラストやゲームのスクリーンショットを、そのまま「最高の練習下書き」に変え、最短距離での上達をサポートします。

---

## 🚀 クイックスタート（ローカル起動）

### 1. 準備
Node.jsがインストールされていることを確認してください。

```bash
# プロジェクトのクローン（またはフォルダの作成）
git clone <your-repo-url>
cd art-tutor-pro

# 依存関係のインストール
npm install
```

### 2. APIキーの設定
プロジェクトのルートディレクトリに `.env` ファイルを作成し、Gemini APIキーを記述します。

```env
API_KEY=あなたのGemini_APIキー
```
※キーは [Google AI Studio](https://aistudio.google.com/app/apikey) で無料で取得可能です。

### 3. 起動
```bash
npm run dev
```
ブラウザで `http://localhost:5173` を開けば、すぐに練習を始められます。

---

## 今後の改修・拡張のヒント
- 練習した絵をSNS共有用に、お手本と並べた1枚の画像として保存する機能
- グリッド線を表示して、パーツの比率を取りやすくする補助機能
- 戻るボタンの削除
- 履歴ページに遷移して、また戻すときに描いた内容を保持する
- 保存機能を追加する
- AI添削機能追加

---

## 🛠 技術スタック

| カテゴリ | 使用技術 | 役割 |
| :--- | :--- | :--- |
| **Frontend** | React 19 / TypeScript | UIコンポーネント管理・状態制御 |
| **Styling** | Tailwind CSS | ダークモード基調の洗練されたUI設計 |
| **Canvas** | HTML5 Canvas API | 高速・高精度な描画エンジンの構築 |
| **AI Engine** | Google Gemini API | 画像解析による構造的なフィードバック |
| **Storage** | IndexedDB | ブラウザ内での描画データ永続化 |
| **Build Tool**| Vite | 高速な開発環境とバンドル |

---

## 🤝 開発者の方へ
このプロジェクトは、AI（Roo Code / Gemini）との協調開発を前提に構築されています。詳細な内部設計については [ROO_CODE_GUIDE.md](./ROO_CODE_GUIDE.md) および [SETUP_GUIDE.md](./SETUP_GUIDE.md) を参照してください。

---

## ⚖️ License & Terms
本プロジェクトは GNU Affero General Public License v3.0 (AGPL-3.0) の下で公開されています。

ソースコードの公開義務: 本アプリのコードを改変、または自身のプロジェクトに組み込んで公開（Webサービスとして公開する場合を含む）する場合、そのプロジェクト自体のソースコードも同じ AGPL ライセンスで公開する法的義務が生じます。

著作権表示: 改変後も、オリジナルの作者（mirokanzashi）の著作権表示を保持する必要があります。

商用利用: ソースコードの公開義務を遵守する限りにおいて、商用利用も可能です。
