'use client'

import { useState, useRef, useCallback } from 'react'

// ─── バナーサイズ定義 ─────────────────────────────────────────────────────────
const BANNER_SIZES = [
  // 横長・縦長
  { label: 'PC横長 (1456×180)',       width: 1456, height: 180,  aspect: '1456/180', group: '横長バナー' },
  { label: 'PC特集バナー (960×400)',   width: 960,  height: 400,  aspect: '960/400',  group: '横長バナー' },
  { label: 'SPバナー (640×200)',       width: 640,  height: 200,  aspect: '640/200',  group: '横長バナー' },
  { label: 'SPカテゴリ (750×250)',     width: 750,  height: 250,  aspect: '750/250',  group: '横長バナー' },
  // スクエア
  { label: '商品画像 (1000×1000)',     width: 1000, height: 1000, aspect: '1/1',      group: 'スクエア' },
  { label: 'PCスクエア (400×400)',     width: 400,  height: 400,  aspect: '1/1',      group: 'スクエア' },
] as const

type BannerSize = typeof BANNER_SIZES[number]

// ─── カテゴリ ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  '食品・飲料', '美容・コスメ', 'ファッション', '家電・PC',
  'スポーツ・アウトドア', 'インテリア・家具', 'ベビー・マタニティ', 'その他',
]

// ─── クイックカラー ───────────────────────────────────────────────────────────
const QUICK_COLORS = ['#bf0000', '#1a1a2e', '#0f3460', '#2d6a4f', '#e76f51', '#264653']

// ─── フォントスタイル ─────────────────────────────────────────────────────────
const FONT_STYLES = [
  {
    id: 'gothic' as const,
    label: 'ゴシック体',
    desc: 'Noto Sans JP',
    cssVar: 'var(--font-noto-sans-jp)',
    // Canvas fallback: Windows/Mac ゴシック系
    canvasStack: '"Noto Sans JP", "Yu Gothic UI", "Yu Gothic", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif',
  },
  {
    id: 'mincho' as const,
    label: '明朝体',
    desc: 'Shippori Mincho',
    cssVar: 'var(--font-shippori-mincho)',
    // Canvas fallback: Windows/Mac 明朝系
    canvasStack: '"Shippori Mincho", "Yu Mincho", "Hiragino Mincho ProN", "MS PMincho", serif',
  },
]
type FontStyleId = typeof FONT_STYLES[number]['id']

