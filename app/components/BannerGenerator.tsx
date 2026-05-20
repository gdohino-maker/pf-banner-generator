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

const DESIGN_STYLES = [
  { id: 'professional', label: 'プロフェッショナル', emoji: '💼', desc: '高級感・信頼感' },
  { id: 'pop',          label: 'ポップ',             emoji: '🎉', desc: '元気・活気・インパクト' },
  { id: 'cute',         label: 'かわいい',           emoji: '🌸', desc: 'パステル・ほっこり' },
  { id: 'appetizing',   label: 'おいしそう',         emoji: '😋', desc: 'シズル感・食欲喚起' },
  { id: 'stylish',      label: 'スタイリッシュ',     emoji: '✨', desc: 'クール・モダン' },
  { id: 'natural',      label: 'ナチュラル',         emoji: '🌿', desc: '自然・やさしい' },
] as const
type DesignStyleId = typeof DESIGN_STYLES[number]['id']

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

// 楽天スタイルスタンプ
const STAMPS = [
  {
    id: 'point_10x', label: 'ポイント10倍',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,3 60,27 83,17 73,40 97,50 73,60 83,83 60,73 50,97 40,73 17,83 27,60 3,50 27,40 17,17 40,27" fill="#BF0000"/><circle cx="50" cy="50" r="29" fill="#D40000"/><circle cx="50" cy="50" r="26" fill="none" stroke="#FFD700" stroke-width="2"/><text x="50" y="43" font-family="sans-serif" font-weight="900" font-size="9" fill="#FFD700" text-anchor="middle">ポイント</text><text x="50" y="61" font-family="sans-serif" font-weight="900" font-size="18" fill="white" text-anchor="middle">10倍</text></svg>`,
  },
  {
    id: 'free_shipping', label: '送料無料',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="4" y="18" width="92" height="64" rx="32" fill="#BF0000"/><rect x="8" y="22" width="84" height="56" rx="28" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/><text x="50" y="48" font-family="sans-serif" font-weight="900" font-size="18" fill="white" text-anchor="middle">送料</text><text x="50" y="70" font-family="sans-serif" font-weight="900" font-size="18" fill="white" text-anchor="middle">無料</text></svg>`,
  },
  {
    id: 'asuraku', label: 'あす楽',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" rx="12" fill="#0098D0"/><rect x="8" y="8" width="84" height="84" rx="9" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/><polygon points="50,20 73,38 73,55 27,55 27,38" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="2.5" stroke-linejoin="round"/><rect x="40" y="42" width="20" height="13" rx="2" fill="rgba(255,255,255,0.3)"/><text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="20" fill="white" text-anchor="middle">あす楽</text></svg>`,
  },
  {
    id: 'time_sale', label: 'タイムセール',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="#E84000"/><circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/><circle cx="50" cy="50" r="5" fill="rgba(255,255,255,0.35)"/><line x1="50" y1="45" x2="50" y2="30" stroke="rgba(255,255,255,0.35)" stroke-width="2" stroke-linecap="round"/><line x1="50" y1="45" x2="60" y2="40" stroke="rgba(255,255,255,0.35)" stroke-width="2" stroke-linecap="round"/><text x="50" y="67" font-family="sans-serif" font-weight="900" font-size="13" fill="white" text-anchor="middle">タイム</text><text x="50" y="83" font-family="sans-serif" font-weight="900" font-size="13" fill="white" text-anchor="middle">セール</text></svg>`,
  },
  {
    id: 'coupon', label: 'クーポン',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="4" y="20" width="92" height="60" rx="8" fill="#F57C00"/><line x1="4" y1="40" x2="96" y2="40" stroke="rgba(255,255,255,0.4)" stroke-width="1" stroke-dasharray="5 3"/><line x1="4" y1="62" x2="96" y2="62" stroke="rgba(255,255,255,0.4)" stroke-width="1" stroke-dasharray="5 3"/><text x="50" y="36" font-family="sans-serif" font-weight="700" font-size="8" fill="rgba(255,255,255,0.75)" text-anchor="middle">──────────</text><text x="50" y="55" font-family="sans-serif" font-weight="900" font-size="18" fill="white" text-anchor="middle">クーポン</text><text x="50" y="74" font-family="sans-serif" font-weight="700" font-size="9" fill="rgba(255,255,255,0.85)" text-anchor="middle">使えます</text></svg>`,
  },
  {
    id: 'limited', label: '期間限定',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,4 96,26 96,74 50,96 4,74 4,26" fill="#BF0000"/><polygon points="50,10 91,30 91,70 50,90 9,70 9,30" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/><text x="50" y="47" font-family="sans-serif" font-weight="900" font-size="16" fill="white" text-anchor="middle">期間</text><text x="50" y="67" font-family="sans-serif" font-weight="900" font-size="16" fill="white" text-anchor="middle">限定</text></svg>`,
  },
  {
    id: 'sale', label: 'スーパーSALE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" rx="10" fill="#BF0000"/><rect x="8" y="8" width="84" height="84" rx="7" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/><text x="50" y="37" font-family="sans-serif" font-weight="900" font-size="10" fill="rgba(255,255,255,0.85)" text-anchor="middle">楽天</text><text x="50" y="63" font-family="sans-serif" font-weight="900" font-size="26" fill="white" text-anchor="middle">SALE</text><text x="50" y="78" font-family="sans-serif" font-weight="900" font-size="9" fill="#FFD700" text-anchor="middle">スーパーセール</text></svg>`,
  },
  {
    id: 'new', label: '新発売',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="#00875A"/><circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/><text x="50" y="44" font-family="sans-serif" font-weight="900" font-size="15" fill="rgba(255,255,255,0.9)" text-anchor="middle">NEW</text><text x="50" y="64" font-family="sans-serif" font-weight="900" font-size="15" fill="white" text-anchor="middle">新発売</text></svg>`,
  },
]

const STAMP_POSITIONS = [
  { id: 'top-left',     label: '左上', row: 0, col: 0 },
  { id: 'top-right',    label: '右上', row: 0, col: 1 },
  { id: 'bottom-left',  label: '左下', row: 1, col: 0 },
  { id: 'bottom-right', label: '右下', row: 1, col: 1 },
] as const
type StampPosition = typeof STAMP_POSITIONS[number]['id']

const TEXT_SIZES = [
  { id: 'xs' as const, label: '極小', cssClamp: 'clamp(7px, 1.8cqw, 12px)',  canvasScale: 0.55 },
  { id: 'sm' as const, label: '小',   cssClamp: 'clamp(9px, 2.4cqw, 17px)',  canvasScale: 0.80 },
  { id: 'md' as const, label: '中',   cssClamp: 'clamp(11px, 3cqw, 22px)',   canvasScale: 1.00 },
  { id: 'lg' as const, label: '大',   cssClamp: 'clamp(14px, 4.2cqw, 32px)', canvasScale: 1.40 },
  { id: 'xl' as const, label: '特大', cssClamp: 'clamp(18px, 5.8cqw, 44px)', canvasScale: 1.85 },
]
type TextSizeId = typeof TEXT_SIZES[number]['id']

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
  referenceUrl: string
  designStyle: DesignStyleId | ''
}

type OverlaySettings = {
  hAlign: 'left' | 'center' | 'right'
  vAlign: 'top' | 'bottom'
  textColor: 'white' | 'black'
  textSizeId: TextSizeId
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

// 商品画像のコーナーから背景色をサンプリング
function sampleCornerColor(dataUrl: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth; c.height = img.naturalHeight
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const sz = Math.max(4, Math.round(Math.min(img.naturalWidth, img.naturalHeight) * 0.05))
      const w = img.naturalWidth, h = img.naturalHeight
      const regions = [
        ctx.getImageData(0, 0, sz, sz),
        ctx.getImageData(w - sz, 0, sz, sz),
        ctx.getImageData(0, h - sz, sz, sz),
        ctx.getImageData(w - sz, h - sz, sz, sz),
      ]
      let r = 0, g = 0, b = 0, n = 0
      for (const d of regions) {
        for (let i = 0; i < d.data.length; i += 4) {
          if (d.data[i + 3] > 100) { r += d.data[i]; g += d.data[i + 1]; b += d.data[i + 2]; n++ }
        }
      }
      if (n === 0) { resolve('#f5f5f5'); return }
      const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, '0')
      resolve(`#${hex(r)}${hex(g)}${hex(b)}`)
    }
    img.onerror = () => resolve('#f5f5f5')
    img.src = dataUrl
  })
}

