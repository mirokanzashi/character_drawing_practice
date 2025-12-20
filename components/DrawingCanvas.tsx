
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { BrushSettings } from '../types';

/**
 * プロフェッショナル仕様の描画キャンバスコンポーネント
 * 物理解像度(DPR)への対応、Undo機能、座標変換、厳密な線の太さ維持を実装しています。
 */

interface DrawingCanvasProps {
  brush: BrushSettings;
  isFlipped: boolean;
  overlayImage?: string | null;
  overlayOpacity: number;
}

export interface DrawingCanvasHandle {
  clear: () => void;
  undo: () => void;
  getDataUrl: () => string;
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>((props, ref) => {
  const { brush, isFlipped, overlayImage, overlayOpacity } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Undo用履歴スタック (Base64画像データの配列)
  const [history, setHistory] = useState<string[]>([]);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  /**
   * キャンバスの初期化と解像度調整
   * devicePixelRatio を考慮し、Retinaディスプレイ等でも線がぼやけないように物理解像度を設定します。
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // 物理ピクセルサイズを設定
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // コンテキストを論理ピクセル（CSS上のサイズ）に合わせてスケール
      context.scale(dpr, dpr);
      
      // 基本の描画設定
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      
      // リサイズ時に消えないよう、履歴がある場合は再描画、なければ白で塗りつぶし
      if (history.length > 0) {
        const img = new Image();
        img.onload = () => {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, rect.width, rect.height);
          context.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = history[history.length - 1];
      } else {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, rect.width, rect.height);
      }
      
      setCtx(context);
    };

    // 親要素のリサイズを監視
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    updateCanvasSize();
    return () => resizeObserver.disconnect();
  }, [history.length === 0]); 

  /**
   * 親コンポーネント(App.tsx)から呼び出し可能なメソッドを公開
   */
  useImperativeHandle(ref, () => ({
    clear: () => {
      if (!ctx || !canvasRef.current) return;
      saveToHistory();
      const rect = canvasRef.current.getBoundingClientRect();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
    },
    undo: () => {
      if (history.length === 0 || !ctx || !canvasRef.current) return;
      const lastState = history[history.length - 1];
      const rect = canvasRef.current.getBoundingClientRect();
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = lastState;
      setHistory(prev => prev.slice(0, -1));
    },
    getDataUrl: () => canvasRef.current?.toDataURL('image/png') || '',
  }));

  /**
   * 現在の状態を履歴に保存 (Undo機能用)
   */
  const saveToHistory = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL();
    setHistory(prev => [...prev.slice(-24), dataUrl]); // 最大25世代
  };

  /**
   * スクリーン座標をキャンバス内の論理座標に変換
   * 反転表示時のズレをここで数学的に解消します。
   */
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    // キャンバスが左右反転(CSS scaleX(-1))されている場合、入力座標も反転させる
    if (isFlipped) {
      x = rect.width - x;
    }
    
    return { x, y };
  };

  /**
   * 描画開始処理
   * 線が途切れないよう、始点に対して即座に1pxのストロークを行います。
   */
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    saveToHistory();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // 筆圧や速度に依存しない「絶対的な太さ」を強制設定
    ctx.lineWidth = brush.size;
    ctx.strokeStyle = brush.isEraser ? '#ffffff' : brush.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 点として描画されるように始点で短い線を描く
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  /**
   * マウス移動中の描画処理
   * moveTo/lineTo を繋いで滑らかなパスを作成します。
   */
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx) return;
    const { x, y } = getCoordinates(e);
    
    // 設定を再適用して一貫性を保持
    ctx.lineWidth = brush.size;
    ctx.strokeStyle = brush.isEraser ? '#ffffff' : brush.color;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    ctx?.closePath();
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-white rounded-lg overflow-hidden shadow-inner touch-none">
      {/* お手本の透過オーバーレイ表示 (描画不可、最前面) */}
      {overlayImage && (
        <img 
          src={overlayImage} 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
          style={{ opacity: overlayOpacity, transform: isFlipped ? 'scaleX(-1)' : 'none' }}
          alt="overlay"
        />
      )}
      {/* 描画メインキャンバス */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair block"
        style={{ transform: isFlipped ? 'scaleX(-1)' : 'none' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
});

export default DrawingCanvas;
