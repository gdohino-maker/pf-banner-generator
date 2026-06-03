'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'

// ─── 定数 ─────────────────────────────────────────────────────────────────────
const BANNER_SIZES = [
  { id: '960x170', label: 'PC横長 (960×170)',   width: 960,  height: 170 },
  { id: '960x400', label: 'PC特集 (960×400)',   width: 960,  height: 400 },
  { id: '750x250', label: 'SPバナー (750×250)', width: 750,  height: 250 },
  { id: '640x200', label: 'SP幅広 (640×200)',   width: 640,  height: 200 },
]

const TEMPLATES = [
  { id: 'standard',  label: '楽天スタンダード', sub: '赤×金',        bg1: '#BF0000', bg2: '#8B0000', accent: '#FFD700', cta1: '#FFD700', cta2: '#E6AC00', ctaText: '#111111' },
  { id: 'energetic', label: 'お得感オレンジ',   sub: 'オレンジ×白',  bg1: '#E65100', bg2: '#BF360C', accent: '#FFE082', cta1: '#FFE082', cta2: '#FFC107', ctaText: '#111111' },
  { id: 'premium',   label: 'プレミアム',       sub: 'ダーク×ティール', bg1: '#1a1a2e', bg2: '#0d0d1a', accent: '#4ECDC4', cta1: '#4ECDC4', cta2: '#26A69A', ctaText: '#FFFFFF' },
]

const COUPON_TYPES = [
  { id: 'amount',  label: '金額OFF',  prefix: '¥', suffix: ' OFF' },
  { id: 'percent', label: '%OFF',     prefix: '',   suffix: '% OFF' },
  { id: 'free',    label: '送料無料', prefix: '',   suffix: '' },
  { id: 'custom',  label: 'カスタム', prefix: '',   suffix: '' },
]

// ─── Canvas描画ユーティリティ ─────────────────────────────────────────────────
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function waitForFonts(families: string[], size: number): Promise<void> {
  return Promise.all(families.map(f =>
    document.fonts.load(`900 ${size}px "${f}"`)
  )).then(() => {})
}

// ─── 横長バナー（960×170, 750×250, 640×200）レンダラー ─────────────────────
async function renderHorizontal(
  canvas: HTMLCanvasElement,
  form: FormState,
  tpl: typeof TEMPLATES[0],
  size: typeof BANNER_SIZES[0],
) {
  const { width: W, height: H } = size
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)

  await waitForFonts(['Noto Sans JP'], H * 0.5)

  // 背景グラジエント
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, tpl.bg1)
  bg.addColorStop(1, tpl.bg2)
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  // サブテクスチャ（斜めストライプ）
  ctx.save(); ctx.globalAlpha = 0.04
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 28
  for (let x = -H * 2; x < W + H; x += 56) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H * 2, H); ctx.stroke()
  }
  ctx.restore()

  const pad = Math.round(W * 0.018)
  const h2 = H / 2

  // ─── レイアウト分割 ─────────────────────────────────────────────────────────
  // [ラベル 20%] [金額 34%] [期限 20%] [CTA 26%]
  const s1 = Math.round(W * 0.20)
  const s2 = Math.round(W * 0.34)
  const s3 = Math.round(W * 0.20)
  const s4 = W - s1 - s2 - s3

  // ─── セクション1: クーポンラベル ─────────────────────────────────────────────
  const boxH = Math.round(H * 0.72)
  const boxW = s1 - pad * 2
  const bx = pad, by = (H - boxH) / 2, br = Math.round(boxH * 0.13)
  ctx.save()
  rrect(ctx, bx, by, boxW, boxH, br)
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.restore()

  const lf1 = Math.round(H * 0.17), lf2 = Math.round(H * 0.27)
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = tpl.accent
  ctx.font = `900 ${lf1}px "Noto Sans JP", sans-serif`
  ctx.fillText('クーポン', bx + boxW / 2, by + boxH * 0.33)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `900 ${lf2}px "Noto Sans JP", sans-serif`
  ctx.fillText('使えます', bx + boxW / 2, by + boxH * 0.70)

  let cx = s1

  // ─── セクション2: 金額/テキスト ──────────────────────────────────────────────
  const couponText = getCouponDisplayText(form)
  const cf = Math.round(H * (couponText.length > 8 ? 0.36 : 0.46))
  ctx.fillStyle = tpl.accent
  ctx.font = `900 ${cf}px "Noto Sans JP", sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2
  ctx.fillText(couponText, cx + s2 / 2, h2 * (form.campaignName ? 0.88 : 1), s2 - pad)
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0

  if (form.campaignName) {
    const nmF = Math.round(H * 0.14)
    ctx.fillStyle = 'rgba(255,255,255,0.80)'
    ctx.font = `700 ${nmF}px "Noto Sans JP", sans-serif`
    ctx.fillText(form.campaignName, cx + s2 / 2, h2 + cf * 0.56, s2 - pad)
  }
  cx += s2

  // ─── セクション3: 期限 ───────────────────────────────────────────────────────
  const expLines = getExpiryLines(form)
  if (expLines.length) {
    const ef1 = Math.round(H * 0.13), ef2 = Math.round(H * 0.18)
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.font = `600 ${ef1}px "Noto Sans JP", sans-serif`
    ctx.fillText('期限', cx + s3 / 2, h2 - ef2 * 0.75)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `800 ${ef2}px "Noto Sans JP", sans-serif`
    expLines.forEach((line, i) => {
      ctx.fillText(line, cx + s3 / 2, h2 + i * ef2 * 1.1 + ef2 * 0.1, s3 - pad)
    })
  }
  cx += s3

  // ─── セクション4: CTAボタン ──────────────────────────────────────────────────
  const btnPad = Math.round(pad * 1.2)
  const btnW = s4 - btnPad * 2
  const btnH = Math.round(H * 0.58)
  const btnX = cx + btnPad
  const btnY = (H - btnH) / 2
  const btnR = Math.round(btnH * 0.3)

  const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH)
  btnGrad.addColorStop(0, tpl.cta1)
  btnGrad.addColorStop(1, tpl.cta2)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4
  rrect(ctx, btnX, btnY, btnW, btnH, btnR)
  ctx.fillStyle = btnGrad; ctx.fill()
  ctx.restore()

  const ctaLabel = form.ctaText || 'クーポンをGET >'
  const ctaF = Math.round(H * (ctaLabel.length > 10 ? 0.16 : 0.19))
  ctx.fillStyle = tpl.ctaText
  ctx.font = `900 ${ctaF}px "Noto Sans JP", sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(ctaLabel, btnX + btnW / 2, btnY + btnH / 2, btnW - pad)
}