// 商品画像をAPI送信用にリサイズ（Gemini分析用）
async function resizeForAnalysis(dataUrl: string, maxSide = 768): Promise<{ base64: string; mimeType: string }> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(maxSide / img.naturalWidth, maxSide / img.naturalHeight, 1.0)
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      const resized = canvas.toDataURL('image/jpeg', 0.85)
      resolve({ base64: resized.split(',')[1], mimeType: 'image/jpeg' })
    }
    img.onerror = () => resolve({ base64: dataUrl.split(',')[1] ?? '', mimeType: 'image/jpeg' })
    img.src = dataUrl
  })
}

async function renderToCanvas(
  img: GeneratedImage,
  text: string,
  overlay: OverlaySettings,
  fontStyleId: FontStyleId,
  stampId: string | null,
  stampPosition: StampPosition,
  productImageDataUrl: string | null = null,
  productImagePos: 'left' | 'center' | 'right' = 'right',
  productBgColor = '#f5f5f5',
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

  // 商品画像を背景の上・テキストの下に合成（背景色ゾーンでシームレスに）
  if (productImageDataUrl) {
    const prodImg = await loadImage(productImageDataUrl)
    const maxH = ch * 0.92
    const maxW = cw * 0.48
    const scale = Math.min(maxW / prodImg.naturalWidth, maxH / prodImg.naturalHeight, 1.0)
    const pw = Math.round(prodImg.naturalWidth * scale)
    const ph = Math.round(prodImg.naturalHeight * scale)
    let px2 = 0
    if (productImagePos === 'right') px2 = cw - pw - Math.round(cw * 0.01)
    else if (productImagePos === 'center') px2 = Math.round((cw - pw) / 2)
    else px2 = Math.round(cw * 0.01)
    const py2 = Math.round((ch - ph) / 2)
    // 商品の背景色でゾーンを全高塗りつぶし → シームレス合成
    ctx.fillStyle = productBgColor
    if (productImagePos === 'right') ctx.fillRect(px2, 0, cw - px2, ch)
    else if (productImagePos === 'left') ctx.fillRect(0, 0, px2 + pw, ch)
    else ctx.fillRect(px2, 0, pw, ch)
    ctx.drawImage(prodImg, px2, py2, pw, ph)
  }

  if (text.trim()) {
    const fontStyle = FONT_STYLES.find(f => f.id === fontStyleId)!
    const sizeScale = TEXT_SIZES.find(s => s.id === overlay.textSizeId)?.canvasScale ?? 1.0
    const fontSize = Math.round(Math.max(12, Math.min(ch * 0.17, 80)) * sizeScale)
    const lineHeight = fontSize * 1.35
    const padding = Math.round(Math.max(20, cw * 0.035))
    const maxTextWidth = cw * 0.60

    try {
      await document.fonts.ready
      await document.fonts.load(`bold ${fontSize}px "${fontStyle.id === 'gothic' ? 'Noto Sans JP' : 'Shippori Mincho'}"`)
    } catch { /* fallback */ }

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
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
              ${current > s.num
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                : current === s.num
                  ? 'text-white shadow-lg shadow-red-200'
                  : 'bg-white border-2 border-slate-200 text-slate-400'}`}
              style={current === s.num ? { background: 'linear-gradient(135deg, #dc2626, #e11d48)' } : {}}>
              {current > s.num ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : s.num}
            </div>
            <span className={`text-xs font-semibold whitespace-nowrap transition-colors
              ${current === s.num ? 'text-slate-900' : current > s.num ? 'text-emerald-600' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-16 sm:w-24 h-px mx-3 mb-5 transition-all duration-500 rounded-full"
              style={{
                background: current > i + 1
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : '#e2e8f0',
              }} />
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
    referenceUrl: '', designStyle: '',
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})

  // Step 2
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(1) // PC特集バナーをデフォルト
  const [overlay, setOverlay] = useState<OverlaySettings>({ hAlign: 'left', vAlign: 'bottom', textColor: 'white', textSizeId: 'md' })
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
  const [productImageDataUrl, setProductImageDataUrl] = useState<string | null>(null)
  const [productImagePos, setProductImagePos] = useState<'left' | 'center' | 'right'>('right')
  const [productBgColor, setProductBgColor] = useState<string>('#f5f5f5')
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
      let productImageBase64: string | undefined
      let productImageMimeType: string | undefined
      if (productImageDataUrl) {
        const resized = await resizeForAnalysis(productImageDataUrl)
        productImageBase64 = resized.base64
        productImageMimeType = resized.mimeType
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.productName, category: form.category,
          target: form.target, catchcopy: form.appealText,
          color: form.mainColor, size, textPosition,
          referenceUrl: form.referenceUrl || undefined,
          designStyle: form.designStyle || undefined,
          productImageBase64,
          productImageMimeType,
          productBgColor: productImageDataUrl ? productBgColor : undefined,
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
    setProductImageDataUrl(null)
    setProductBgColor('#f5f5f5')
    stopProgress(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ─── ダウンロード ───────────────────────────────────────────────────────────
  const downloadComposite = useCallback(async () => {
    if (!generatedImage) return
    setIsDownloading(true)
    try {
      const canvas = await renderToCanvas(generatedImage, form.appealText, overlay, fontStyleId, activeStamp, stampPosition, productImageDataUrl, productImagePos, productBgColor)
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
  }, [generatedImage, form.appealText, overlay, fontStyleId, activeStamp, stampPosition, productImageDataUrl, productImagePos, productBgColor])

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
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 60%, #e8edf5 100%)' }}>

      {/* ドットグリッド背景 */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.18) 1px, transparent 1px)', backgroundSize: '28px 28px', zIndex: 0 }} />

      {/* ヘッダー */}
      <header className="sticky top-0 z-50 border-b border-white/60"
        style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        {/* 上部グラデーションライン */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #dc2626, #e11d48, #f43f5e, #dc2626)' }} />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-15 flex items-center justify-between" style={{ height: '60px' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #dc2626, #be123c)' }}>
              <span className="text-white text-xs font-black tracking-tight">PF</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none tracking-tight">PFクリエイティブ生成</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-none hidden sm:block font-medium">楽天バナー・商品画像 AI生成ツール</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={resetAll}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors px-2 py-1">
                最初から
              </button>
            )}
            <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border"
              style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderColor: '#bfdbfe', color: '#1d4ed8' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
              Imagen 4
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 py-10 px-4 sm:px-6 relative z-10">

        {/* ステップインジケーター（ステップ1〜2のみ） */}
        {step <= 2 && (
          <div className="max-w-xl mx-auto">
            <StepIndicator current={step} />
          </div>
        )}

        {/* ══════ STEP 1：商品情報 ══════ */}
        {step === 1 && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white overflow-hidden" style={{ borderRadius: '20px', boxShadow: '0 0 0 1px rgba(15,23,42,0.06), 0 4px 6px -1px rgba(15,23,42,0.06), 0 20px 40px -8px rgba(15,23,42,0.10)' }}>
              {/* 上部カラーバー */}
              <div className="h-1" style={{ background: 'linear-gradient(90deg, #dc2626, #e11d48, #fb7185)' }} />

              <div className="px-8 pt-7 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] font-black tracking-[0.18em] uppercase px-2 py-0.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)', color: '#be123c' }}>STEP 1 / 3</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">商品情報の入力</h2>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">AIが最適なバナーを設計するための情報を入力してください</p>
              </div>

              <div className="px-8 py-7 space-y-5">
                {/* 商品名 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    商品名 <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={form.productName}
                    onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
                    placeholder="例：プレミアムローストコーヒー 200g"
                    className={`w-full px-4 py-3 text-sm rounded-xl border outline-none transition-all
                      ${errors.productName
                        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 bg-white focus:border-red-400 focus:ring-2 focus:ring-red-50'}`}
                  />
                  {errors.productName && <p className="text-red-500 text-xs mt-1.5">{errors.productName}</p>}
                </div>

                {/* カテゴリ */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">カテゴリ</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all">
                    <option value="">選択してください（任意）</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* ターゲット */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    ターゲット <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={form.target}
                    onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                    placeholder="例：30〜40代の健康意識が高い男性"
                    className={`w-full px-4 py-3 text-sm rounded-xl border outline-none transition-all
                      ${errors.target
                        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 bg-white focus:border-red-400 focus:ring-2 focus:ring-red-50'}`}
                  />
                  {errors.target && <p className="text-red-500 text-xs mt-1.5">{errors.target}</p>}
                </div>

                {/* 訴求テキスト */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    訴求テキスト（キャッチコピー）<span className="text-red-500">*</span>
                  </label>
                  <textarea value={form.appealText}
                    onChange={e => setForm(f => ({ ...f, appealText: e.target.value }))}
                    placeholder="例：毎朝の一杯が変わる。本格派のコク深い味わい。"
                    rows={3}
                    className={`w-full px-4 py-3 text-sm rounded-xl border outline-none resize-none transition-all
                      ${errors.appealText
                        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 bg-white focus:border-red-400 focus:ring-2 focus:ring-red-50'}`}
                  />
                  {errors.appealText && <p className="text-red-500 text-xs mt-1.5">{errors.appealText}</p>}
                </div>

                {/* 参照URL */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    楽天ページURL
                    <span className="ml-2 text-[10px] font-normal text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">任意</span>
                  </label>
                  <div className="relative">
                    <input type="url" value={form.referenceUrl}
                      onChange={e => setForm(f => ({ ...f, referenceUrl: e.target.value }))}
                      placeholder="https://item.rakuten.co.jp/shop/item/"
                      className="w-full pl-9 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    商品ページのURLを入力するとデザインの雰囲気を参考にして生成します
                  </p>
                </div>

                {/* 商品画像アップロード */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    商品画像
                    <span className="ml-2 text-[10px] font-normal text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">任意</span>
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all relative overflow-hidden"
                    style={{ borderColor: productImageDataUrl ? '#fca5a5' : '#e2e8f0', background: productImageDataUrl ? '#fff1f2' : 'white' }}>
                    {productImageDataUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={productImageDataUrl} alt="商品画像プレビュー" className="h-full w-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                          <span className="text-white text-xs font-bold bg-black/40 px-3 py-1 rounded-full">変更</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400 pointer-events-none">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-medium">クリックして画像を選択</span>
                        <span className="text-[10px]">PNG / JPG / WEBP</span>
                      </div>
                    )}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = async ev => {
                          const url = ev.target?.result as string
                          setProductImageDataUrl(url)
                          const bg = await sampleCornerColor(url)
                          setProductBgColor(bg)
                        }
                        reader.readAsDataURL(file)
                        e.target.value = ''
                      }} />
                  </label>
                  {productImageDataUrl && (
                    <button onClick={() => setProductImageDataUrl(null)}
                      className="mt-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors">
                      画像を削除
                    </button>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    アップロードした画像がバナーに合成されます（デザイン乖離を防止）
                  </p>
                </div>

                {/* デザインスタイル */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                    デザインイメージ
                    <span className="ml-2 text-[10px] font-normal text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">任意</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DESIGN_STYLES.map(style => (
                      <button key={style.id}
                        onClick={() => setForm(f => ({ ...f, designStyle: f.designStyle === style.id ? '' : style.id as DesignStyleId }))}
                        className="flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-100"
                        style={form.designStyle === style.id ? {
                          background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)',
                          borderColor: '#fca5a5',
                          boxShadow: '0 0 0 2px rgba(220,38,38,0.15)',
                        } : { borderColor: '#e2e8f0', background: 'white' }}>
                        <span className="text-xl leading-none flex-shrink-0">{style.emoji}</span>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold leading-none mb-0.5 ${form.designStyle === style.id ? 'text-red-700' : 'text-slate-700'}`}>
                            {style.label}
                          </p>
                          <p className="text-[10px] text-slate-400 leading-tight">{style.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {form.designStyle && (
                    <button onClick={() => setForm(f => ({ ...f, designStyle: '' }))}
                      className="mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                      選択をクリア
                    </button>
                  )}
                </div>

                {/* メインカラー */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2.5">メインカラー</label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <input type="color" value={form.mainColor}
                        onChange={e => setForm(f => ({ ...f, mainColor: e.target.value }))}
                        className="w-11 h-11 rounded-xl cursor-pointer opacity-0 absolute inset-0" />
                      <div className="w-11 h-11 rounded-xl border-2 border-slate-200 shadow-sm pointer-events-none"
                        style={{ backgroundColor: form.mainColor }} />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {QUICK_COLORS.map(c => (
                        <button key={c} onClick={() => setForm(f => ({ ...f, mainColor: c }))}
                          className="w-8 h-8 rounded-full transition-all hover:scale-110 focus:outline-none"
                          style={{
                            backgroundColor: c,
                            boxShadow: form.mainColor === c
                              ? `0 0 0 2px white, 0 0 0 4px ${c}, 0 4px 8px rgba(0,0,0,0.2)`
                              : '0 1px 3px rgba(0,0,0,0.15)',
                            transform: form.mainColor === c ? 'scale(1.15)' : 'scale(1)',
                          }} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 font-mono ml-auto tracking-wider">{form.mainColor.toUpperCase()}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    選択したカラーをAIへのヒントとして送信します。バナー画像の背景・アクセントカラーに反映されます。
                  </p>
                </div>
              </div>

              <div className="px-8 py-5 border-t border-slate-100 flex justify-end"
                style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
                <button onClick={goToStep2}
                  className="flex items-center gap-2.5 px-7 py-3 text-white text-sm font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-slate-200 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
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
            <div className="bg-white overflow-hidden" style={{ borderRadius: '20px', boxShadow: '0 0 0 1px rgba(15,23,42,0.06), 0 4px 6px -1px rgba(15,23,42,0.06), 0 20px 40px -8px rgba(15,23,42,0.10)' }}>
              {/* 上部カラーバー */}
              <div className="h-1" style={{ background: 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)' }} />

              <div className="px-8 pt-7 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] font-black tracking-[0.18em] uppercase px-2 py-0.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', color: '#1d4ed8' }}>STEP 2 / 3</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">デザイン設定</h2>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">テキストの配置・フォント・スタンプ・出力サイズを選択します</p>
              </div>

              <div className="px-8 py-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7">

                  {/* 左列：テキスト設定 */}
                  <div className="space-y-5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">テキスト設定</p>

                    {/* 横位置 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">横位置</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {([
                          { value: 'left',   label: '左寄せ' },
                          { value: 'center', label: '中央'   },
                          { value: 'right',  label: '右寄せ' },
                        ] as const).map(opt => (
                          <button key={opt.value} onClick={() => setOverlay(o => ({ ...o, hAlign: opt.value }))}
                            className={`py-2.5 text-xs rounded-xl border flex flex-col items-center gap-0.5 transition-all font-medium
                              ${overlay.hAlign === opt.value
                                ? 'border-blue-400 text-blue-700'
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            style={overlay.hAlign === opt.value ? { background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' } : {}}>
                            <span className={`text-[8px] w-full px-1.5 ${opt.value === 'left' ? 'text-left' : opt.value === 'right' ? 'text-right' : 'text-center'}`}>▬</span>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 縦位置 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">縦位置</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([{ value: 'top', label: '上部' }, { value: 'bottom', label: '下部' }] as const).map(opt => (
                          <button key={opt.value} onClick={() => setOverlay(o => ({ ...o, vAlign: opt.value }))}
                            className={`py-2.5 text-xs font-medium rounded-xl border transition-all
                              ${overlay.vAlign === opt.value ? 'border-blue-400 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            style={overlay.vAlign === opt.value ? { background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' } : {}}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* テキストカラー */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">テキストカラー</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([
                          { value: 'white', label: '白（縁：黒）', dotStyle: { background: 'white', boxShadow: '0 0 0 1.5px #cbd5e1' } },
                          { value: 'black', label: '黒（縁：白）', dotStyle: { background: '#0f172a' } },
                        ] as const).map(opt => (
                          <button key={opt.value} onClick={() => setOverlay(o => ({ ...o, textColor: opt.value }))}
                            className={`py-2.5 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 transition-all
                              ${overlay.textColor === opt.value ? 'border-blue-400 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            style={overlay.textColor === opt.value ? { background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' } : {}}>
                            <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={opt.dotStyle} />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* フォントスタイル */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">フォントスタイル</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {FONT_STYLES.map(fs => (
                          <button key={fs.id} onClick={() => setFontStyleId(fs.id)}
                            className={`py-3 rounded-xl border transition-all flex flex-col items-center gap-0.5
                              ${fontStyleId === fs.id ? 'border-blue-400 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            style={fontStyleId === fs.id ? { background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' } : {}}>
                            <span className="text-sm font-semibold" style={{ fontFamily: fs.cssVar }}>{fs.label}</span>
                            <span className="text-[10px] text-slate-400">{fs.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* テキストサイズ */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">テキストサイズ</label>
                      <div className="flex gap-1.5">
                        {TEXT_SIZES.map(size => (
                          <button key={size.id} onClick={() => setOverlay(o => ({ ...o, textSizeId: size.id }))}
                            className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all
                              ${overlay.textSizeId === size.id ? 'border-blue-400 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            style={overlay.textSizeId === size.id ? { background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' } : {}}>
                            {size.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5">プレビューと書き出し両方に反映されます</p>
                    </div>

                    {/* 商品画像の配置 */}
                    {productImageDataUrl && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">商品画像の配置</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {([
                            { value: 'left',   label: '左' },
                            { value: 'center', label: '中央' },
                            { value: 'right',  label: '右' },
                          ] as const).map(opt => (
                            <button key={opt.value} onClick={() => setProductImagePos(opt.value)}
                              className={`py-2.5 text-xs font-medium rounded-xl border transition-all
                                ${productImagePos === opt.value ? 'border-blue-400 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                              style={productImagePos === opt.value ? { background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' } : {}}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 右列：スタンプ & サイズ */}
                  <div className="space-y-5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">スタンプ & サイズ</p>

                    {/* スタンプ */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-600">スタンプ素材（任意）</label>
                        {activeStamp && (
                          <button onClick={() => setActiveStamp(null)}
                            className="text-xs text-slate-400 hover:text-slate-600 transition-colors">クリア</button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mb-2">
                        {STAMPS.map(stamp => (
                          <button key={stamp.id}
                            onClick={() => setActiveStamp(activeStamp === stamp.id ? null : stamp.id)}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all
                              ${activeStamp === stamp.id ? 'border-blue-400 scale-105 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                            style={activeStamp === stamp.id ? { background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' } : {}}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={svgToDataUrl(stamp.svg)} alt={stamp.label} className="w-9 h-9" />
                            <span className="text-[10px] text-slate-500 leading-tight text-center">{stamp.label}</span>
                          </button>
                        ))}
                      </div>
                      {activeStamp && (
                        <div className="grid grid-cols-2 gap-1.5">
                          {STAMP_POSITIONS.map(pos => (
                            <button key={pos.id} onClick={() => setStampPosition(pos.id)}
                              className={`py-1.5 text-xs font-medium rounded-xl border transition-all
                                ${stampPosition === pos.id ? 'border-blue-400 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                              style={stampPosition === pos.id ? { background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' } : {}}>
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
                                  <p className="text-xs font-medium text-slate-800 truncate">{size.label}</p>
                                </div>
                                <div className="rounded-md flex-shrink-0" style={{ background: 'linear-gradient(135deg, #e2e8f0, #f1f5f9)',
                                    width: `${Math.min(38, (size.width / size.height) * 15)}px`,
                                    height: `${Math.min(15, (size.height / size.width) * 38)}px`,
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

              <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
                <button onClick={backToStep1}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-white transition-all bg-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  戻る
                </button>
                <button onClick={goToStep3}
                  className="flex items-center gap-2.5 px-7 py-3 text-white text-sm font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-red-200 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #be123c)' }}>
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
              <div className="bg-white p-12 text-center" style={{ borderRadius: '20px', boxShadow: '0 0 0 1px rgba(15,23,42,0.06), 0 4px 6px -1px rgba(15,23,42,0.06), 0 20px 40px -8px rgba(15,23,42,0.10)' }}>
                <div className="relative inline-flex items-center justify-center mb-7">
                  {/* 外側の光るリング */}
                  <div className="absolute w-24 h-24 rounded-full animate-ping opacity-10"
                    style={{ background: 'radial-gradient(circle, #dc2626, transparent)' }} />
                  <div className="absolute w-20 h-20 rounded-full"
                    style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.1), rgba(251,113,133,0.05))', animation: 'spin 3s linear infinite reverse' }} />
                  <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)' }}>
                    <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24"
                      style={{ color: '#dc2626' }}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1.5 tracking-tight">Imagen 4 で生成中...</h3>
                <p className="text-sm text-slate-500 mb-9 leading-relaxed">Google の最高品質モデルが<br />20〜40秒でバナーを設計します</p>
                <div className="max-w-xs mx-auto space-y-3">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>生成進捗</span><span style={{ color: '#dc2626' }}>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: '#f1f5f9' }}>
                    <div className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                      style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #dc2626, #e11d48, #f43f5e)' }}>
                      <div className="absolute inset-0 opacity-40"
                        style={{ background: 'linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)', animation: 'shimmer 1.5s infinite' }} />
                    </div>
                  </div>
                  <div className="flex justify-between pt-1">
                    {(['プロンプト最適化', '画像生成中', '後処理'] as const).map((s, i) => (
                      <div key={s} className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full transition-colors"
                          style={{ background: i <= currentProgressStep ? '#dc2626' : '#e2e8f0' }} />
                        <span className={`text-[10px] font-medium transition-colors
                          ${i === currentProgressStep ? 'text-red-600' : i < currentProgressStep ? 'text-slate-400' : 'text-slate-300'}`}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* エラー */}
            {!isGenerating && generateError && (
              <div className="bg-white overflow-hidden" style={{ borderRadius: '20px', boxShadow: '0 0 0 1px rgba(220,38,38,0.12), 0 4px 6px -1px rgba(220,38,38,0.06), 0 20px 40px -8px rgba(15,23,42,0.10)' }}>
                <div className="h-1" style={{ background: 'linear-gradient(90deg, #dc2626, #e11d48)' }} />
                <div className="p-8 flex gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)' }}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#dc2626' }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 mb-1">生成エラーが発生しました</p>
                    <p className="text-sm text-slate-500 leading-relaxed">{generateError}</p>
                  </div>
                </div>
                <div className="flex gap-3 px-8 pb-7">
                  <button onClick={backToStep2}
                    className="px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors bg-white">
                    設定を変更
                  </button>
                  <button onClick={() => { setGenerateError(null); handleGenerate() }}
                    className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:shadow-md active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #dc2626, #be123c)' }}>
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
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-black tracking-[0.15em] uppercase px-2 py-0.5 rounded-full"
                        style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#065f46' }}>完成</span>
                      <h3 className="text-sm font-bold text-slate-900">{form.productName}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 pl-0.5">
                      {generatedImage.size.label} · {form.category || '未設定'} · {form.target}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={backToStep2}
                      className="text-xs text-slate-500 border border-slate-200 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      設定を変更
                    </button>
                    <button onClick={() => { setGeneratedImage(null); handleGenerate() }}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      再生成
                    </button>
                  </div>
                </div>

                {/* 画像カード */}
                <div className="bg-white overflow-hidden" style={{ borderRadius: '20px', boxShadow: '0 0 0 1px rgba(15,23,42,0.06), 0 4px 6px -1px rgba(15,23,42,0.06), 0 20px 40px -8px rgba(15,23,42,0.12)' }}>
                  {/* 上部カラーバー */}
                  <div className="h-1" style={{ background: 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7)' }} />
                  {/* 画像プレビュー */}
                  <div className="p-5" style={{ background: 'linear-gradient(160deg, #0f172a, #1e293b)' }}>
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
                              fontSize: TEXT_SIZES.find(s => s.id === overlay.textSizeId)?.cssClamp ?? 'clamp(11px, 3cqw, 22px)',
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

                      {/* 商品画像オーバーレイ（背景色ゾーン付き） */}
                      {productImageDataUrl && (
                        <>
                          {/* 背景色ゾーン */}
                          <div className="absolute inset-y-0 pointer-events-none"
                            style={{
                              backgroundColor: productBgColor,
                              ...(productImagePos === 'right'
                                ? { right: 0, width: '49%' }
                                : productImagePos === 'left'
                                  ? { left: 0, width: '49%' }
                                  : { left: '25%', width: '50%' }),
                            }} />
                          {/* 商品画像 */}
                          <div className="absolute pointer-events-none flex items-center"
                            style={{
                              top: '50%',
                              maxHeight: '92%',
                              maxWidth: '48%',
                              ...(productImagePos === 'center'
                                ? { left: '50%', transform: 'translate(-50%, -50%)' }
                                : productImagePos === 'right'
                                  ? { right: '1%', transform: 'translateY(-50%)' }
                                  : { left: '1%', transform: 'translateY(-50%)' }),
                            }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={productImageDataUrl} alt="商品画像" className="max-h-full max-w-full object-contain" />
                          </div>
                        </>
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
                    <div className="border-t border-slate-100">
                      <button onClick={() => setShowReasoning(v => !v)}
                        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-white text-xs"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            ✦
                          </div>
                          <span className="text-xs font-bold text-slate-700">AI診断レポート</span>
                          <span className="text-xs text-slate-400 hidden sm:block">— 提案書にそのまま使える設計根拠</span>
                        </div>
                        <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${showReasoning ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showReasoning && (
                        <div className="px-6 pb-5 space-y-2.5">
                          {generatedImage.reasoning.map((point, i) => (
                            <div key={i} className="rounded-xl p-3.5 flex gap-3"
                              style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1px solid rgba(139,92,246,0.15)' }}>
                              <span className="text-lg flex-shrink-0 leading-none mt-0.5">{point.icon}</span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold mb-1" style={{ color: '#4c1d95' }}>{point.title}</p>
                                <p className="text-xs leading-relaxed" style={{ color: '#5b21b6' }}>{point.body}</p>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const text = generatedImage.reasoning!.map(p => `【${p.title}】\n${p.body}`).join('\n\n')
                              navigator.clipboard.writeText(text).catch(() => {})
                            }}
                            className="text-xs font-medium transition-colors mt-1 block" style={{ color: '#7c3aed' }}>
                            ↗ テキストをコピー（提案書用）
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* アクションフッター */}
                  <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3"
                    style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
                    {/* フィードバック */}
                    <div className="flex items-center gap-1 border border-slate-200 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                      {(['good', 'bad'] as const).map((type, ti) => (
                        <div key={type} className="flex items-center">
                          {ti > 0 && <div className="w-px h-5 bg-slate-200" />}
                          <button onClick={() => handleFeedback(type)}
                            className={`px-3 py-2 text-xs flex items-center gap-1.5 transition-all font-medium
                              ${feedback === type
                                ? type === 'good' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                                : 'text-slate-500 hover:bg-slate-50'}`}>
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
                        className="px-3 py-2 text-xs text-slate-500 border border-slate-200 rounded-xl hover:bg-white transition-colors whitespace-nowrap bg-white">
                        元画像
                      </button>
                      <button onClick={downloadComposite} disabled={isDownloading}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl transition-all hover:shadow-md active:scale-95 whitespace-nowrap disabled:opacity-50"
                        style={{ background: isDownloading ? '#9ca3af' : 'linear-gradient(135deg, #dc2626, #be123c)' }}>
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
                  <div className="bg-white overflow-hidden" style={{ borderRadius: '16px', boxShadow: '0 0 0 1px rgba(15,23,42,0.05), 0 2px 8px rgba(15,23,42,0.06)' }}>
                    <button onClick={() => setShowPrompt(v => !v)}
                      className="w-full flex items-center justify-between px-6 py-3.5 text-left hover:bg-slate-50 transition-colors">
                      <span className="text-xs font-semibold text-slate-500">送信プロンプトを確認（品質改善用）</span>
                      <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showPrompt ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showPrompt && (
                      <pre className="px-6 pb-5 text-xs text-slate-500 border-t border-slate-100 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto"
                        style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
                        {lastPrompt}
                      </pre>
                    )}
                  </div>
                )}

                {/* 最初からボタン */}
                <div className="text-center pt-2 pb-2">
                  <button onClick={resetAll}
                    className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors font-medium group">
                    <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    新しいバナーを作成する
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="border-t border-slate-200 py-5 relative z-10"
        style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #dc2626, #be123c)' }}>
              <span className="text-white text-[9px] font-black">PF</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">PFクリエイティブ生成</span>
            <span className="text-slate-200 text-xs">|</span>
            <span className="text-xs text-slate-300">v1.0</span>
          </div>
          <p className="text-[11px] text-slate-300">Powered by Imagen 4 · Google AI</p>
        </div>
      </footer>
    </div>
  )
}
