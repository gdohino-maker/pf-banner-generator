'use client'

import { useState, useRef, useCallback } from 'react'

// ─── バナーサイズ定義 ─────────────────────────────────────────────────────────
const BANNER_SIZES = [
  { label: 'PC横長 (1456×180)',      width: 1456, height: 180,  aspect: '1456/180', group: '横長バナー' },
  { label: 'PC特集バナー (960×400)', width: 960,  height: 400,  aspect: '960/400',  group: '横長バナー' },
  { label: 'SPバナー (640×200)',      width: 640,  height: 200,  aspect: '640/200',  group: '横長バナー' },
  { label: 'SPカテゴリ (750×250)',    width: 750,  height: 250,  aspect: '750/250',  group: '横長バナー' },
  { label: '商品画像 (1000×1000)',    width: 1000, height: 1000, aspect: '1/1',      group: 'スクエア' },
  { label: 'PCスクエア (400×400)',    width: 400,  height: 400,  aspect: '1/1',      group: 'スクエア' },
] as const
type BannerSize = typeof BANNER_SIZES[number]

const CATEGORIES = [
  '食品・飲料', '美容・コスメ', 'ファッション', '家電・PC',
  'スポーツ・アウトドア', 'インテリア・家具', 'ベビー・マタニティ', 'その他',
]

const QUICK_COLORS = ['#bf0000', '#1a1a2e', '#0f3460', '#2d6a4f', '#e76f51', '#264653']

const FONT_STYLES = [
  {
    id: 'gothic' as const,
    label: 'ゴシック体',
    desc: 'Noto Sans JP',
    cssVar: 'var(--font-noto-sans-jp)',
    canvasStack: '"Noto Sans JP", "Yu Gothic UI", "Yu Gothic", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif',
  },
  {
    id: 'mincho' as const,
    label: '明朝体',
    desc: 'Shippori Mincho',
    cssVar: 'var(--font-shippori-mincho)',
    canvasStack: '"Shippori Mincho", "Yu Mincho", "Hiragino Mincho ProN", "MS PMincho", serif',
  },
]
type FontStyleId = typeof FONT_STYLES[number]['id']

const STAMPS = [
  {
    id: 'free_shipping', label: '送料無料',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#CC0000"/><circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2" stroke-dasharray="5 3"/><text x="50" y="45" font-family="sans-serif" font-weight="900" font-size="20" fill="white" text-anchor="middle">送料</text><text x="50" y="70" font-family="sans-serif" font-weight="900" font-size="20" fill="white" text-anchor="middle">無料</text></svg>`,
  },
  {
    id: 'points_10x', label: 'ポイント10倍',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,3 L61,36 L96,36 L69,57 L80,90 L50,70 L20,90 L31,57 L4,36 L39,36Z" fill="#E8A000"/><path d="M50,12 L59,40 L87,40 L65,56 L73,83 L50,67 L27,83 L35,56 L13,40 L41,40Z" fill="#F5C400"/><text x="50" y="50" font-family="sans-serif" font-weight="900" font-size="11" fill="white" text-anchor="middle">ポイント</text><text x="50" y="66" font-family="sans-serif" font-weight="900" font-size="16" fill="white" text-anchor="middle">10倍!</text></svg>`,
  },
  {
    id: 'limited', label: '期間限定',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,4 96,28 96,72 50,96 4,72 4,28" fill="#1D4ED8"/><polygon points="50,11 89,32 89,68 50,89 11,68 11,32" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/><text x="50" y="48" font-family="sans-serif" font-weight="900" font-size="13" fill="white" text-anchor="middle">期間</text><text x="50" y="66" font-family="sans-serif" font-weight="900" font-size="13" fill="white" text-anchor="middle">限定</text></svg>`,
  },
  {
    id: 'new_arrival', label: '新登場',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" rx="20" fill="#059669"/><rect x="10" y="10" width="80" height="80" rx="15" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/><text x="50" y="46" font-family="sans-serif" font-weight="900" font-size="15" fill="white" text-anchor="middle">新</text><text x="50" y="67" font-family="sans-serif" font-weight="900" font-size="15" fill="white" text-anchor="middle">登場</text></svg>`,
  },
  {
    id: 'sale', label: 'SALE中',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,4 L96,50 L50,96 L4,50Z" fill="#DC2626"/><path d="M50,13 L87,50 L50,87 L13,50Z" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/><text x="50" y="46" font-family="sans-serif" font-weight="900" font-size="15" fill="white" text-anchor="middle">SALE</text><text x="50" y="65" font-family="sans-serif" font-weight="900" font-size="12" fill="white" text-anchor="middle">開催中</text></svg>`,
  },
]

