# 🤖 Roo Code (Cline) 専用 開発継続ガイド

このドキュメントは、VS Code 拡張機能 **Roo Code (旧 Cline)** を使って、AIと共にこのプロジェクトの機能追加や改修を自律的に進めるための設定ガイドです。

---

## 1. Roo Code の API 連携設定

Roo Code の設定画面（歯車アイコン）で以下のように設定してください。

1.  **API Provider**: `Google AI Studio` を選択。
2.  **API Key**: 取得した `Gemini API Key` を貼り付け。
3.  **Model**: `gemini-1.5-pro` または `gemini-2.0-flash-thinking-exp`（思考力の高いモデルを推奨）を選択。

---

## 2. カスタムインストラクション (Custom Instructions)

Roo Code の設定にある **"Custom Instructions"** 欄に、以下のテキストをコピー＆ペーストしてください。これにより、AIがプロジェクトの「魂」を理解した状態で開発に参加します。

```text
# プロジェクト概要: Character Copying Application
初心者がキャラクター模写を練習するための高機能Webアプリ。

# 技術スタック
- React 19 / TypeScript / Tailwind CSS / Lucide-react
- Canvas API (High-DPI / devicePixelRatio 対応済み)
- Google Gemini API (添削・画像解析用)
- IndexedDB (練習履歴の永続化)

# AIが厳守すべき実装ルール
1. 座標計算の死守: 
   DrawingCanvas.tsx 内の getCoordinates 関数は、devicePixelRatio と CSS の scaleX(-1) 反転を考慮した精密な変換ロジックです。ここを改変する際は、描画位置とカーソルが1ピクセルもズレないよう、数学的な検証を必ず行ってください。
2. 描画の安定性: 
   線の太さは brush.size に厳密に従い、筆圧や速度による変動を許さない描画エンジン仕様を維持してください。
3. 線画抽出ロジック: 
   utils/filters.ts の Sobel フィルタは、白背景に黒線の出力を前提としています。パラメータ（sensitivity, contrast, threshold）の連動性を壊さないでください。
4. UI/UX: 
   ダークモード基調、日本語UI、アニメーション（Tailwind / animate-in）を多用した洗練されたデザインを継承してください。
5. 環境変数: 
   Gemini API を呼び出す際は必ず process.env.API_KEY を使用し、直接キーをソースに埋め込まないでください。

# 開発プロセス
- コードを変更した後は、必ず「ブラウザで座標のズレや反転時の挙動が正常か」を確認するよう、ユーザーにテストを促してください。
```

---

## 3. 最初の命令例 (Initial Prompt)

Roo Code を起動し、最初に以下の文章をチャット欄に投げかけてください。AIが現状を把握し、開発の準備が整います。

> 「現在のプロジェクトファイルをすべて読み込み、特に `DrawingCanvas.tsx` の座標変換ロジックと `App.tsx` の状態管理、`utils/filters.ts` の画像処理ロジックを分析して、現在の仕様を正しく理解したか報告してください。その後、開発を再開する準備ができたか教えてください。」

---



