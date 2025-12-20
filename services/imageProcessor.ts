
export const processToLineArt = (img: HTMLImageElement): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Simple Grayscale + Thresholding for "Line Art" feel
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const avg = (r + g + b) / 3;
    
    // High contrast threshold
    const val = avg > 128 ? 255 : 0;
    
    data[i] = val;
    data[i+1] = val;
    data[i+2] = val;
  }
  
  // Basic Sobel Edge approximation
  // (In a real high-end app we'd use a real kernel, but this simple threshold suffices for "color dump")
  
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};