const STAMP_POSITIONS = [
  { id: 'top-left',     label: '左上', row: 0, col: 0 },
  { id: 'top-right',    label: '右上', row: 0, col: 1 },
  { id: 'bottom-left',  label: '左下', row: 1, col: 0 },
  { id: 'bottom-right', label: '右下', row: 1, col: 1 },
] as const
type StampPosition = typeof STAMP_POSITIONS[number]['id']

// ─── 型定義 ───────────────────────────────────────────────────────────────────
type ReasoningPoint = { icon: string; title: string; body: string }

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

  const bgImg = await loadImage(img.dataUrl)
  const iw = bgImg.naturalWidth, ih = bgImg.naturalHeight
  const canvasRatio = cw / ch, imgRatio = iw / ih
  let sx = 0, sy = 0, sw = iw, sh = ih
  if (imgRatio > canvasRatio) { sw = ih * canvasRatio; sx = (iw - sw) / 2 }
  else { sh = iw / canvasRatio; sy = (ih - sh) / 2 }
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, cw, ch)

  if (text.trim()) {
    const fontStyle = FONT_STYLES.find(f => f.id === fontStyleId)!
    const fontSize = Math.round(Math.max(18, Math.min(ch * 0.17, 80)))
    const lineHeight = fontSize * 1.35
    const padding = Math.round(Math.max(20, cw * 0.035))
    const maxTextWidth = cw * 0.60

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

  if (stampId) {
    const stamp = STAMPS.find(s => s.id === stampId)
    if (stamp) {
      const stampSize = Math.min(Math.max(Math.min(cw, ch) * 0.26, 60), 180)
      const pad = Math.max(8, stampSize * 0.08)
      let sx2 = 0, sy2 = 0
      if (stampPosition === 'top-left')     { sx2 = pad;                  sy2 = pad }
      if (stampPosition === 'top-right')    { sx2 = cw - stampSize - pad; sy2 = pad }
      if (stampPosition === 'bottom-left')  { sx2 = pad;                  sy2 = ch - stampSize - pad }
      if (stampPosition === 'bottom-right') { sx2 = cw - stampSize - pad; sy2 = ch - stampSize - pad }
      const stampImg = await loadImage(svgToDataUrl(stamp.svg))
      ctx.drawImage(stampImg, sx2, sy2, stampSize, stampSize)
    }
  }

  return canvas
}

