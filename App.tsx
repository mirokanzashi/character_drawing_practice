
import React, { useState, useRef, useEffect } from 'react';
import { 
  Pencil, 
  Eraser, 
  Undo2, 
  Trash2, 
  Upload, 
  FlipHorizontal, 
  Sparkles, 
  Settings2, 
  History,
  Info,
  ChevronRight
} from 'lucide-react';
import { BrushSettings, ProcessorSettings, PracticeSession } from './types';
import DrawingCanvas, { DrawingCanvasHandle } from './components/DrawingCanvas';
import { applySobelFilter } from './utils/filters';
import { reviewDrawing } from './services/geminiService';
import { saveSession, getSessions } from './services/db';

/**
 * アプリケーション全体のエントリポイント
 * ビューの切り替え、画像読み込み、フィルタ適用、AI添削、DB保存を統括します。
 */
const App: React.FC = () => {
  // UI状態: practice (練習画面) / gallery (履歴一覧)
  const [view, setView] = useState<'practice' | 'gallery'>('practice');
  
  // 画像データ状態
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  
  // 表示設定 (透過度、反転状態)
  const [overlayOpacity, setOverlayOpacity] = useState(0.2);
  const [refFlipped, setRefFlipped] = useState(false);
  const [canvasFlipped, setCanvasFlipped] = useState(false);
  
  // ブラシ設定
  const [brush, setBrush] = useState<BrushSettings>({
    color: '#000000',
    size: 3,
    isEraser: false
  });

  // 線画抽出フィルタ設定
  const [filterSettings, setFilterSettings] = useState<ProcessorSettings>({
    sensitivity: 5.0,
    contrast: 3.0,
    threshold: 15
  });

  // AI添削・保存履歴状態
  const [isReviewing, setIsReviewing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);

  // DOM参照
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初期ロード時に履歴をIndexedDBから取得
  useEffect(() => {
    loadSessions();
  }, []);

  // 設定変更時にお手本画像をリアルタイム更新
  useEffect(() => {
    if (originalImage) {
      updateProcessedImage();
    }
  }, [filterSettings, originalImage]);

  const loadSessions = async () => {
    const data = await getSessions();
    setSessions(data);
  };

  /**
   * ユーザー指定の画像を読み込み
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setOriginalImage(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  /**
   * オリジナル画像にエッジ検出フィルタを適用
   */
  const updateProcessedImage = () => {
    if (!originalImage) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const lineArt = applySobelFilter(
        ctx, 
        canvas.width, 
        canvas.height, 
        filterSettings.sensitivity, 
        filterSettings.contrast, 
        filterSettings.threshold
      );
      setProcessedImage(lineArt);
    };
    img.src = originalImage;
  };

  /**
   * Gemini API を使用して添削を実行し、結果を保存
   */
  const handleAIReview = async () => {
    if (!processedImage || !canvasRef.current) return;
    setIsReviewing(true);
    const userDrawing = canvasRef.current.getDataUrl();
    const advice = await reviewDrawing(processedImage, userDrawing);
    setFeedback(advice);
    setIsReviewing(false);

    // IndexedDBへの永続化
    const newSession: PracticeSession = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      referenceImage: processedImage,
      userDrawing: userDrawing,
      feedback: advice
    };
    await saveSession(newSession);
    loadSessions();
  };

  return (
    <div className="flex flex-col h-screen font-sans selection:bg-blue-600">
      {/* 共通ヘッダー */}
      <header className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Character Copying Application
          </h1>
          <nav className="flex bg-zinc-800 p-1 rounded-lg">
            <button 
              onClick={() => setView('practice')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'practice' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
            >
              <Pencil size={16} /> 練習
            </button>
            <button 
              onClick={() => setView('gallery')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'gallery' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
            >
              <History size={16} /> ギャラリー
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {view === 'practice' && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
            >
              <Upload size={16} /> 画像を読み込む
            </button>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
        </div>
      </header>

      {view === 'practice' ? (
        <div className="flex flex-1 overflow-hidden">
          {/* 左サイドバー: ツール・フィルタ調整 */}
          <aside className="w-80 bg-zinc-900 border-r border-zinc-800 overflow-y-auto p-6 flex flex-col gap-8 shrink-0">
            {/* ブラシ操作ツール */}
            <section>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Settings2 size={14} /> ツール設定
              </h3>
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => setBrush(prev => ({ ...prev, isEraser: false }))}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${!brush.isEraser ? 'bg-zinc-100 text-zinc-950 border-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                >
                  <Pencil size={20} />
                  <span className="text-[10px] font-bold">ペン</span>
                </button>
                <button 
                  onClick={() => setBrush(prev => ({ ...prev, isEraser: true }))}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${brush.isEraser ? 'bg-zinc-100 text-zinc-950 border-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                >
                  <Eraser size={20} />
                  <span className="text-[10px] font-bold">消しゴム</span>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-zinc-400 mb-1">
                    <span>ブラシサイズ</span>
                    <span>{brush.size}px</span>
                  </div>
                  <input 
                    type="range" min="1" max="50" value={brush.size}
                    onChange={(e) => setBrush(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                {!brush.isEraser && (
                  <div>
                    <span className="text-[11px] font-medium text-zinc-400 block mb-2">カラー</span>
                    <input 
                      type="color" value={brush.color}
                      onChange={(e) => setBrush(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-10 bg-zinc-800 border-none rounded-lg cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* エッジ抽出調整ツール */}
            <section className={`${!originalImage ? 'opacity-30 pointer-events-none' : ''}`}>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles size={14} /> エッジ抽出設定
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'エッジ感度', key: 'sensitivity', min: 1, max: 20, step: 0.1 },
                  { label: 'コントラスト', key: 'contrast', min: 1, max: 10, step: 0.1 },
                  { label: 'しきい値', key: 'threshold', min: 0, max: 100, step: 1 }
                ].map((f) => (
                  <div key={f.key}>
                    <div className="flex justify-between text-[11px] font-medium text-zinc-400 mb-1">
                      <span>{f.label}</span>
                      <span>{filterSettings[f.key as keyof ProcessorSettings]}</span>
                    </div>
                    <input 
                      type="range" min={f.min} max={f.max} step={f.step} 
                      value={filterSettings[f.key as keyof ProcessorSettings]}
                      onChange={(e) => setFilterSettings(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* 履歴操作ボタン */}
            <section className="mt-auto flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => canvasRef.current?.undo()}
                  className="flex items-center justify-center gap-2 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-bold transition-all"
                >
                  <Undo2 size={16} /> 戻る
                </button>
                <button 
                  onClick={() => canvasRef.current?.clear()}
                  className="flex items-center justify-center gap-2 py-3 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-400 text-sm font-bold transition-all border border-red-900/50"
                >
                  <Trash2 size={16} /> クリア
                </button>
              </div>
              <button 
                disabled={!processedImage || isReviewing}
                onClick={handleAIReview}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-bold text-base shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-3 mt-4"
              >
                {isReviewing ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <><Sparkles size={20} /> AI添削を受ける</>
                )}
              </button>
            </section>
          </aside>

          {/* 右メイン: キャンバス・ワークスペース */}
          <main className="flex-1 flex flex-col bg-zinc-950 p-6 relative">
            {/* 上部ツールバー: 表示設定 */}
            <div className="flex items-center justify-center gap-6 mb-6 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800 backdrop-blur-md self-center">
              <div className="flex items-center gap-3 pr-6 border-r border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">透過表示</span>
                <input 
                  type="range" min="0" max="1" step="0.01" value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-32 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setRefFlipped(!refFlipped)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${refFlipped ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                >
                  <FlipHorizontal size={14} /> お手本を反転
                </button>
                <button 
                  onClick={() => setCanvasFlipped(!canvasFlipped)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${canvasFlipped ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                >
                  <FlipHorizontal size={14} /> 絵を反転
                </button>
              </div>
            </div>

            {/* お手本とキャンバスの2画面分割ビュー */}
            <div className="flex-1 flex gap-6 min-h-0">
              {/* 左側: お手本(線画抽出済み画像) */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">お手本 (線画抽出)</span>
                </div>
                <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-2xl relative">
                  {processedImage ? (
                    <img 
                      src={processedImage} 
                      className="w-full h-full object-contain" 
                      style={{ transform: refFlipped ? 'scaleX(-1)' : 'none' }}
                      alt="reference"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-4 p-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center opacity-10">
                         <Upload size={32} color="black" />
                      </div>
                      <p className="text-sm">画像を読み込んで練習を開始</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 右側: ユーザー描画エリア */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">キャンバス</span>
                </div>
                <div className="flex-1 relative rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
                  <DrawingCanvas 
                    ref={canvasRef}
                    brush={brush}
                    isFlipped={canvasFlipped}
                    overlayImage={processedImage}
                    overlayOpacity={overlayOpacity}
                  />
                </div>
              </div>
            </div>

            {/* フィードバック表示用ポップオーバー */}
            {feedback && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="bg-zinc-900 border border-blue-500/30 rounded-3xl shadow-2xl p-8 backdrop-blur-xl relative overflow-hidden group">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">AIお絵描き講師のフィードバック</h3>
                        <p className="text-xs text-zinc-500 font-medium">Gemini 3 Flash ・ 構造解析</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setFeedback(null)}
                      className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-[30vh] overflow-y-auto text-sm pr-4 scrollbar-thin scrollbar-thumb-zinc-800">
                    {feedback}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      ) : (
        /* ギャラリービュー */
        <main className="flex-1 p-10 bg-zinc-950 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-10 flex items-center gap-4">
              練習の軌跡
            </h2>
            
            {sessions.length === 0 ? (
              <div className="text-center py-32 bg-zinc-900/50 rounded-3xl border border-zinc-800 border-dashed">
                <p className="text-zinc-500">履歴がありません。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {sessions.map(s => (
                  <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden group hover:border-zinc-700 transition-all shadow-xl">
                    <div className="flex h-56 bg-white relative">
                      <div className="flex-1 border-r border-zinc-100 overflow-hidden relative">
                        <img src={s.referenceImage} className="w-full h-full object-contain p-2" alt="ref" />
                      </div>
                      <div className="flex-1 overflow-hidden relative">
                        <img src={s.userDrawing} className="w-full h-full object-contain p-2" alt="user" />
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-zinc-500">{new Date(s.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-zinc-400 leading-relaxed italic bg-zinc-950 p-4 rounded-xl border border-zinc-800 line-clamp-3">
                        {s.feedback}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
};

export default App;
