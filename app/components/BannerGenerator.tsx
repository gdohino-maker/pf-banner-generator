'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

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

const QUICK_COLORS = ['#ffffff', '#bf0000', '#1a1a2e', '#0f3460', '#2d6a4f', '#e76f51', '#264653']

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

// cqwPct = バナー幅に対する% (CSS/Canvas共通) — プレビューとDLで同一比率になる
const TEXT_SIZES = [
  { id: 'xs' as const, label: '極小', cqwPct: 1.8 },
  { id: 'sm' as const, label: '小',   cqwPct: 2.4 },
  { id: 'md' as const, label: '中',   cqwPct: 3.0 },
  { id: 'lg' as const, label: '大',   cqwPct: 4.2 },
  { id: 'xl' as const, label: '特大', cqwPct: 5.8 },
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
  productImageDesc: string
  category: string
  target: string
  appealText: string
  mainColor: string
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

// AI背景除去（@imgly/background-removal — ブラウザ内ONNX推論）
// 成功時は blob: URL を返す。失敗時は null を返す（data: URLを返すと成功と区別できないため）
async function removeProductBackground(
  dataUrl: string,
  onProgress?: (pct: number) => void,
): Promise<string | null> {
  try {
    const { removeBackground } = await import('@imgly/background-removal')

    // fetch(data:) より直接Blob変換の方が確実
    const base64 = dataUrl.split(',')[1]
    if (!base64) return null
    const mimeType = dataUrl.match(/data:(.*?);/)?.[1] ?? 'image/jpeg'
    const byteStr = atob(base64)
    const bytes = new Uint8Array(byteStr.length)
    for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i)
    const inputBlob = new Blob([bytes], { type: mimeType })

    const outputBlob = await removeBackground(inputBlob, {
      output: { format: 'image/png', quality: 1.0 },
      progress: (key: string, current: number, total: number) => {
        if (total > 0 && onProgress) onProgress(Math.round((current / total) * 100))
      },
    })
    return URL.createObjectURL(outputBlob)
  } catch (e) {
    console.error('[BG Removal] Failed:', e)
    return null
  }
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
  productImageCutoutUrl: string | null = null,
  productOffsetX = 0,
  productOffsetY = 0,
  productScale = 1.0,
  textBand = false,
  textShadowMode: 'none' | 'standard' | 'strong' = 'standard',
): Promise<HTMLCanvasElement> {
  const { width: cw, height: ch } = img.size
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')!

  const bgImg = await loadImage(img.dataUrl)
  const iw = bgImg.naturalWidth, ih = bgImg.naturalHeight
  // object-fit: cover — Math.max(scale) でカバーし、中央クロップ
  const bgScale = Math.max(cw / iw, ch / ih)
  const srcW = cw / bgScale
  const srcH = ch / bgScale
  const srcX = (iw - srcW) / 2
  const srcY = (ih - srcH) / 2
  ctx.drawImage(bgImg, srcX, srcY, srcW, srcH, 0, 0, cw, ch)

  // 商品画像を背景の上・テキストの下に合成
  const effectiveProductUrl = productImageCutoutUrl ?? productImageDataUrl
  if (effectiveProductUrl) {
    const prodImg = await loadImage(effectiveProductUrl)
    const maxH = ch * 0.92 * productScale
    const maxW = cw * 0.48 * productScale
    const scale = Math.min(maxW / prodImg.naturalWidth, maxH / prodImg.naturalHeight, 1.0)
    const pw = Math.round(prodImg.naturalWidth * scale)
    const ph = Math.round(prodImg.naturalHeight * scale)
    // ベース位置（productImagePos）+ オフセット
    const baseX = productImagePos === 'right' ? cw - pw / 2 - Math.round(cw * 0.01)
                : productImagePos === 'left'  ? pw / 2 + Math.round(cw * 0.01)
                : cw / 2
    const finalCx = Math.round(baseX + productOffsetX * cw)
    const finalCy = Math.round(ch / 2 + productOffsetY * ch)
    const px2 = finalCx - pw / 2
    const py2 = finalCy - ph / 2
    if (!productImageCutoutUrl) {
      ctx.fillStyle = productBgColor
      if (productImagePos === 'right') ctx.fillRect(Math.round(cw * 0.5), 0, cw, ch)
      else if (productImagePos === 'left') ctx.fillRect(0, 0, Math.round(cw * 0.5), ch)
      else ctx.fillRect(Math.round(cw * 0.25), 0, Math.round(cw * 0.5), ch)
    }
    // 切り抜き済み商品画像にドロップシャドウを付与してシール感を解消
    if (productImageCutoutUrl) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.18)'
      ctx.shadowBlur = Math.round(cw * 0.018)   // バナー幅に対して相対値
      ctx.shadowOffsetX = Math.round(cw * 0.004)
      ctx.shadowOffsetY = Math.round(cw * 0.012)
    }
    ctx.drawImage(prodImg, Math.round(px2), Math.round(py2), pw, ph)
    // シャドウをリセット（テキスト等に影響させない）
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  if (text.trim()) {
    const fontStyle = FONT_STYLES.find(f => f.id === fontStyleId)!
    const cqwPct = (TEXT_SIZES.find(s => s.id === overlay.textSizeId)?.cqwPct ?? 3.0) / 100
    const fontSize = Math.round(Math.max(8, cw * cqwPct))
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

    // 座布団（背景帯）
    if (textBand) {
      const bandPad = Math.round(padding * 0.5)
      const bandY = overlay.vAlign === 'bottom'
        ? ch - padding - blockH - bandPad
        : padding - bandPad
      ctx.fillStyle = overlay.textColor === 'white' ? 'rgba(0,0,0,0.62)' : 'rgba(255,255,255,0.88)'
      ctx.fillRect(0, bandY, cw, blockH + bandPad * 2)
    }

    const strokeColor = overlay.textColor === 'white' ? 'rgba(0,0,0,0.88)' : 'rgba(255,255,255,0.88)'
    const fillColor   = overlay.textColor === 'white' ? '#ffffff' : '#111111'

    lines.forEach((line, i) => {
      const ly = y + i * lineHeight
      ctx.shadowColor = 'transparent'
      if (textShadowMode !== 'none') {
        ctx.lineWidth = textShadowMode === 'strong' ? Math.max(4, fontSize * 0.16) : Math.max(2, fontSize * 0.10)
        ctx.lineJoin = 'round'
        ctx.strokeStyle = strokeColor
        ctx.strokeText(line, x, ly, maxTextWidth)
        ctx.shadowColor = strokeColor
        ctx.shadowBlur = textShadowMode === 'strong' ? fontSize * 0.5 : fontSize * 0.22
        ctx.shadowOffsetX = textShadowMode === 'strong' ? 2 : 0
        ctx.shadowOffsetY = textShadowMode === 'strong' ? 4 : Math.round(fontSize * 0.06)
      }
      ctx.fillStyle = fillColor
      ctx.fillText(line, x, ly, maxTextWidth)
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0
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
export default function BannerGenerator({ mode = 'concept' }: { mode?: 'concept' | 'product' }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1
  const [form, setForm] = useState<FormData>({
    productName: '', productImageDesc: '', category: '', target: '', appealText: '', mainColor: '#bf0000',
    designStyle: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Step 2
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(1) // PC特集バナーをデフォルト
  const [overlay, setOverlay] = useState<OverlaySettings>({ hAlign: 'left', vAlign: 'bottom', textColor: 'white', textSizeId: 'md' })
  const [fontStyleId, setFontStyleId] = useState<FontStyleId>('gothic')
  const [activeStamp, setActiveStamp] = useState<string | null>(null)
  const [stampPosition, setStampPosition] = useState<StampPosition>('top-right')

  // Step 2
  const [variations, setVariations] = useState<1 | 2>(1)

  // Step 3
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [selectedImgIdx, setSelectedImgIdx] = useState(0)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [lastPrompt, setLastPrompt] = useState<string | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [productImageDataUrl, setProductImageDataUrl] = useState<string | null>(null)
  const [productImagePos, setProductImagePos] = useState<'left' | 'center' | 'right'>('right')
  const [productBgColor, setProductBgColor] = useState<string>('#f5f5f5')
  const [productImageCutoutUrl, setProductImageCutoutUrl] = useState<string | null>(null)
  const [isRemovingBg, setIsRemovingBg] = useState(false)
  const [bgRemovalPct, setBgRemovalPct] = useState(0)
  const [bgRemovalError, setBgRemovalError] = useState(false)
  // 商品画像の位置・スケール（ドラッグで操作）
  const [productOffsetX, setProductOffsetX] = useState(0)   // バナー幅の割合（-0.45〜0.45）
  const [productOffsetY, setProductOffsetY] = useState(0)   // バナー高さの割合
  const [productScale, setProductScale] = useState(1.0)     // スケール倍率
  // テキスト装飾
  const [textBand, setTextBand] = useState(false)                                // 座布団（背景帯）
  const [textShadowMode, setTextShadowMode] = useState<'none' | 'standard' | 'strong'>('standard')

  // selectedImgIdx を使った computed value — downloadCompositeより前に定義
  const generatedImage = generatedImages[selectedImgIdx] ?? null
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // ドラッグ用
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const isDraggingProduct = useRef(false)
  const dragStartData = useRef({ clientX: 0, clientY: 0, startX: 0, startY: 0 })

  // ─── バリデーション ─────────────────────────────────────────────────────────
  const validate = () => {
    const next: Record<string, string> = {}
    if (mode === 'product') {
      if (!productImageDataUrl) next.productImage = '商品画像をアップロードしてください'
    } else {
      if (!form.productImageDesc.trim()) next.productImageDesc = 'バナーイメージを入力してください'
    }
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

  // ─── 商品画像ドラッグ ──────────────────────────────────────────────────────
  const handleProductPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingProduct.current = true
    dragStartData.current = { clientX: e.clientX, clientY: e.clientY, startX: productOffsetX, startY: productOffsetY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [productOffsetX, productOffsetY])

  const handleProductPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingProduct.current || !previewContainerRef.current) return
    const rect = previewContainerRef.current.getBoundingClientRect()
    const dx = (e.clientX - dragStartData.current.clientX) / rect.width
    const dy = (e.clientY - dragStartData.current.clientY) / rect.height
    setProductOffsetX(Math.max(-0.45, Math.min(0.45, dragStartData.current.startX + dx)))
    setProductOffsetY(Math.max(-0.45, Math.min(0.45, dragStartData.current.startY + dy)))
  }, [])

  const handleProductPointerUp = useCallback(() => { isDraggingProduct.current = false }, [])

  const resetProductPosition = useCallback(() => {
    setProductOffsetX(0); setProductOffsetY(0); setProductScale(1.0)
  }, [])

  // ─── Smart Auto-Scaling & Positioning ────────────────────────────────────────
  // バナーサイズ変更 or テキスト位置変更時に商品画像の初期スケール・配置を自動最適化
  useEffect(() => {
    if (!productImageDataUrl) return

    const size = BANNER_SIZES[selectedSizeIdx]
    const cw = size.width, ch = size.height
    const ratio = cw / ch
    const isWide = ratio >= 1.6

    const effectiveUrl = productImageCutoutUrl ?? productImageDataUrl

    loadImage(effectiveUrl).then(img => {
      const nw = img.naturalWidth, nh = img.naturalHeight
      if (!nw || !nh) return

      // ─── スケール逆算 ──────────────────────────────────────────────────────
      // renderToCanvas の制約:
      //   maxH = ch * 0.92 * productScale
      //   maxW = cw * 0.48 * productScale
      //   scale = min(maxW/nw, maxH/nh, 1.0)
      let targetW: number, targetH: number

      if (isWide) {
        // 横長バナー: 商品高さ = バナー高さの75%
        targetH = ch * 0.75
        targetW = nw * (targetH / nh)
        // cw*0.46 を超えると幅制約に引っかかるため上限補正
        if (targetW > cw * 0.46) {
          targetW = cw * 0.46
          targetH = nh * (targetW / nw)
        }
      } else {
        // スクエア / 縦長: 商品の長辺 = バナー長辺の55%
        const bannerLong = Math.max(cw, ch)
        const imgLong    = Math.max(nw, nh)
        const dsf = (bannerLong * 0.55) / imgLong
        targetW = nw * dsf
        targetH = nh * dsf
      }

      // renderToCanvas の制約がどちらで binding するか判定して productScale を逆算
      const wRatio = (cw * 0.48) / nw
      const hRatio = (ch * 0.92) / nh
      let newScale: number
      if (wRatio <= hRatio) {
        newScale = targetW / (cw * 0.48)  // 幅制約が binding
      } else {
        newScale = targetH / (ch * 0.92)  // 高さ制約が binding
      }
      newScale = Math.max(0.3, Math.min(2.5, newScale))

      // ─── 配置: textSide に連動 ─────────────────────────────────────────────
      // テキスト左 → 商品を右側 (productImagePos='right', center≈75% of width)
      // テキスト右 → 商品を左側 (productImagePos='left',  center≈25% of width)
      const newPos: 'left' | 'center' | 'right' =
        overlay.hAlign === 'right' ? 'left' : 'right'

      setProductScale(newScale)
      setProductImagePos(newPos)
      setProductOffsetX(0)
      setProductOffsetY(0)
    }).catch(() => {
      // 画像ロード失敗時は位置のみ更新
      setProductImagePos(overlay.hAlign === 'right' ? 'left' : 'right')
      setProductOffsetX(0)
      setProductOffsetY(0)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSizeIdx, overlay.hAlign, productImageDataUrl, productImageCutoutUrl])

  // ─── 生成処理 ───────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    setGenerateError(null)
    setGeneratedImages([])
    setSelectedImgIdx(0)
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
          productName: mode === 'product' ? undefined : (form.productName || undefined),
          productImageDesc: form.productImageDesc || undefined,
          category: form.category,
          target: form.target, catchcopy: form.appealText,
          color: form.mainColor, size, textPosition,
          designStyle: form.designStyle || undefined,
          productImageBase64,
          productImageMimeType,
          productBgColor: productImageDataUrl ? productBgColor : undefined,
          variations,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `サーバーエラー (${res.status})`)
      stopProgress(100)
      setLastPrompt(data.prompt ?? null)
      const urls: string[] = data.imageDataUrls ?? (data.imageDataUrl ? [data.imageDataUrl] : [])
      setGeneratedImages(urls.map((dataUrl, i) => ({
        id: `${Date.now()}_${i}`,
        size, dataUrl,
        usedAspectRatio: data.usedAspectRatio ?? '',
        reasoning: i === 0 ? (data.reasoning ?? []) : [],
        imageSource: data.imageSource ?? 'imagen4',
      })))
    } catch (err) {
      stopProgress(0)
      setGenerateError(err instanceof Error ? err.message : '生成に失敗しました')
    } finally { setIsGenerating(false) }
  }, [form, selectedSizeIdx, overlay, productImageDataUrl, productBgColor, variations])

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
    setGeneratedImages([])
    setSelectedImgIdx(0)
    setGenerateError(null)
    setFeedback(null)
    setProductImageDataUrl(null)
    setProductBgColor('#f5f5f5')
    setProductImageCutoutUrl(null)
    setIsRemovingBg(false)
    setBgRemovalPct(0)
    setBgRemovalError(false)
    setProductOffsetX(0); setProductOffsetY(0); setProductScale(1.0)
    stopProgress(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ─── ダウンロード ───────────────────────────────────────────────────────────
  const downloadComposite = useCallback(async () => {
    if (!generatedImage) return
    setIsDownloading(true)
    try {
      const canvas = await renderToCanvas(generatedImage, form.appealText, overlay, fontStyleId, activeStamp, stampPosition, productImageDataUrl, productImagePos, productBgColor, productImageCutoutUrl, productOffsetX, productOffsetY, productScale, textBand, textShadowMode)
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
  }, [generatedImage, form.appealText, overlay, fontStyleId, activeStamp, stampPosition, productImageDataUrl, productImagePos, productBgColor, productImageCutoutUrl, productOffsetX, productOffsetY, productScale, textBand, textShadowMode])

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
  const textShadowCSS = textShadowMode === 'none' ? 'none'
    : textShadowMode === 'strong'
      ? (overlay.textColor === 'white'
          ? '2px 4px 12px rgba(0,0,0,0.95), 1px 1px 0 rgba(0,0,0,1), -1px -1px 0 rgba(0,0,0,1), 1px -1px 0 rgba(0,0,0,1), -1px 1px 0 rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.8)'
          : '2px 4px 12px rgba(255,255,255,0.95), 1px 1px 0 rgba(255,255,255,1), -1px -1px 0 rgba(255,255,255,1)')
      : (overlay.textColor === 'white'
          ? '1px 1px 0 rgba(0,0,0,0.9),-1px -1px 0 rgba(0,0,0,0.9),1px -1px 0 rgba(0,0,0,0.9),-1px 1px 0 rgba(0,0,0,0.9),0 3px 10px rgba(0,0,0,0.6)'
          : '1px 1px 0 rgba(255,255,255,0.9),-1px -1px 0 rgba(255,255,255,0.9),1px -1px 0 rgba(255,255,255,0.9),-1px 1px 0 rgba(255,255,255,0.9)')
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
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {mode === 'product' ? '商品画像のアップロード' : 'バナーイメージの入力'}
                </h2>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  {mode === 'product'
                    ? '商品画像をアップロードするとAIが自動で背景を除去し合成バナーを生成します'
                    : 'どんな雰囲気のバナーにしたいか、イメージを自由に記述してください'}
                </p>
              </div>

              <div className="px-8 py-7 space-y-5">

                {/* concept mode: バナーイメージ記述（必須） */}
                {mode !== 'product' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      バナーイメージ <span className="text-red-500">*</span>
                    </label>
                    <textarea value={form.productImageDesc}
                      onChange={e => setForm(f => ({ ...f, productImageDesc: e.target.value }))}
                      placeholder={'例：\n・秋の紅葉の温かみ、黄金色とオレンジのグラデーション\n・高級感のある黒×シャンパンゴールド\n・夏の爽やかな青空と白いボケ光'}
                      rows={4}
                      className={`w-full px-4 py-3 text-sm rounded-xl border outline-none transition-all resize-none
                        ${errors.productImageDesc
                          ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100'
                          : 'border-slate-200 bg-white focus:border-red-400 focus:ring-2 focus:ring-red-50'}`}
                    />
                    {errors.productImageDesc && <p className="text-red-500 text-xs mt-1">{errors.productImageDesc}</p>}
                    <p className="text-[11px] text-slate-400 mt-1.5">AIがイメージに合った抽象背景グラデーションを生成します</p>
                  </div>
                )}

                {/* product mode: 商品画像アップロード（必須） */}
                {mode === 'product' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      商品画像 <span className="text-red-500">*</span>
                      <span className="ml-2 text-[10px] font-normal text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">AI背景自動除去</span>
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl cursor-pointer transition-all relative overflow-hidden"
                      style={{ borderColor: productImageDataUrl ? '#fca5a5' : errors.productImage ? '#f87171' : '#e2e8f0', background: productImageDataUrl ? (productImageCutoutUrl ? 'repeating-conic-gradient(#e5e7eb 0% 25%, white 0% 50%) 0 0 / 16px 16px' : '#fff1f2') : errors.productImage ? '#fef2f2' : 'white' }}>
                      {productImageDataUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={productImageCutoutUrl ?? productImageDataUrl} alt="商品画像プレビュー" className="h-full w-full object-contain p-2" />
                          {isRemovingBg && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                              style={{ background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(3px)' }}>
                              <svg className="w-5 h-5 animate-spin text-red-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              <span className="text-xs font-semibold text-red-600">AI背景除去中{bgRemovalPct > 0 ? ` ${bgRemovalPct}%` : '...'}</span>
                              <span className="text-[10px] text-slate-400">{bgRemovalPct === 0 ? '初回はモデル読込に30秒ほど' : bgRemovalPct < 80 ? '推論中...' : 'もうすぐ完了'}</span>
                            </div>
                          )}
                          {!isRemovingBg && (
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                              <span className="text-white text-xs font-bold bg-black/40 px-3 py-1 rounded-full">変更</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400 pointer-events-none">
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-semibold">クリックして商品画像を選択</span>
                          <span className="text-xs">PNG / JPG / WEBP</span>
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
                            setProductImageCutoutUrl(null)
                            setBgRemovalError(false)
                            setBgRemovalPct(0)
                            setIsRemovingBg(true)
                            const bg = await sampleCornerColor(url)
                            setProductBgColor(bg)
                            const cutout = await removeProductBackground(url, pct => setBgRemovalPct(pct))
                            if (cutout) {
                              setProductImageCutoutUrl(cutout)
                            } else {
                              setBgRemovalError(true)
                              setProductImageCutoutUrl(null)
                            }
                            setIsRemovingBg(false)
                          }
                          reader.readAsDataURL(file)
                          e.target.value = ''
                        }} />
                    </label>
                    {productImageDataUrl && (
                      <div className="flex items-center gap-3 mt-1.5">
                        <button onClick={() => { setProductImageDataUrl(null); setProductImageCutoutUrl(null); setIsRemovingBg(false); setBgRemovalError(false); setBgRemovalPct(0) }}
                          className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                          画像を削除
                        </button>
                        {productImageCutoutUrl && !isRemovingBg && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            背景除去済み
                          </span>
                        )}
                        {bgRemovalError && !isRemovingBg && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                            ⚠ 背景除去失敗（元画像で合成）
                          </span>
                        )}
                      </div>
                    )}
                    {errors.productImage && <p className="text-red-500 text-xs mt-1.5">{errors.productImage}</p>}
                    <p className="text-[11px] text-slate-400 mt-1.5">アップロード後、AIが自動で背景を除去してバナーに合成します</p>
                  </div>
                )}

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
                    ターゲット
                    <span className="ml-2 text-[10px] font-normal text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">任意</span>
                  </label>
                  <input type="text" value={form.target}
                    onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                    placeholder="例：30〜40代の健康意識が高い男性"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
                  />
                </div>

                {/* 訴求テキスト */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    訴求テキスト（キャッチコピー）
                    <span className="ml-2 text-[10px] font-normal text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">任意</span>
                  </label>
                  <textarea value={form.appealText}
                    onChange={e => setForm(f => ({ ...f, appealText: e.target.value }))}
                    placeholder="例：毎朝の一杯が変わる。本格派のコク深い味わい。（空白の場合はテキストなしバナーになります）"
                    rows={3}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all resize-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">空欄にするとテキスト非表示のバナーになります</p>
                </div>

                {/* concept mode: 商品画像（任意） */}
                {mode !== 'product' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      商品画像
                      <span className="ml-2 text-[10px] font-normal text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">任意</span>
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all relative overflow-hidden"
                      style={{ borderColor: productImageDataUrl ? '#fca5a5' : '#e2e8f0', background: productImageDataUrl ? (productImageCutoutUrl ? 'repeating-conic-gradient(#e5e7eb 0% 25%, white 0% 50%) 0 0 / 16px 16px' : '#fff1f2') : 'white' }}>
                      {productImageDataUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={productImageCutoutUrl ?? productImageDataUrl} alt="商品画像プレビュー" className="h-full w-full object-contain p-2" />
                          {isRemovingBg && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                              style={{ background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(3px)' }}>
                              <svg className="w-5 h-5 animate-spin text-red-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              <span className="text-xs font-semibold text-red-600">AI背景除去中{bgRemovalPct > 0 ? ` ${bgRemovalPct}%` : '...'}</span>
                              <span className="text-[10px] text-slate-400">{bgRemovalPct === 0 ? '初回はモデル読込に30秒ほど' : bgRemovalPct < 80 ? '推論中...' : 'もうすぐ完了'}</span>
                            </div>
                          )}
                          {!isRemovingBg && (
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                              <span className="text-white text-xs font-bold bg-black/40 px-3 py-1 rounded-full">変更</span>
                            </div>
                          )}
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
                            setProductImageCutoutUrl(null)
                            setBgRemovalError(false)
                            setBgRemovalPct(0)
                            setIsRemovingBg(true)
                            const bg = await sampleCornerColor(url)
                            setProductBgColor(bg)
                            const cutout = await removeProductBackground(url, pct => setBgRemovalPct(pct))
                            if (cutout) {
                              setProductImageCutoutUrl(cutout)
                            } else {
                              setBgRemovalError(true)
                              setProductImageCutoutUrl(null)
                            }
                            setIsRemovingBg(false)
                          }
                          reader.readAsDataURL(file)
                          e.target.value = ''
                        }} />
                    </label>
                    {productImageDataUrl && (
                      <div className="flex items-center gap-3 mt-1.5">
                        <button onClick={() => { setProductImageDataUrl(null); setProductImageCutoutUrl(null); setIsRemovingBg(false); setBgRemovalError(false); setBgRemovalPct(0) }}
                          className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                          画像を削除
                        </button>
                        {productImageCutoutUrl && !isRemovingBg && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            背景除去済み
                          </span>
                        )}
                        {bgRemovalError && !isRemovingBg && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                            ⚠ 背景除去失敗（元画像で合成）
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                      アップロードすると背景除去後にAI背景と自然合成します
                    </p>
                  </div>
                )}

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
                              ? `0 0 0 2px white, 0 0 0 4px ${c === '#ffffff' ? '#94a3b8' : c}, 0 4px 8px rgba(0,0,0,0.2)`
                              : c === '#ffffff' ? '0 1px 3px rgba(0,0,0,0.12), 0 0 0 1px #e2e8f0' : '0 1px 3px rgba(0,0,0,0.15)',
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

                    {/* 生成パターン数 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">生成パターン数</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([
                          { value: 1 as const, label: '1パターン', desc: '高速・通常' },
                          { value: 2 as const, label: '2パターン', desc: 'A/B比較（2倍の時間）' },
                        ]).map(opt => (
                          <button key={opt.value} onClick={() => setVariations(opt.value)}
                            className={`py-2.5 rounded-xl border text-left px-3 transition-all
                              ${variations === opt.value ? 'border-blue-400 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            style={variations === opt.value ? { background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' } : {}}>
                            <p className="text-xs font-bold">{opt.label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
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
                                  onChange={() => {
                                    setSelectedSizeIdx(idx)
                                    // サイズに合わせてテキスト配置を自動最適化
                                    const r = size.width / size.height
                                    if (r >= 0.84 && r <= 1.19) {
                                      // スクエア → 中央
                                      setOverlay(o => ({ ...o, hAlign: 'center', vAlign: 'bottom' }))
                                    } else if (r >= 5) {
                                      // 超横長 → 左下
                                      setOverlay(o => ({ ...o, hAlign: 'left', vAlign: 'bottom' }))
                                    } else {
                                      // 横長 → 左
                                      setOverlay(o => ({ ...o, hAlign: 'left', vAlign: 'bottom' }))
                                    }
                                  }}
                                  className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-slate-800 truncate">{size.label}</p>
                                  {(() => {
                                    const r = size.width / size.height
                                    if (r >= 5) return <p className="text-[10px] text-amber-500 font-medium">超横長 — 中央帯のみ表示</p>
                                    if (r >= 2.5) return <p className="text-[10px] text-orange-400">横長 — 上下クロップあり</p>
                                    if (r >= 0.84 && r <= 1.19) return <p className="text-[10px] text-blue-400">スクエア — 1:1生成</p>
                                    return null
                                  })()}
                                </div>
                                <div className="rounded flex-shrink-0 border border-slate-200" style={{
                                    background: selectedSizeIdx === idx ? 'linear-gradient(135deg, #bfdbfe, #dbeafe)' : 'linear-gradient(135deg, #e2e8f0, #f1f5f9)',
                                    width: `${Math.round(Math.min(44, (size.width / size.height) * 12))}px`,
                                    height: `${Math.round(Math.min(12, (size.height / size.width) * 44))}px`,
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
            {!isGenerating && generatedImages.length > 0 && (
              <div className="space-y-4">
                {/* 2パターン選択UI */}
                {generatedImages.length > 1 && (
                  <div className="flex gap-3">
                    {generatedImages.map((img, i) => (
                      <button key={img.id} onClick={() => setSelectedImgIdx(i)}
                        className={`flex-1 rounded-xl overflow-hidden border-2 transition-all ${selectedImgIdx === i ? 'border-red-400 shadow-lg shadow-red-100' : 'border-slate-200 opacity-60 hover:opacity-80'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.dataUrl} alt={`パターン${i + 1}`} className="w-full object-cover" style={{ aspectRatio: img.size.aspect, maxHeight: '120px' }} />
                        <div className={`text-center py-1.5 text-xs font-bold ${selectedImgIdx === i ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500'}`}>
                          パターン {String.fromCharCode(65 + i)} {selectedImgIdx === i ? '✓ 選択中' : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* 生成情報ヘッダー */}
                <div className="flex items-center justify-between px-1">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-black tracking-[0.15em] uppercase px-2 py-0.5 rounded-full"
                        style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#065f46' }}>完成</span>
                      <h3 className="text-sm font-bold text-slate-900">{[form.productName, form.productImageDesc].filter(Boolean).join(' / ')}</h3>
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
                    <button onClick={() => { setGeneratedImages([]); handleGenerate() }}
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
                    <div ref={previewContainerRef} className="relative overflow-hidden rounded-xl"
                      style={{ containerType: 'inline-size' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={generatedImage.dataUrl}
                        alt={`生成バナー ${generatedImage.size.label}`}
                        className="w-full object-cover block"
                        style={{ aspectRatio: generatedImage.size.aspect, maxHeight: '420px' }} />

                      {/* 座布団（テキスト背景帯） */}
                      {form.appealText && textBand && (
                        <div className="absolute inset-x-0 pointer-events-none"
                          style={{
                            ...(overlay.vAlign === 'bottom' ? { bottom: 0 } : { top: 0 }),
                            height: '32%',
                            background: overlay.textColor === 'white' ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.88)',
                          }} />
                      )}

                      {/* テキストオーバーレイ */}
                      {form.appealText && (
                        <div className={`absolute inset-0 flex pointer-events-none ${overlayVClass} ${overlayAlignClass}`}>
                          <p className="font-bold leading-snug"
                            style={{
                              margin: '4%', maxWidth: '62%', textAlign: overlay.hAlign,
                              color: overlay.textColor === 'white' ? '#ffffff' : '#111111',
                              textShadow: textShadowCSS,
                              fontFamily: activeFontStyle.cssVar,
                              fontSize: `max(8px, ${TEXT_SIZES.find(s => s.id === overlay.textSizeId)?.cqwPct ?? 3}cqw)`,
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

                      {/* 商品画像なし時のヒント */}
                      {!productImageDataUrl && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium"
                            style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.85)' }}>
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            商品画像をアップロードするとここに合成されます
                          </div>
                        </div>
                      )}

                      {/* 商品画像オーバーレイ（ドラッグ可能） */}
                      {productImageDataUrl && (
                        <>
                          {/* 背景除去なしの場合のみ背景色ゾーンを表示 */}
                          {!productImageCutoutUrl && (
                            <div className="absolute inset-y-0 pointer-events-none"
                              style={{
                                backgroundColor: productBgColor,
                                ...(productImagePos === 'right'
                                  ? { right: 0, width: '50%' }
                                  : productImagePos === 'left'
                                    ? { left: 0, width: '50%' }
                                    : { left: '25%', width: '50%' }),
                              }} />
                          )}
                          {/* 商品画像（ドラッグ移動・スケール対応） */}
                          <div
                            className="absolute select-none"
                            style={{
                              left: `${(productImagePos === 'center' ? 50 : productImagePos === 'right' ? 75 : 25) + productOffsetX * 100}%`,
                              top: `${50 + productOffsetY * 100}%`,
                              transform: `translate(-50%, -50%) scale(${productScale})`,
                              maxWidth: '48%',
                              maxHeight: '92%',
                              cursor: isDraggingProduct.current ? 'grabbing' : 'grab',
                              touchAction: 'none',
                            }}
                            onPointerDown={handleProductPointerDown}
                            onPointerMove={handleProductPointerMove}
                            onPointerUp={handleProductPointerUp}
                            onPointerCancel={handleProductPointerUp}
                            title="ドラッグして移動できます"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={productImageCutoutUrl ?? productImageDataUrl} alt="商品画像" className="max-h-full max-w-full object-contain pointer-events-none block" />
                            {/* ドラッグヒント */}
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap opacity-70"
                              style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                              ドラッグ移動
                            </div>
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

                  {/* ─ 合成コントロールパネル ─ */}
                  <div className="px-6 py-4 border-t border-slate-100 space-y-4"
                    style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">合成コントロール</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 商品画像コントロール */}
                      {productImageDataUrl && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-600">商品画像サイズ</label>
                            <button onClick={resetProductPosition}
                              className="text-[10px] text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg px-2 py-0.5 bg-white transition-colors">
                              位置リセット
                            </button>
                          </div>
                          <input type="range" min="30" max="200" step="5"
                            value={Math.round(productScale * 100)}
                            onChange={e => setProductScale(Number(e.target.value) / 100)}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                            style={{ accentColor: '#dc2626' }} />
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>小さく</span>
                            <span className="font-medium text-slate-600">{Math.round(productScale * 100)}%</span>
                            <span>大きく</span>
                          </div>
                          <p className="text-[10px] text-slate-400">プレビュー上の画像をドラッグして位置調整</p>
                        </div>
                      )}
                      {/* テキスト装飾コントロール */}
                      {form.appealText && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-600 block">テキスト装飾</label>
                          <div className="space-y-2">
                            {/* 座布団 */}
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={textBand} onChange={e => setTextBand(e.target.checked)}
                                className="w-3.5 h-3.5 rounded accent-red-600" />
                              <span className="text-xs text-slate-600">座布団（テキスト背景帯）</span>
                            </label>
                            {/* シャドウ強度 */}
                            <div>
                              <p className="text-[10px] text-slate-500 mb-1">影の強さ</p>
                              <div className="flex gap-1.5">
                                {(['none', 'standard', 'strong'] as const).map(m => (
                                  <button key={m} onClick={() => setTextShadowMode(m)}
                                    className={`flex-1 py-1 text-[10px] font-medium rounded-lg border transition-all
                                      ${textShadowMode === m ? 'border-red-400 text-red-700' : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'}`}
                                    style={textShadowMode === m ? { background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)' } : {}}>
                                    {m === 'none' ? 'なし' : m === 'standard' ? '標準' : '強'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