// ─── 縦長/正方形バナー（960×400）レンダラー ────────────────────────────────
async function renderTall(
  canvas: HTMLCanvasElement,
  form: FormState,
  tpl: typeof TEMPLATES[0],
  size: typeof BANNER_SIZES[0],
) {
  const { width: W, height: H } = size
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)

  await waitForFonts(['Noto Sans JP'], H * 0.2)

  // 背景
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, tpl.bg1); bg.addColorStop(1, tpl.bg2)
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  // パターン
  ctx.save(); ctx.globalAlpha = 0.04
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 40
  for (let x = -H; x < W + H; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke()
  }
  ctx.restore()

  const pad = Math.round(W * 0.05)
  const cX = W / 2

  // クーポンバッジ（上部）
  const badgeH = Math.round(H * 0.15)
  const badgeW = Math.round(W * 0.45)
  const badgeY = Math.round(H * 0.08)
  ctx.save()
  rrect(ctx, (W - badgeW) / 2, badgeY, badgeW, badgeH, badgeH / 2)
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.restore()
  ctx.fillStyle = tpl.accent
  ctx.font = `900 ${Math.round(badgeH * 0.55)}px "Noto Sans JP", sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('クーポン使えます', cX, badgeY + badgeH / 2)

  // 金額（大きく中央）
  const couponText = getCouponDisplayText(form)
  const cf = Math.round(H * (couponText.length > 8 ? 0.22 : 0.28))
  ctx.fillStyle = tpl.accent
  ctx.font = `900 ${cf}px "Noto Sans JP", sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3
  ctx.fillText(couponText, cX, H * 0.45, W - pad * 2)
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0

  // キャンペーン名
  if (form.campaignName) {
    ctx.fillStyle = 'rgba(255,255,255,0.80)'
    ctx.font = `700 ${Math.round(H * 0.08)}px "Noto Sans JP", sans-serif`
    ctx.fillText(form.campaignName, cX, H * 0.60, W - pad * 2)
  }

  // 期限
  const expLines = getExpiryLines(form)
  if (expLines.length) {
    const ef = Math.round(H * 0.07)
    ctx.fillStyle = 'rgba(255,255,255,0.70)'
    ctx.font = `600 ${ef}px "Noto Sans JP", sans-serif`
    ctx.fillText('期限：' + expLines.join(' '), cX, H * (form.campaignName ? 0.70 : 0.62), W - pad * 2)
  }

  // CTAボタン（下部）
  const btnW = Math.round(W * 0.55)
  const btnH = Math.round(H * 0.13)
  const btnX = (W - btnW) / 2
  const btnY = H * 0.80
  const btnR = btnH / 2
  const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH)
  btnGrad.addColorStop(0, tpl.cta1); btnGrad.addColorStop(1, tpl.cta2)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4
  rrect(ctx, btnX, btnY, btnW, btnH, btnR)
  ctx.fillStyle = btnGrad; ctx.fill()
  ctx.restore()
  ctx.fillStyle = tpl.ctaText
  ctx.font = `900 ${Math.round(btnH * 0.5)}px "Noto Sans JP", sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(form.ctaText || 'クーポンをGET →', W / 2, btnY + btnH / 2, btnW - 20)
}

// ─── ヘルパー ─────────────────────────────────────────────────────────────────
type FormState = {
  couponType: string; couponValue: string; customLabel: string
  campaignName: string; expiryDate: string; expiryTime: string
  ctaText: string; template: string; sizeId: string
}

function getCouponDisplayText(form: FormState): string {
  const tType = COUPON_TYPES.find(t => t.id === form.couponType)
  if (form.couponType === 'free') return '送料無料'
  if (form.couponType === 'custom') return form.customLabel || 'お得'
  const val = form.couponValue || '0'
  if (form.couponType === 'amount') return `¥${Number(val).toLocaleString()} OFF`
  return `${val}% OFF`
}

function getExpiryLines(form: FormState): string[] {
  if (!form.expiryDate && !form.expiryTime) return []
  const lines: string[] = []
  if (form.expiryDate) {
    const d = new Date(form.expiryDate)
    const month = d.getMonth() + 1, day = d.getDate()
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const wd = weekdays[d.getDay()]
    lines.push(`${month}/${day}(${wd})`)
  }
  if (form.expiryTime) lines.push(`${form.expiryTime}まで`)
  else if (lines.length) lines.push('まで')
  return lines
}

async function renderCanvas(canvas: HTMLCanvasElement, form: FormState) {
  const size = BANNER_SIZES.find(s => s.id === form.sizeId) ?? BANNER_SIZES[0]
  const tpl  = TEMPLATES.find(t => t.id === form.template) ?? TEMPLATES[0]
  await document.fonts.ready
  if (size.height >= 350) await renderTall(canvas, form, tpl, size)
  else                    await renderHorizontal(canvas, form, tpl, size)
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────
export default function EventGeneratorPage() {
  const [form, setForm] = useState<FormState>({
    couponType: 'amount', couponValue: '1000', customLabel: '',
    campaignName: '', expiryDate: '', expiryTime: '23:59',
    ctaText: 'クーポンをGET >', template: 'standard', sizeId: '960x170',
  })
  const [isDownloading, setIsDownloading] = useState(false)
  const previewRef = useRef<HTMLCanvasElement>(null)

  const redraw = useCallback(async () => {
    if (!previewRef.current) return
    await renderCanvas(previewRef.current, form)
  }, [form])

  useEffect(() => { redraw() }, [redraw])

  const setField = (key: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const canvas = document.createElement('canvas')
      await renderCanvas(canvas, form)
      canvas.toBlob(blob => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const size = BANNER_SIZES.find(s => s.id === form.sizeId)!
        a.href = url; a.download = `coupon_${size.width}x${size.height}.png`
        a.click(); URL.revokeObjectURL(url)
      }, 'image/png')
    } finally { setIsDownloading(false) }
  }

  const currentSize = BANNER_SIZES.find(s => s.id === form.sizeId) ?? BANNER_SIZES[0]
  const aspectStr = `${currentSize.width} / ${currentSize.height}`

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-xs font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ポータルへ
          </Link>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-black"
              style={{ background: 'linear-gradient(135deg, #E65100, #BF0000)' }}>A</div>
            <span className="text-sm font-bold text-slate-900">クーポン・イベント生成</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">AIなし・即時</span>
          </div>
        </div>
      </header>

      {/* メイン（2カラム） */}
      <main className="flex-1 flex flex-col lg:flex-row gap-0 max-w-7xl mx-auto w-full">

        {/* ─── 左：フォーム ─────────────────────────────────────────────────── */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 border-r border-slate-100 bg-white overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* クーポン種別 */}
            <section>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">クーポン種別</label>
              <div className="grid grid-cols-2 gap-1.5">
                {COUPON_TYPES.map(ct => (
                  <button key={ct.id}
                    onClick={() => setField('couponType', ct.id)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all active:scale-95
                      ${form.couponType === ct.id
                        ? 'border-orange-400 text-orange-700 shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    style={form.couponType === ct.id ? { background: 'linear-gradient(135deg, #fff7ed, #ffedd5)' } : {}}>
                    {ct.label}
                  </button>
                ))}
              </div>

              {/* 金額/% */}
              {(form.couponType === 'amount' || form.couponType === 'percent') && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {form.couponType === 'amount' ? '金額（円）' : '割引率（%）'}
                  </label>
                  <input type="number" min="1" value={form.couponValue}
                    onChange={e => setField('couponValue', e.target.value)}
                    className="w-full px-4 py-3 text-xl font-black rounded-xl border border-slate-200 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                    placeholder={form.couponType === 'amount' ? '1000' : '20'} />
                </div>
              )}
              {form.couponType === 'custom' && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">表示テキスト</label>
                  <input type="text" value={form.customLabel}
                    onChange={e => setField('customLabel', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                    placeholder="例：ポイント10倍" />
                </div>
              )}
            </section>

            {/* キャンペーン名 */}
            <section>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                キャンペーン名 <span className="normal-case font-normal text-slate-400">（任意）</span>
              </label>
              <input type="text" value={form.campaignName}
                onChange={e => setField('campaignName', e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                placeholder="例：父の日セール" />
            </section>

            {/* 期限 */}
            <section>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                期限 <span className="normal-case font-normal text-slate-400">（任意）</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={form.expiryDate}
                  onChange={e => setField('expiryDate', e.target.value)}
                  className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" />
                <input type="time" value={form.expiryTime}
                  onChange={e => setField('expiryTime', e.target.value)}
                  className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" />
              </div>
            </section>

            {/* CTAテキスト */}
            <section>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">CTAボタンのテキスト</label>
              <input type="text" value={form.ctaText}
                onChange={e => setField('ctaText', e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                placeholder="クーポンをGET >" />
            </section>

            {/* テンプレート */}
            <section>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">デザインテンプレート</label>
              <div className="space-y-2">
                {TEMPLATES.map(tpl => (
                  <button key={tpl.id}
                    onClick={() => setField('template', tpl.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98]
                      ${form.template === tpl.id ? 'border-orange-400 shadow-md' : 'border-slate-200 hover:bg-slate-50'}`}
                    style={form.template === tpl.id ? { background: 'linear-gradient(135deg, #fff7ed, #ffedd5)' } : {}}>
                    <div className="w-10 h-7 rounded-lg flex-shrink-0 shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${tpl.bg1}, ${tpl.bg2})` }} />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">{tpl.label}</p>
                      <p className="text-[10px] text-slate-400">{tpl.sub}</p>
                    </div>
                    {form.template === tpl.id && (
                      <svg className="w-4 h-4 text-orange-500 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* バナーサイズ */}
            <section>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">出力サイズ</label>
              <div className="space-y-1.5">
                {BANNER_SIZES.map(size => (
                  <label key={size.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all
                      ${form.sizeId === size.id ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="size" checked={form.sizeId === size.id}
                      onChange={() => setField('sizeId', size.id)}
                      className="accent-orange-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-700">{size.label}</span>
                    <div className="ml-auto rounded border border-slate-200 bg-slate-100"
                      style={{ width: `${Math.round(Math.min(36, size.width / size.height * 12))}px`, height: '12px' }} />
                  </label>
                ))}
              </div>
            </section>

            {/* DLボタン */}
            <button onClick={handleDownload} disabled={isDownloading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 shadow-lg disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #E65100, #BF0000)' }}>
              {isDownloading ? '出力中...' : 'PNG でダウンロード'}
            </button>
          </div>
        </div>

        {/* ─── 右：プレビュー ───────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-start p-8 bg-slate-50 min-h-0">
          <div className="w-full max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">プレビュー</p>
              <p className="text-xs text-slate-400">{currentSize.width}×{currentSize.height}px</p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
              <canvas ref={previewRef}
                className="w-full block"
                style={{ aspectRatio: aspectStr }} />
            </div>
            <p className="text-center text-[11px] text-slate-400 mt-3">
              入力内容が即座にプレビューに反映されます。右クリックで画像保存も可能。
            </p>

            {/* クイック変更ボタン */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {TEMPLATES.map(tpl => (
                <button key={tpl.id}
                  onClick={() => setField('template', tpl.id)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95
                    ${form.template === tpl.id ? 'text-white shadow-md' : 'border-slate-200 text-slate-600 bg-white hover:shadow-sm'}`}
                  style={form.template === tpl.id ? { background: `linear-gradient(135deg, ${tpl.bg1}, ${tpl.bg2})` } : {}}>
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
