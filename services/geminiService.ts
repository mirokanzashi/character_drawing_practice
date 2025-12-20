import { GoogleGenAI } from "@google/genai";

/**
 * AIお絵描き添削サービス
 */
export const reviewDrawing = async (refImage: string, userDrawing: string): Promise<string> => {
  // Mandatory: Initialize GoogleGenAI directly with process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `あなたはプロのお絵描き講師です。左側の参照画像（線画）と右側の初心者の模写を比較し、構造やバランスについて日本語でアドバイスしてください。
具体的には：
1. パーツの配置の正確さ
2. 線画の強弱や勢い
3. 次回への具体的な改善ステップ
を、温かいトーンで教えてください。`;

  try {
    // 画像データ(Base64)から、APIが受け取れる純粋なバイナリ部分を抽出
    const refData = refImage.split(',')[1];
    const drawData = userDrawing.split(',')[1];

    // Using gemini-3-pro-preview for complex reasoning task (artistic critique)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: refData, mimeType: 'image/png' } },
          { inlineData: { data: drawData, mimeType: 'image/png' } },
          { text: prompt }
        ]
      }
    });

    // Access the .text property directly as per the latest SDK specification
    return response.text || "AIからの回答が空でした。もう一度お試しください。";
  } catch (error) {
    console.error("AI Review failed:", error);
    // Generic error message without requesting user to update API keys or .env files
    return "AI添削中にエラーが発生しました。インターネット接続や入力画像を確認してください。";
  }
};
