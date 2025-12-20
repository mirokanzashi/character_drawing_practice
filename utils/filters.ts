
/**
 * Sobelエッジ検出フィルタを用いた線画抽出関数
 * 
 * @param ctx 抽出元のCanvas 2Dコンテキスト
 * @param width キャンバス幅
 * @param height キャンバス高
 * @param sensitivity 勾配感度 (数値を上げると細かい線を拾う)
 * @param contrast 線のコントラスト (数値を上げるとハッキリする)
 * @param threshold 抽出の閾値 (数値を上げると暗い部分を無視する)
 * @returns 線画化された画像のDataURL (Base64)
 */
export const applySobelFilter = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sensitivity: number,
  contrast: number,
  threshold: number
): string => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const grayData = new Uint8ClampedArray(width * height);

  // 1. グレースケール変換 (輝度計算)
  // 人間の目の感度に近いITU-R 601係数を使用
  for (let i = 0; i < data.length; i += 4) {
    grayData[i / 4] = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
  }

  const output = ctx.createImageData(width, height);
  const outData = output.data;

  // Sobel 勾配カーネル
  // 水平方向(gx)と垂直方向(gy)の色の変化を抽出
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let valX = 0;
      let valY = 0;

      // 3x3ピクセルの近傍に対してカーネル演算を適用
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = grayData[(y + ky) * width + (x + kx)];
          valX += pixel * gx[(ky + 1) * 3 + (kx + 1)];
          valY += pixel * gy[(ky + 1) * 3 + (kx + 1)];
        }
      }

      // 勾配の強度（エッジの強さ）を算出
      let magnitude = Math.sqrt(valX * valX + valY * valY);
      
      // ユーザー設定による補正を適用
      magnitude *= sensitivity;

      // 閾値を引き、コントラストを強調する
      magnitude = (magnitude - threshold) * contrast;
      magnitude = Math.min(255, Math.max(0, magnitude));

      // 最終結果: 白背景(255)から勾配強度を引くことで、エッジを黒く表示
      const finalVal = 255 - magnitude;
      const idx = (y * width + x) * 4;
      outData[idx] = finalVal;
      outData[idx + 1] = finalVal;
      outData[idx + 2] = finalVal;
      outData[idx + 3] = 255; // アルファ値は100%
    }
  }

  // 結果を一時的なキャンバスに書き戻し、DataURLとして返却
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx?.putImageData(output, 0, 0);
  return tempCanvas.toDataURL();
};