// ─── SVGスタンプ素材 ──────────────────────────────────────────────────────────
const STAMPS = [
  {
    id: 'free_shipping',
    label: '送料無料',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<circle cx="50" cy="50" r="48" fill="#CC0000"/>
<circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2" stroke-dasharray="5 3"/>
<text x="50" y="45" font-family="sans-serif" font-weight="900" font-size="20" fill="white" text-anchor="middle">送料</text>
<text x="50" y="70" font-family="sans-serif" font-weight="900" font-size="20" fill="white" text-anchor="middle">無料</text>
</svg>`,
  },
  {
    id: 'points_10x',
    label: 'ポイント10倍',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<path d="M50,3 L61,36 L96,36 L69,57 L80,90 L50,70 L20,90 L31,57 L4,36 L39,36Z" fill="#E8A000"/>
<path d="M50,12 L59,40 L87,40 L65,56 L73,83 L50,67 L27,83 L35,56 L13,40 L41,40Z" fill="#F5C400"/>
<text x="50" y="50" font-family="sans-serif" font-weight="900" font-size="11" fill="white" text-anchor="middle">ポイント</text>
<text x="50" y="66" font-family="sans-serif" font-weight="900" font-size="16" fill="white" text-anchor="middle">10倍!</text>
</svg>`,
  },
  {
    id: 'limited',
    label: '期間限定',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<polygon points="50,4 96,28 96,72 50,96 4,72 4,28" fill="#1D4ED8"/>
<polygon points="50,11 89,32 89,68 50,89 11,68 11,32" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
<text x="50" y="48" font-family="sans-serif" font-weight="900" font-size="13" fill="white" text-anchor="middle">期間</text>
<text x="50" y="66" font-family="sans-serif" font-weight="900" font-size="13" fill="white" text-anchor="middle">限定</text>
</svg>`,
  },
  {
    id: 'new_arrival',
    label: '新登場',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<rect x="4" y="4" width="92" height="92" rx="20" fill="#059669"/>
<rect x="10" y="10" width="80" height="80" rx="15" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
<text x="50" y="46" font-family="sans-serif" font-weight="900" font-size="15" fill="white" text-anchor="middle">新</text>
<text x="50" y="67" font-family="sans-serif" font-weight="900" font-size="15" fill="white" text-anchor="middle">登場</text>
</svg>`,
  },
  {
    id: 'sale',
    label: 'SALE中',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<path d="M50,4 L96,50 L50,96 L4,50Z" fill="#DC2626"/>
<path d="M50,13 L87,50 L50,87 L13,50Z" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
<text x="50" y="46" font-family="sans-serif" font-weight="900" font-size="15" fill="white" text-anchor="middle">SALE</text>
<text x="50" y="65" font-family="sans-serif" font-weight="900" font-size="12" fill="white" text-anchor="middle">開催中</text>
</svg>`,
  },
]

// ─── スタンプ配置位置 ─────────────────────────────────────────────────────────
const STAMP_POSITIONS = [
  { id: 'top-left',     label: '左上', row: 0, col: 0 },
  { id: 'top-right',    label: '右上', row: 0, col: 1 },
  { id: 'bottom-left',  label: '左下', row: 1, col: 0 },
  { id: 'bottom-right', label: '右下', row: 1, col: 1 },
] as const
type StampPosition = typeof STAMP_POSITIONS[number]['id']

const PROGRESS_STEPS = ['プロンプト最適化', '画像生成中', '後処理'] as const

// ─── 型定義 ───────────────────────────────────────────────────────────────────
type GeneratedImage = {
  id: string
  size: BannerSize
  dataUrl: string
  usedAspectRatio: string
  reasoning?: ReasoningPoint[]
  imageSource?: string
}

type FormData = {
  productName: string
  category: string
  target: string
  appealText: string
  mainColor: string
}

type OverlaySettings = {
  hAlign: 'left' | 'center' | 'right'
  vAlign: 'top' | 'bottom'
  textColor: 'white' | 'black'
}

type ReasoningPoint = { icon: string; title: string; body: string }

// ─── ユーティリティ ───────────────────────────────────────────────────────────

const svgToDataUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const char of [...text]) {
    const candidate = line + char
    if (ctx.measureText(candidate).width > maxWidth && line.length > 0) {
      lines.push(line)
      line = char
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = src
  })
}

// ─── Canvas合成エンジン ───────────────────────────────────────────────────────
async function renderToCanvas(
  img: GeneratedImage,
  text: string,
  overlay: OverlaySettings,
  fontStyleId: FontStyleId,
  stampId: string | null,
  stampPosition: StampPosition,
): Promise<HTMLCanvasElement> {
  const { width: cw, height: ch } = img.size
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')!

  // ── ① 背景画像 (object-cover) ──
  const bgImg = await loadImage(img.dataUrl)
  const iw = bgImg.naturalWidth, ih = bgImg.naturalHeight
  const canvasRatio = cw / ch, imgRatio = iw / ih
  let sx = 0, sy = 0, sw = iw, sh = ih
  if (imgRatio > canvasRatio) { sw = ih * canvasRatio; sx = (iw - sw) / 2 }
  else { sh = iw / canvasRatio; sy = (ih - sh) / 2 }
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, cw, ch)

  // ── ② テキスト描画 ──
  if (text.trim()) {
    const fontStyle = FONT_STYLES.find(f => f.id === fontStyleId)!
    const fontSize = Math.round(Math.max(18, Math.min(ch * 0.17, 80)))
    const lineHeight = fontSize * 1.35
    const padding = Math.round(Math.max(20, cw * 0.035))
    const maxTextWidth = cw * 0.60

    // Web フォントが読み込み済みなら使用、未読みなら Canvas は system font にフォールバック
    try { await document.fonts.load(`bold ${fontSize}px "${fontStyle.id === 'gothic' ? 'Noto Sans JP' : 'Shippori Mincho'}"`) } catch { /* fallback */ }

    ctx.font = `bold ${fontSize}px ${fontStyle.canvasStack}`
    ctx.textBaseline = 'alphabetic'

    const lines = wrapText(ctx, text, maxTextWidth)
    const blockH = lines.length * lineHeight

    let x = padding
    if (overlay.hAlign === 'center') { ctx.textAlign = 'center'; x = cw / 2 }
    else if (overlay.hAlign === 'right') { ctx.textAlign = 'right'; x = cw - padding }
    else ctx.textAlign = 'left'

    const y = overlay.vAlign === 'bottom'
      ? ch - padding - blockH + lineHeight * 0.82
      : padding + lineHeight * 0.88

    const strokeColor = overlay.textColor === 'white' ? 'rgba(0,0,0,0.88)' : 'rgba(255,255,255,0.88)'
    const fillColor   = overlay.textColor === 'white' ? '#ffffff' : '#111111'

    lines.forEach((line, i) => {
      const ly = y + i * lineHeight
      ctx.shadowColor = 'transparent'
      ctx.lineWidth = Math.max(2, fontSize * 0.10)
      ctx.lineJoin = 'round'
      ctx.strokeStyle = strokeColor
      ctx.strokeText(line, x, ly, maxTextWidth)
      ctx.shadowColor = strokeColor
      ctx.shadowBlur = fontSize * 0.22
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = Math.round(fontSize * 0.06)
      ctx.fillStyle = fillColor
      ctx.fillText(line, x, ly, maxTextWidth)
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
    })
  }

  // ── ③ スタンプ描画 ──
  if (stampId) {
    const stamp = STAMPS.find(s => s.id === stampId)
    if (stamp) {
      const stampSize = Math.min(Math.max(Math.min(cw, ch) * 0.26, 60), 180)
      const pad = Math.max(8, stampSize * 0.08)
      let sx2 = 0, sy2 = 0
      if (stampPosition === 'top-left')     { sx2 = pad;           sy2 = pad }
      if (stampPosition === 'top-right')    { sx2 = cw - stampSize - pad; sy2 = pad }
      if (stampPosition === 'bottom-left')  { sx2 = pad;           sy2 = ch - stampSize - pad }
      if (stampPosition === 'bottom-right') { sx2 = cw - stampSize - pad; sy2 = ch - stampSize - pad }
      const stampImg = await loadImage(svgToDataUrl(stamp.svg))
      ctx.drawImage(stampImg, sx2, sy2, stampSize, stampSize)
    }
  }

  return canvas
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────
export default function BannerGenerator() {
  const [form, setForm] = useState<FormData>({
    productName: '', category: '', target: '', appealText: '', mainColor: '#bf0000',
  })
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0)
  const [overlay, setOverlay] = useState<OverlaySettings>({ hAlign: 'left', vAlign: 'bottom', textColor: 'white' })
  const [fontStyleId, setFontStyleId] = useState<FontStyleId>('gothic')
  const [activeStamp, setActiveStamp] = useState<string | null>(null)
  const [stampPosition, setStampPosition] = useState<StampPosition>('top-right')

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [feedback, setFeedback] = useState<Record<string, 'good' | 'bad' | null>>({})
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [lastPrompt, setLastPrompt] = useState<string | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showReasoning, setShowReasoning] = useState<Record<string, boolean>>({})
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const validate = () => {
    const next: Partial<FormData> = {}
    if (!form.productName.trim()) next.productName = '商品名を入力してください'
    if (!form.appealText.trim())  next.appealText  = '訴求テキストを入力してください'
    if (!form.target.trim())      next.target      = 'ターゲットを入力してください'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const startProgress = () => {
    setProgress(0)
    progressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) return 85
        return Math.min(85, prev + (prev < 40 ? Math.random() * 8 : Math.random() * 3))
      })
    }, 600)
  }
  const stopProgress = (v = 100) => { clearInterval(progressRef.current!); setProgress(v) }

  const handleGenerate = useCallback(async () => {
    if (!validate()) return
    setGenerateError(null)
    setIsGenerating(true)
    startProgress()
    const size = BANNER_SIZES[selectedSizeIdx]
    // テキスト配置情報をAPIへ渡してネガティブスペースを最適化
    const textPosition = `${overlay.vAlign}-${overlay.hAlign}`
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.productName, category: form.category,
          target: form.target, catchcopy: form.appealText,
          color: form.mainColor, size, textPosition,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `サーバーエラー (${res.status})`)
      stopProgress(100)
      setLastPrompt(data.prompt ?? null)
      setGeneratedImages(prev => [{
        id: Date.now().toString(), size, dataUrl: data.imageDataUrl,
        usedAspectRatio: data.usedAspectRatio ?? '',
        reasoning: data.reasoning ?? [],
        imageSource: data.imageSource ?? 'pollinations',
      }, ...prev])
    } catch (err) {
      stopProgress(0)
      setGenerateError(err instanceof Error ? err.message : '生成に失敗しました')
    } finally { setIsGenerating(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, selectedSizeIdx, overlay])

  const downloadComposite = useCallback(async (img: GeneratedImage) => {
    setIsDownloading(img.id)
    try {
      const canvas = await renderToCanvas(img, form.appealText, overlay, fontStyleId, activeStamp, stampPosition)
      canvas.toBlob(blob => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `banner_${img.size.width}x${img.size.height}_final.jpg`
        a.click()
        URL.revokeObjectURL(url)
      }, 'image/jpeg', 0.93)
    } finally { setIsDownloading(null) }
  }, [form.appealText, overlay, fontStyleId, activeStamp, stampPosition])

  const downloadRaw = (img: GeneratedImage) => {
    const a = document.createElement('a')
    a.href = img.dataUrl
    a.download = `banner_${img.size.width}x${img.size.height}_raw.jpg`
    a.click()
  }

  const handleFeedback = (id: string, type: 'good' | 'bad') => {
    const newRating = feedback[id] === type ? null : type
    setFeedback(prev => ({ ...prev, [id]: newRating }))
    if (newRating !== null) {
      const img = generatedImages.find(i => i.id === id)
      try {
        const stored: unknown[] = JSON.parse(localStorage.getItem('pf_banner_feedback') ?? '[]')
        stored.push({
          id, timestamp: new Date().toISOString(), rating: newRating,
          params: {
            productName: form.productName, category: form.category,
            target: form.target, catchcopy: form.appealText, color: form.mainColor,
            size: img?.size.label ?? '', textPosition: `${overlay.vAlign}-${overlay.hAlign}`,
            fontStyle: fontStyleId, stamp: activeStamp,
          },
          prompt: lastPrompt,
        })
        localStorage.setItem('pf_banner_feedback', JSON.stringify(stored))
      } catch { /* ignore quota errors */ }
    }
  }

  const currentStep = progress < 30 ? 0 : progress < 70 ? 1 : 2

  // CSS プレビュー用
  const overlayAlignClass = { left: 'justify-start', center: 'justify-center', right: 'justify-end' }[overlay.hAlign]
  const overlayVClass = overlay.vAlign === 'top' ? 'items-start' : 'items-end'
  const textShadowCSS = overlay.textColor === 'white'
    ? '1px 1px 0 rgba(0,0,0,0.9),-1px -1px 0 rgba(0,0,0,0.9),1px -1px 0 rgba(0,0,0,0.9),-1px 1px 0 rgba(0,0,0,0.9),0 3px 10px rgba(0,0,0,0.6)'
    : '1px 1px 0 rgba(255,255,255,0.9),-1px -1px 0 rgba(255,255,255,0.9),1px -1px 0 rgba(255,255,255,0.9),-1px 1px 0 rgba(255,255,255,0.9)'
  const activeFontStyle = FONT_STYLES.find(f => f.id === fontStyleId)!
  const activeStampObj  = STAMPS.find(s => s.id === activeStamp)

  // スタンプ配置（プレビュー用CSS）
  const stampPositionStyle: Record<StampPosition, React.CSSProperties> = {
    'top-left':     { top: '6%', left: '4%' },
    'top-right':    { top: '6%', right: '4%' },
    'bottom-left':  { bottom: '6%', left: '4%' },
    'bottom-right': { bottom: '6%', right: '4%' },
  }

  // サイズグループ
  const sizeGroups = Array.from(new Set(BANNER_SIZES.map(s => s.group)))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">PF</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-none">クリエイティブ生成</p>
              <p className="text-xs text-gray-500 mt-0.5">楽天バナー・商品画像 AI生成ツール</p>
            </div>
          </div>
          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 font-medium">
            MVP v0.3 · Pollinations.ai
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ══════════ LEFT ══════════ */}
          <div className="lg:col-span-2 space-y-5">

            {/* ─ バナー情報 ─ */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">バナー情報の入力</h2>
              <div className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">商品名 <span className="text-red-500">*</span></label>
                  <input type="text" value={form.productName}
                    onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
                    placeholder="例：プレミアムローストコーヒー 200g"
                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none transition-colors
                      ${errors.productName ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
                  />
                  {errors.productName && <p className="text-red-500 text-xs mt-1">{errors.productName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">カテゴリ</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-colors">
                    <option value="">選択してください</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ターゲット <span className="text-red-500">*</span></label>
                  <input type="text" value={form.target}
                    onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                    placeholder="例：30〜40代の健康意識が高い男性"
                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none transition-colors
                      ${errors.target ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
                  />
                  {errors.target && <p className="text-red-500 text-xs mt-1">{errors.target}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">訴求テキスト（キャッチコピー）<span className="text-red-500">*</span></label>
                  <textarea value={form.appealText}
                    onChange={e => setForm(f => ({ ...f, appealText: e.target.value }))}
                    placeholder="例：毎朝の一杯が変わる。本格派のコク深い味わい。"
                    rows={3}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none resize-none transition-colors
                      ${errors.appealText ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
                  />
                  {errors.appealText && <p className="text-red-500 text-xs mt-1">{errors.appealText}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">メインカラー</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={form.mainColor}
                      onChange={e => setForm(f => ({ ...f, mainColor: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5" />
                    <div className="flex gap-2">
                      {QUICK_COLORS.map(c => (
                        <button key={c} onClick={() => setForm(f => ({ ...f, mainColor: c }))}
                          title={c === '#bf0000' ? '楽天レッド' : c}
                          className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${form.mainColor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 font-mono">{form.mainColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─ テキスト & デザイン設定 ─ */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">テキスト & デザイン設定</h2>
              <div className="space-y-4">

                {/* 横位置 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">横位置</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { value: 'left', label: '左寄せ', icon: '◀' },
                      { value: 'center', label: '中央', icon: '⬛' },
                      { value: 'right', label: '右寄せ', icon: '▶' },
                    ] as const).map(opt => (
                      <button key={opt.value} onClick={() => setOverlay(o => ({ ...o, hAlign: opt.value }))}
                        className={`py-2.5 text-xs rounded-lg border flex flex-col items-center gap-0.5 transition-colors
                          ${overlay.hAlign === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <span>{opt.icon}</span><span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 縦位置 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">縦位置</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([{ value: 'top', label: '上部' }, { value: 'bottom', label: '下部' }] as const).map(opt => (
                      <button key={opt.value} onClick={() => setOverlay(o => ({ ...o, vAlign: opt.value }))}
                        className={`py-2.5 text-sm rounded-lg border transition-colors
                          ${overlay.vAlign === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* テキストカラー */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">テキストカラー</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([
                      { value: 'white', label: '白（縁：黒）', dot: 'bg-white ring-1 ring-gray-300' },
                      { value: 'black', label: '黒（縁：白）', dot: 'bg-gray-900' },
                    ] as const).map(opt => (
                      <button key={opt.value} onClick={() => setOverlay(o => ({ ...o, textColor: opt.value }))}
                        className={`py-2.5 text-xs rounded-lg border flex items-center justify-center gap-1.5 transition-colors
                          ${overlay.textColor === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <span className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${opt.dot}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* フォントスタイル */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">フォントスタイル</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FONT_STYLES.map(fs => (
                      <button key={fs.id} onClick={() => setFontStyleId(fs.id)}
                        className={`py-2.5 rounded-lg border transition-colors flex flex-col items-center gap-0.5
                          ${fontStyleId === fs.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <span className="text-sm font-semibold" style={{ fontFamily: fs.cssVar }}>{fs.label}</span>
                        <span className="text-xs text-gray-400">{fs.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ─ スタンプ設定 ─ */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">スタンプ素材</h2>
                {activeStamp && (
                  <button onClick={() => setActiveStamp(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 underline">クリア</button>
                )}
              </div>

              {/* スタンプ選択グリッド */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {STAMPS.map(stamp => (
                  <button key={stamp.id} onClick={() => setActiveStamp(activeStamp === stamp.id ? null : stamp.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all
                      ${activeStamp === stamp.id ? 'border-blue-500 bg-blue-50 scale-105 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                    {/* SVGプレビュー */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={svgToDataUrl(stamp.svg)} alt={stamp.label} className="w-10 h-10" />
                    <span className="text-xs text-gray-600 leading-tight text-center">{stamp.label}</span>
                  </button>
                ))}
              </div>

              {/* スタンプ配置位置（選択時のみ表示） */}
              {activeStamp && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">配置位置</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {STAMP_POSITIONS.map(pos => (
                      <button key={pos.id} onClick={() => setStampPosition(pos.id)}
                        className={`py-2 text-sm rounded-lg border transition-colors
                          ${stampPosition === pos.id ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ─ 出力サイズ ─ */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">出力サイズ</h2>
                <span className="text-xs text-gray-400">MVP: 1サイズ生成</span>
              </div>
              {sizeGroups.map(group => (
                <div key={group} className="mb-3 last:mb-0">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{group}</p>
                  <div className="space-y-1.5">
                    {BANNER_SIZES.map((size, idx) => size.group !== group ? null : (
                      <label key={idx}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors
                          ${selectedSizeIdx === idx ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                        <input type="radio" name="bannerSize" checked={selectedSizeIdx === idx}
                          onChange={() => setSelectedSizeIdx(idx)} className="w-4 h-4 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{size.label}</p>
                          <p className="text-xs text-gray-400">{size.width} × {size.height} px</p>
                        </div>
                        <div className="rounded border border-gray-300 bg-gray-100 flex-shrink-0"
                          style={{
                            width: `${Math.min(44, (size.width / size.height) * 18)}px`,
                            height: `${Math.min(18, (size.height / size.width) * 44)}px`,
                          }} />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ─ 生成ボタン ─ */}
            <button onClick={handleGenerate} disabled={isGenerating}
              className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm shadow-sm">
              {isGenerating ? 'AI生成中...' : 'バナーを生成する'}
            </button>

            {generateError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-2">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-700">生成エラー</p>
                  <p className="text-xs text-red-600 mt-0.5">{generateError}</p>
                </div>
              </div>
            )}
          </div>

          {/* ══════════ RIGHT ══════════ */}
          <div className="lg:col-span-3 space-y-5">

            {/* ローディング */}
            {isGenerating && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-full mb-4">
                    <svg className="w-7 h-7 text-red-600 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Pollinations.ai / Flux で生成中...</p>
                  <p className="text-xs text-gray-500 mt-1">画像生成中です。通常10〜30秒かかります</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>生成進捗</span><span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between mt-3">
                    {PROGRESS_STEPS.map((step, i) => (
                      <div key={step} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${i <= currentStep ? 'bg-red-500' : 'bg-gray-200'}`} />
                        <span className={`text-xs ${i === currentStep ? 'text-red-600 font-medium' : i < currentStep ? 'text-gray-400' : 'text-gray-300'}`}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 空の状態 */}
            {!isGenerating && generatedImages.length === 0 && !generateError && (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">生成されたバナーがここに表示されます</p>
                <p className="text-xs text-gray-400 mt-1">左側のフォームに入力して「バナーを生成する」を押してください</p>
              </div>
            )}

            {/* 生成結果 */}
            {generatedImages.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">
                    生成結果 <span className="text-gray-400 font-normal text-sm">（{generatedImages.length}件）</span>
                  </h2>
                  <div className="flex gap-2">
                    <button onClick={handleGenerate} disabled={isGenerating}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      再生成
                    </button>
                    <button onClick={() => generatedImages.forEach(img => downloadComposite(img))}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      一括DL
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  {generatedImages.map(img => (
                    <div key={img.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                      {/* 画像プレビュー + CSS オーバーレイ */}
                      <div className="bg-gray-50 border-b border-gray-100 p-4">
                        <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-800" style={{ containerType: 'inline-size' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.dataUrl} alt={`生成バナー ${img.size.label}`}
                            className="w-full object-cover block"
                            style={{ aspectRatio: img.size.aspect, maxHeight: '320px' }} />

                          {/* テキストオーバーレイ */}
                          {form.appealText && (
                            <div className={`absolute inset-0 flex pointer-events-none ${overlayVClass} ${overlayAlignClass}`}>
                              <p className="font-bold leading-snug"
                                style={{
                                  margin: '4%', maxWidth: '62%', textAlign: overlay.hAlign,
                                  color: overlay.textColor === 'white' ? '#ffffff' : '#111111',
                                  textShadow: textShadowCSS,
                                  fontFamily: activeFontStyle.cssVar,
                                  fontSize: 'clamp(10px, 3cqw, 20px)',
                                  wordBreak: 'break-all',
                                }}>
                                {form.appealText}
                              </p>
                            </div>
                          )}

                          {/* スタンプオーバーレイ */}
                          {activeStampObj && (
                            <div className="absolute pointer-events-none" style={{ width: '22%', ...stampPositionStyle[stampPosition] }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={svgToDataUrl(activeStampObj.svg)} alt={activeStampObj.label}
                                className="w-full h-auto drop-shadow-lg" />
                            </div>
                          )}
                        </div>

                        {img.imageSource === 'picsum' && (
                          <p className="text-xs text-amber-600 mt-2 text-center bg-amber-50 rounded-lg px-3 py-1.5">
                            ※ Pollinations.ai 接続エラーのため Picsum ダミー画像を表示中。テキスト合成・Canvas機能のテストは正常に行えます。
                          </p>
                        )}
                        {img.usedAspectRatio && (
                          <p className="text-xs text-amber-600 mt-2 text-center">
                            ※ アスペクト比調整: {img.usedAspectRatio} で生成。DLファイルは {img.size.width}×{img.size.height}px に合成されます。
                          </p>
                        )}
                      </div>

                      {/* AI診断レポート */}
                      {img.reasoning && img.reasoning.length > 0 && (
                        <div className="border-t border-gray-100">
                          <button
                            onClick={() => setShowReasoning(prev => ({ ...prev, [img.id]: !prev[img.id] }))}
                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-widest">AI診断レポート</span>
                              <span className="text-xs text-gray-400 hidden sm:block">提案書にそのまま使える設計根拠</span>
                            </div>
                            <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showReasoning[img.id] ? 'rotate-180' : ''}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showReasoning[img.id] && (
                            <div className="px-4 pb-4 space-y-2.5">
                              {img.reasoning.map((point, i) => (
                                <div key={i} className="bg-indigo-50 rounded-xl p-3 flex gap-3">
                                  <span className="text-base flex-shrink-0 leading-none mt-0.5">{point.icon}</span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-indigo-800 mb-1">{point.title}</p>
                                    <p className="text-xs text-indigo-700 leading-relaxed">{point.body}</p>
                                  </div>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const text = img.reasoning!.map(p => `【${p.title}】\n${p.body}`).join('\n\n')
                                  navigator.clipboard.writeText(text).catch(() => {})
                                }}
                                className="mt-1 text-xs text-indigo-500 underline hover:text-indigo-700 transition-colors">
                                テキストをコピー（提案書用）
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* フッター */}
                      <div className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{img.size.label}</p>
                          <p className="text-xs text-gray-400">{img.size.width} × {img.size.height} px</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Good / Bad */}
                          <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden">
                            {(['good', 'bad'] as const).map((type, ti) => (
                              <>
                                {ti > 0 && <div key={`sep-${type}`} className="w-px h-5 bg-gray-200" />}
                                <button key={type} onClick={() => handleFeedback(img.id, type)}
                                  className={`px-3 py-1.5 text-xs flex items-center gap-1 transition-colors
                                    ${feedback[img.id] === type
                                      ? type === 'good' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                      : 'text-gray-500 hover:bg-gray-50'}`}>
                                  <svg className={`w-3.5 h-3.5 ${type === 'bad' ? 'rotate-180' : ''}`}
                                    fill={feedback[img.id] === type ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                  </svg>
                                  {type === 'good' ? 'Good' : 'Bad'}
                                </button>
                              </>
                            ))}
                          </div>

                          <button onClick={() => downloadRaw(img)}
                            className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            title="テキスト・スタンプなしの元画像">元画像</button>

                          <button onClick={() => downloadComposite(img)} disabled={isDownloading === img.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 rounded-lg transition-colors">
                            {isDownloading === img.id ? (
                              <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>合成中</>
                            ) : (
                              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>テキスト合成DL</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 送信プロンプト確認 */}
                {lastPrompt && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                    <button onClick={() => setShowPrompt(v => !v)}
                      className="flex items-center justify-between w-full text-left">
                      <span className="text-sm font-medium text-gray-700">送信プロンプトを確認（品質改善用）</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${showPrompt ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showPrompt && (
                      <pre className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                        {lastPrompt}
                      </pre>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