// ─── ステップインジケーター ───────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: '商品情報' },
  { num: 2, label: 'デザイン設定' },
  { num: 3, label: '生成・確認' },
] as const

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
              ${current > s.num
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : current === s.num
                  ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-200'
                  : 'bg-white border-gray-300 text-gray-400'}`}>
              {current > s.num ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : s.num}
            </div>
            <span className={`text-xs mt-1.5 font-medium whitespace-nowrap transition-colors
              ${current === s.num ? 'text-gray-900' : current > s.num ? 'text-emerald-600' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 transition-colors duration-300
              ${current > i + 1 ? 'bg-emerald-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────
export default function BannerGenerator() {
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1
  const [form, setForm] = useState<FormData>({
    productName: '', category: '', target: '', appealText: '', mainColor: '#bf0000',
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})

  // Step 2
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(1) // PC特集バナーをデフォルト
  const [overlay, setOverlay] = useState<OverlaySettings>({ hAlign: 'left', vAlign: 'bottom', textColor: 'white' })
  const [fontStyleId, setFontStyleId] = useState<FontStyleId>('gothic')
  const [activeStamp, setActiveStamp] = useState<string | null>(null)
  const [stampPosition, setStampPosition] = useState<StampPosition>('top-right')

  // Step 3
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [lastPrompt, setLastPrompt] = useState<string | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── バリデーション ─────────────────────────────────────────────────────────
  const validate = () => {
    const next: Partial<FormData> = {}
    if (!form.productName.trim()) next.productName = '商品名を入力してください'
    if (!form.appealText.trim())  next.appealText  = '訴求テキストを入力してください'
    if (!form.target.trim())      next.target      = 'ターゲットを入力してください'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  // ─── 進捗アニメーション ─────────────────────────────────────────────────────
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

  // ─── 生成処理 ───────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    setGenerateError(null)
    setGeneratedImage(null)
    setFeedback(null)
    setIsGenerating(true)
    startProgress()
    const size = BANNER_SIZES[selectedSizeIdx]
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
      setGeneratedImage({
        id: Date.now().toString(), size, dataUrl: data.imageDataUrl,
        usedAspectRatio: data.usedAspectRatio ?? '',
        reasoning: data.reasoning ?? [],
        imageSource: data.imageSource ?? 'imagen4',
      })
    } catch (err) {
      stopProgress(0)
      setGenerateError(err instanceof Error ? err.message : '生成に失敗しました')
    } finally { setIsGenerating(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, selectedSizeIdx, overlay])

  // ─── ステップ遷移 ───────────────────────────────────────────────────────────
  const goToStep2 = () => {
    if (!validate()) return
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const goToStep3 = () => {
    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    handleGenerate()
  }
  const backToStep1 = () => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const backToStep2 = () => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const resetAll = () => {
    setStep(1)
    setGeneratedImage(null)
    setGenerateError(null)
    setFeedback(null)
    stopProgress(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ─── ダウンロード ───────────────────────────────────────────────────────────
  const downloadComposite = useCallback(async () => {
    if (!generatedImage) return
    setIsDownloading(true)
    try {
      const canvas = await renderToCanvas(generatedImage, form.appealText, overlay, fontStyleId, activeStamp, stampPosition)
      canvas.toBlob(blob => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `banner_${generatedImage.size.width}x${generatedImage.size.height}_final.jpg`
        a.click()
        URL.revokeObjectURL(url)
      }, 'image/jpeg', 0.93)
    } finally { setIsDownloading(false) }
  }, [generatedImage, form.appealText, overlay, fontStyleId, activeStamp, stampPosition])

  const downloadRaw = () => {
    if (!generatedImage) return
    const a = document.createElement('a')
    a.href = generatedImage.dataUrl
    a.download = `banner_${generatedImage.size.width}x${generatedImage.size.height}_raw.jpg`
    a.click()
  }

  // ─── フィードバック ─────────────────────────────────────────────────────────
  const handleFeedback = (type: 'good' | 'bad') => {
    const newRating = feedback === type ? null : type
    setFeedback(newRating)
    if (newRating !== null && generatedImage) {
      try {
        const stored: unknown[] = JSON.parse(localStorage.getItem('pf_banner_feedback') ?? '[]')
        stored.push({
          id: generatedImage.id, timestamp: new Date().toISOString(), rating: newRating,
          params: {
            productName: form.productName, category: form.category,
            target: form.target, catchcopy: form.appealText, color: form.mainColor,
            size: generatedImage.size.label, textPosition: `${overlay.vAlign}-${overlay.hAlign}`,
            fontStyle: fontStyleId, stamp: activeStamp,
          },
          prompt: lastPrompt,
        })
        localStorage.setItem('pf_banner_feedback', JSON.stringify(stored))
      } catch { /* ignore quota errors */ }
    }
  }

  // ─── CSS オーバーレイ計算 ────────────────────────────────────────────────────
  const overlayAlignClass = { left: 'justify-start', center: 'justify-center', right: 'justify-end' }[overlay.hAlign]
  const overlayVClass = overlay.vAlign === 'top' ? 'items-start' : 'items-end'
  const textShadowCSS = overlay.textColor === 'white'
    ? '1px 1px 0 rgba(0,0,0,0.9),-1px -1px 0 rgba(0,0,0,0.9),1px -1px 0 rgba(0,0,0,0.9),-1px 1px 0 rgba(0,0,0,0.9),0 3px 10px rgba(0,0,0,0.6)'
    : '1px 1px 0 rgba(255,255,255,0.9),-1px -1px 0 rgba(255,255,255,0.9),1px -1px 0 rgba(255,255,255,0.9),-1px 1px 0 rgba(255,255,255,0.9)'
  const activeFontStyle = FONT_STYLES.find(f => f.id === fontStyleId)!
  const activeStampObj  = STAMPS.find(s => s.id === activeStamp)
  const stampPositionStyle: Record<StampPosition, React.CSSProperties> = {
    'top-left':     { top: '6%', left: '4%' },
    'top-right':    { top: '6%', right: '4%' },
    'bottom-left':  { bottom: '6%', left: '4%' },
    'bottom-right': { bottom: '6%', right: '4%' },
  }
  const sizeGroups = Array.from(new Set(BANNER_SIZES.map(s => s.group)))
  const currentProgressStep = progress < 30 ? 0 : progress < 70 ? 1 : 2

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">PF</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-none">PFクリエイティブ生成</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-none hidden sm:block">楽天バナー・商品画像 AI生成ツール</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={resetAll}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                最初から
              </button>
            )}
            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-3 py-1 font-medium">
              Imagen 4
            </span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 py-8 px-4 sm:px-6">

        {/* ステップインジケーター（ステップ1〜2のみ） */}
        {step <= 2 && (
          <div className="max-w-xl mx-auto">
            <StepIndicator current={step} />
          </div>
        )}

        {/* ══════ STEP 1：商品情報 ══════ */}
        {step === 1 && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2">STEP 1 / 3</p>
                <h2 className="text-xl font-bold text-gray-900">商品情報の入力</h2>
                <p className="text-sm text-gray-500 mt-1">AIが最適なバナーを設計するための情報を入力してください</p>
              </div>

              <div className="px-8 py-7 space-y-5">
                {/* 商品名 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    商品名 <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={form.productName}
                    onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
                    placeholder="例：プレミアムローストコーヒー 200g"
                    className={`w-full px-4 py-3 text-sm rounded-xl border outline-none transition-all
                      ${errors.productName
                        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50'}`}
                  />
                  {errors.productName && <p className="text-red-500 text-xs mt-1.5">{errors.productName}</p>}
                </div>

                {/* カテゴリ */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">カテゴリ</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all">
                    <option value="">選択してください（任意）</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* ターゲット */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    ターゲット <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={form.target}
                    onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                    placeholder="例：30〜40代の健康意識が高い男性"
                    className={`w-full px-4 py-3 text-sm rounded-xl border outline-none transition-all
                      ${errors.target
                        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50'}`}
                  />
                  {errors.target && <p className="text-red-500 text-xs mt-1.5">{errors.target}</p>}
                </div>

                {/* 訴求テキスト */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    訴求テキスト（キャッチコピー）<span className="text-red-500">*</span>
                  </label>
                  <textarea value={form.appealText}
                    onChange={e => setForm(f => ({ ...f, appealText: e.target.value }))}
                    placeholder="例：毎朝の一杯が変わる。本格派のコク深い味わい。"
                    rows={3}
                    className={`w-full px-4 py-3 text-sm rounded-xl border outline-none resize-none transition-all
                      ${errors.appealText
                        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50'}`}
                  />
                  {errors.appealText && <p className="text-red-500 text-xs mt-1.5">{errors.appealText}</p>}
                </div>

                {/* メインカラー */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">メインカラー</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={form.mainColor}
                      onChange={e => setForm(f => ({ ...f, mainColor: e.target.value }))}
                      className="w-10 h-10 rounded-xl border-2 border-gray-200 cursor-pointer p-0.5 flex-shrink-0" />
                    <div className="flex gap-2">
                      {QUICK_COLORS.map(c => (
                        <button key={c} onClick={() => setForm(f => ({ ...f, mainColor: c }))}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110
                            ${form.mainColor === c ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 font-mono ml-auto">{form.mainColor}</span>
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button onClick={goToStep2}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                  デザイン設定へ
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════ STEP 2：デザイン設定 ══════ */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">STEP 2 / 3</p>
                <h2 className="text-xl font-bold text-gray-900">デザイン設定</h2>
                <p className="text-sm text-gray-500 mt-1">テキストの配置・フォント・スタンプ・出力サイズを選択します</p>
              </div>

              <div className="px-8 py-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">

                  {/* 左列：テキスト設定 */}
                  <div className="space-y-5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">テキスト設定</p>

                    {/* 横位置 */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">横位置</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {([
                          { value: 'left',   label: '左寄せ', icon: '▲' },
                          { value: 'center', label: '中央',   icon: '▲' },
                          { value: 'right',  label: '右寄せ', icon: '▲' },
                        ] as const).map(opt => (
                          <button key={opt.value} onClick={() => setOverlay(o => ({ ...o, hAlign: opt.value }))}
                            className={`py-2.5 text-xs rounded-lg border flex flex-col items-center gap-0.5 transition-colors font-medium
                              ${overlay.hAlign === opt.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            <span className={`text-[8px] ${opt.value === 'left' ? 'self-start ml-2' : opt.value === 'right' ? 'self-end mr-2' : ''}`}>▬</span>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 縦位置 */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">縦位置</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([{ value: 'top', label: '上部' }, { value: 'bottom', label: '下部' }] as const).map(opt => (
                          <button key={opt.value} onClick={() => setOverlay(o => ({ ...o, vAlign: opt.value }))}
                            className={`py-2.5 text-xs font-medium rounded-lg border transition-colors
                              ${overlay.vAlign === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* テキストカラー */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">テキストカラー</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([
                          { value: 'white', label: '白（縁：黒）', dot: 'bg-white ring-1 ring-gray-300' },
                          { value: 'black', label: '黒（縁：白）', dot: 'bg-gray-900' },
                        ] as const).map(opt => (
                          <button key={opt.value} onClick={() => setOverlay(o => ({ ...o, textColor: opt.value }))}
                            className={`py-2.5 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-colors
                              ${overlay.textColor === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            <span className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${opt.dot}`} />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* フォントスタイル */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">フォントスタイル</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {FONT_STYLES.map(fs => (
                          <button key={fs.id} onClick={() => setFontStyleId(fs.id)}
                            className={`py-2.5 rounded-lg border transition-colors flex flex-col items-center gap-0.5
                              ${fontStyleId === fs.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            <span className="text-sm font-semibold" style={{ fontFamily: fs.cssVar }}>{fs.label}</span>
                            <span className="text-[10px] text-gray-400">{fs.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 右列：スタンプ & サイズ */}
                  <div className="space-y-5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">スタンプ & サイズ</p>

                    {/* スタンプ */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-gray-600">スタンプ素材（任意）</label>
                        {activeStamp && (
                          <button onClick={() => setActiveStamp(null)}
                            className="text-xs text-gray-400 hover:text-gray-600 underline">クリア</button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mb-2">
                        {STAMPS.map(stamp => (
                          <button key={stamp.id}
                            onClick={() => setActiveStamp(activeStamp === stamp.id ? null : stamp.id)}
                            className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all
                              ${activeStamp === stamp.id ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={svgToDataUrl(stamp.svg)} alt={stamp.label} className="w-9 h-9" />
                            <span className="text-[10px] text-gray-500 leading-tight text-center">{stamp.label}</span>
                          </button>
                        ))}
                      </div>
                      {activeStamp && (
                        <div className="grid grid-cols-2 gap-1.5">
                          {STAMP_POSITIONS.map(pos => (
                            <button key={pos.id} onClick={() => setStampPosition(pos.id)}
                              className={`py-1.5 text-xs font-medium rounded-lg border transition-colors
                                ${stampPosition === pos.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 出力サイズ */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">出力サイズ</label>
                      {sizeGroups.map(group => (
                        <div key={group} className="mb-3 last:mb-0">
                          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">{group}</p>
                          <div className="space-y-1">
                            {BANNER_SIZES.map((size, idx) => size.group !== group ? null : (
                              <label key={idx}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors
                                  ${selectedSizeIdx === idx ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input type="radio" name="bannerSize" checked={selectedSizeIdx === idx}
                                  onChange={() => setSelectedSizeIdx(idx)}
                                  className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-800 truncate">{size.label}</p>
                                </div>
                                <div className="rounded border border-gray-300 bg-gray-100 flex-shrink-0"
                                  style={{
                                    width: `${Math.min(36, (size.width / size.height) * 14)}px`,
                                    height: `${Math.min(14, (size.height / size.width) * 36)}px`,
                                  }} />
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button onClick={backToStep1}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  戻る
                </button>
                <button onClick={goToStep3}
                  className="flex items-center gap-2 px-7 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-red-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  バナーを生成する
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════ STEP 3：生成・確認 ══════ */}
        {step === 3 && (
          <div className="max-w-4xl mx-auto">

            {/* ローディング */}
            {isGenerating && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-2xl mb-5">
                  <svg className="w-8 h-8 text-red-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Imagen 4 で生成中...</h3>
                <p className="text-sm text-gray-500 mb-7">高品質な画像生成には20〜40秒かかります</p>
                <div className="max-w-sm mx-auto space-y-3">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>生成進捗</span><span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    {(['プロンプト最適化', '画像生成中', '後処理'] as const).map((s, i) => (
                      <div key={s} className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${i <= currentProgressStep ? 'bg-red-500' : 'bg-gray-200'}`} />
                        <span className={`text-[10px] ${i === currentProgressStep ? 'text-red-600 font-semibold' : i < currentProgressStep ? 'text-gray-400' : 'text-gray-300'}`}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* エラー */}
            {!isGenerating && generateError && (
              <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-700 mb-1">生成エラー</p>
                    <p className="text-sm text-red-600">{generateError}</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={backToStep2}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    設定を変更
                  </button>
                  <button onClick={() => { setGenerateError(null); handleGenerate() }}
                    className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">
                    再試行
                  </button>
                </div>
              </div>
            )}

            {/* 結果 */}
            {!isGenerating && generatedImage && (
              <div className="space-y-4">
                {/* 生成情報ヘッダー */}
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{form.productName}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {generatedImage.size.label} · {form.category || '未設定'} · {form.target}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={backToStep2}
                      className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                      設定を変更
                    </button>
                    <button onClick={() => { setGeneratedImage(null); handleGenerate() }}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      再生成
                    </button>
                  </div>
                </div>

                {/* 画像カード */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* 画像プレビュー */}
                  <div className="bg-gray-900 p-4">
                    <div className="relative overflow-hidden rounded-xl"
                      style={{ containerType: 'inline-size' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={generatedImage.dataUrl}
                        alt={`生成バナー ${generatedImage.size.label}`}
                        className="w-full object-cover block"
                        style={{ aspectRatio: generatedImage.size.aspect, maxHeight: '420px' }} />

                      {/* テキストオーバーレイ */}
                      {form.appealText && (
                        <div className={`absolute inset-0 flex pointer-events-none ${overlayVClass} ${overlayAlignClass}`}>
                          <p className="font-bold leading-snug"
                            style={{
                              margin: '4%', maxWidth: '62%', textAlign: overlay.hAlign,
                              color: overlay.textColor === 'white' ? '#ffffff' : '#111111',
                              textShadow: textShadowCSS,
                              fontFamily: activeFontStyle.cssVar,
                              fontSize: 'clamp(10px, 3cqw, 22px)',
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
                          <img src={svgToDataUrl(activeStampObj.svg)} alt={activeStampObj.label} className="w-full h-auto drop-shadow-lg" />
                        </div>
                      )}
                    </div>

                    {/* アスペクト比メモ */}
                    {generatedImage.usedAspectRatio && (
                      <p className="text-xs text-amber-400 mt-2.5 text-center">
                        ※ Imagen 4 制約により {generatedImage.usedAspectRatio} で生成。DLファイルは {generatedImage.size.width}×{generatedImage.size.height}px に合成されます。
                      </p>
                    )}
                  </div>

                  {/* AI診断レポート */}
                  {generatedImage.reasoning && generatedImage.reasoning.length > 0 && (
                    <div className="border-t border-gray-100">
                      <button onClick={() => setShowReasoning(v => !v)}
                        className="w-full flex items-center justify-between px-6 py-3.5 text-left hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">AI診断レポート</span>
                          <span className="text-xs text-gray-400 hidden sm:block">— 提案書にそのまま使える設計根拠</span>
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${showReasoning ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showReasoning && (
                        <div className="px-6 pb-5 space-y-2.5">
                          {generatedImage.reasoning.map((point, i) => (
                            <div key={i} className="bg-indigo-50 rounded-xl p-3.5 flex gap-3">
                              <span className="text-lg flex-shrink-0 leading-none mt-0.5">{point.icon}</span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-indigo-800 mb-1">{point.title}</p>
                                <p className="text-xs text-indigo-700 leading-relaxed">{point.body}</p>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const text = generatedImage.reasoning!.map(p => `【${p.title}】\n${p.body}`).join('\n\n')
                              navigator.clipboard.writeText(text).catch(() => {})
                            }}
                            className="text-xs text-indigo-500 underline hover:text-indigo-700 transition-colors mt-1 block">
                            テキストをコピー（提案書用）
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* アクションフッター */}
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    {/* フィードバック */}
                    <div className="flex items-center gap-1 border border-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                      {(['good', 'bad'] as const).map((type, ti) => (
                        <div key={type} className="flex items-center">
                          {ti > 0 && <div className="w-px h-5 bg-gray-200" />}
                          <button onClick={() => handleFeedback(type)}
                            className={`px-3 py-2 text-xs flex items-center gap-1.5 transition-colors
                              ${feedback === type
                                ? type === 'good' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                : 'text-gray-500 hover:bg-gray-50'}`}>
                            <svg className={`w-3.5 h-3.5 ${type === 'bad' ? 'rotate-180' : ''}`}
                              fill={feedback === type ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            {type === 'good' ? 'Good' : 'Bad'}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* ダウンロードボタン */}
                    <div className="flex items-center gap-2">
                      <button onClick={downloadRaw}
                        className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap">
                        元画像
                      </button>
                      <button onClick={downloadComposite} disabled={isDownloading}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 rounded-xl transition-colors whitespace-nowrap">
                        {isDownloading ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                        テキスト合成DL
                      </button>
                    </div>
                  </div>
                </div>

                {/* 送信プロンプト確認 */}
                {lastPrompt && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <button onClick={() => setShowPrompt(v => !v)}
                      className="w-full flex items-center justify-between px-6 py-3.5 text-left hover:bg-gray-50 transition-colors">
                      <span className="text-xs font-semibold text-gray-500">送信プロンプトを確認（品質改善用）</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showPrompt ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showPrompt && (
                      <pre className="px-6 pb-5 text-xs text-gray-500 bg-gray-50 border-t border-gray-100 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                        {lastPrompt}
                      </pre>
                    )}
                  </div>
                )}

                {/* 最初からボタン */}
                <div className="text-center pt-2">
                  <button onClick={resetAll}
                    className="text-sm text-gray-400 hover:text-gray-600 underline transition-colors">
                    新しいバナーを作成する
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
