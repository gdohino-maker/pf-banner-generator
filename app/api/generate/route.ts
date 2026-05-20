import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt'

// ─── 型定義 ───────────────────────────────────────────────────────────────────
export type ReasoningPoint = { icon: string; title: string; body: string }

type RequestBody = {
  productName: string
  category: string
  target: string
  catchcopy: string
  color: string
  size: { label: string; width: number; height: number }
  textPosition?: string
}

// ─── Hex → 自然言語カラー名（英語プロンプト用）────────────────────────────────
function hexToColorDescription(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  if (r > 180 && g < 80  && b < 80)  return 'deep vivid red (Rakuten crimson — #BF0000 range)'
  if (r < 60  && g < 80  && b > 160) return 'deep navy blue'
  if (r < 80  && g < 100 && b > 160) return 'rich royal blue'
  if (r < 80  && g > 140 && b < 100) return 'vibrant forest green'
  if (r > 200 && g > 160 && b < 80)  return 'warm golden yellow'
  if (r > 200 && g > 100 && b < 80)  return 'energetic warm orange'
  if (r > 80  && g < 80  && b > 140) return 'deep regal purple'
  if (r < 60  && g < 60  && b < 60)  return 'dark charcoal black'
  if (r > 220 && g > 220 && b > 220) return 'clean bright white'
  return `the color ${hex}`
}

// ─── Hex → カラー心理（日本語 · 根拠レポート用）──────────────────────────────
function hexToColorPsychology(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  if (r > 180 && g < 80  && b < 80)  return '緊急性・情熱・楽天ブランドとの高親和性を演出'
  if (r < 60  && g < 80  && b > 160) return '信頼感・誠実さ・プロフェッショナリズムを演出'
  if (r < 80  && g < 100 && b > 160) return '信頼感・爽やかさ・安定感を演出'
  if (r < 80  && g > 140 && b < 100) return '新鮮さ・健康・自然との親和性を演出'
  if (r > 200 && g > 160 && b < 80)  return '高級感・注目度・温かみを演出'
  if (r > 200 && g > 100 && b < 80)  return 'エネルギー・活気・即購買衝動を刺激'
  if (r > 80  && g < 80  && b > 140) return '高級感・神秘性・プレミアム感を演出'
  if (r < 60  && g < 60  && b < 60)  return 'プレミアム・洗練・高級感を演出'
  if (r > 220 && g > 220 && b > 220) return '清潔感・シンプル・どんな商材にも合わせやすい'
  return 'ブランドカラーとの統一感を演出'
}

// ─── カテゴリ別撮影スタイル（英語プロンプト）────────────────────────────────
const CATEGORY_STYLE: Record<string, string> = {
  '食品・飲料':
    'Professional food photography sizzle: visible steam wisps, glistening water droplets, rich saturated colors evoking taste. Macro details showing texture. Soft-box studio lighting with highlights enhancing sheen and freshness. Food must look irresistibly appetizing.',
  '美容・コスメ':
    'Luxury beauty product photography: clean pearl, frosted glass, or smooth marble background. Soft butterfly lighting with glow effect. Sophisticated and glamorous. Subtle reflections beneath product. Premium spa boutique atmosphere.',
  'ファッション':
    'Editorial fashion photography: crisp clean studio backdrop or curated lifestyle flat-lay. Premium boutique aesthetic. Sharp fabric texture. Fashion magazine quality with precise composition.',
  '家電・PC':
    'Sleek technology product photography: dark reflective surface or pure white background. Sharp geometric product angles. Minimalist modern tech aesthetic. Specular highlights showing premium build quality. Apple/Sony photography style.',
  'スポーツ・アウトドア':
    'Dynamic sports lifestyle photography: energetic outdoor or gym environment with natural or dramatic studio lighting. High contrast, bold colors. Motion-inspired composition suggesting energy and performance.',
  'インテリア・家具':
    'Interior lifestyle staging: warm ambient lighting with soft natural shadows. Scandinavian minimalist or Japanese wabi-sabi aesthetic. Natural materials — wood grain, linen, ceramics. Cozy aspirational home setting.',
  'ベビー・マタニティ':
    'Soft and gentle product photography: pastel palette (mint green, blush pink, ivory cream). Diffused soft natural window light. Clean white or neutral background. Safe, nurturing atmosphere. Delicate minimalist styling.',
  'その他':
    'Clean premium commercial photography: crisp studio lighting, professional product presentation, high contrast between product and background.',
}

// ─── カテゴリ別設計根拠（日本語 · 根拠レポート用）────────────────────────────
const CATEGORY_REASONING: Record<string, string> = {
  '食品・飲料':
    'シズル感最大化のため水蒸気・水滴・光沢演出を指示。「食べたい」感情を直接喚起する食欲刺激型撮影スタイルを採用。購買転換率が最も高い訴求軸です。',
  '美容・コスメ':
    '高級ビューティ撮影（パール・マーブル背景＋蝶形ライティング）で清潔感と高級感を両立。ターゲットの「なりたい自分」への共鳴を最大化するビジュアル設計です。',
  'ファッション':
    '編集部クォリティの撮影スタイルで素材の質感を最大訴求。プレミアム感でブランド価値を可視化し、価格への抵抗感を低減する効果があります。',
  '家電・PC':
    'Apple/ソニー級プロダクト撮影（幾何学的アングル＋高コントラスト）でスペックより「所有欲」を刺激。プロダクトデザインの美しさを前面に出す戦略です。',
  'スポーツ・アウトドア':
    'ダイナミック構図と高コントラストで「使ってみたい」運動意欲を刺激。エネルギー感と機能性を同時訴求し、アクティブ層の購買行動を促進します。',
  'インテリア・家具':
    'スカンジナビアミニマリズムまたは和のわびさびで「部屋に置きたい」生活欲求を喚起。憧れのライフスタイルの可視化が最大の差別化ポイントです。',
  'ベビー・マタニティ':
    'パステルカラー＋柔らかい自然光で安心感と優しさを最大表現。親の「我が子に与えたい」保護本能へのアプローチが購買の主要ドライバーです。',
  'その他':
    'ユニバーサル商業撮影スタイルで清潔感・視認性・プロフェッショナリズムを最優先に設計。汎用性が高く、複数商材への展開にも対応できます。',
}

// ─── テキスト配置 → ネガティブスペース記述（英語）────────────────────────────
function textPositionToSpaceDesc(pos: string): string {
  const map: Record<string, string> = {
    'bottom-left':   'lower-left quadrant (bottom 40% and left 50% of the frame)',
    'bottom-center': 'bottom third of the frame (full width)',
    'bottom-right':  'lower-right quadrant (bottom 40% and right 50% of the frame)',
    'top-left':      'upper-left quadrant (top 40% and left 50% of the frame)',
    'top-center':    'top third of the frame (full width)',
    'top-right':     'upper-right quadrant (top 40% and right 50% of the frame)',
  }
  return map[pos] ?? 'lower-left or left side of the frame'
}

// ─── Flux専用：カテゴリ別ビジュアルスタイル（短く・英語・視覚優先）────────────
const FLUX_CATEGORY_STYLE: Record<string, string> = {
  '食品・飲料': 'food photography, steam rising, glistening droplets, rich texture, dark moody studio lighting, macro detail, sizzle effect, appetizing, bokeh background',
  '美容・コスメ': 'luxury beauty product photography, white marble surface, soft butterfly lighting, elegant glow, minimal clean background, premium',
  'ファッション': 'editorial fashion photography, crisp white studio backdrop, sharp fabric texture, boutique aesthetic, magazine quality',
  '家電・PC': 'technology product photography, dark reflective surface, geometric angles, specular highlights, minimalist modern, sleek',
  'スポーツ・アウトドア': 'sports product photography, high contrast bold colors, energetic dynamic composition, outdoor lifestyle, action',
  'インテリア・家具': 'interior design photography, warm ambient lighting, scandinavian minimalist, natural wood grain, cozy lifestyle',
  'ベビー・マタニティ': 'baby product photography, soft pastel colors, gentle diffused light, clean white background, nurturing safe',
  'その他': 'commercial product photography, crisp studio lighting, clean background, professional presentation',
}

// カテゴリの英語アンカー（Fluxが日本語商品名を認識できない場合の補完）
const FLUX_CATEGORY_EN: Record<string, string> = {
  '食品・飲料': 'food and beverage',
  '美容・コスメ': 'beauty cosmetics product',
  'ファッション': 'fashion apparel clothing',
  '家電・PC': 'electronics technology device',
  'スポーツ・アウトドア': 'sports outdoor equipment',
  'インテリア・家具': 'interior furniture home decor',
  'ベビー・マタニティ': 'baby maternity product',
  'その他': 'retail product',
}

// ─── Flux最適化プロンプト（Pollinations.ai専用）───────────────────────────────
// Fluxは「商品名を先頭・短く・英語の視覚語を多用」するプロンプトが最も効く
function buildFluxPrompt(input: {
  productName: string
  category: string
  target: string
  color: string
  textPosition?: string
}): string {
  const colorDesc = hexToColorDescription(input.color)
  const catStyle = FLUX_CATEGORY_STYLE[input.category] ?? FLUX_CATEGORY_STYLE['その他']
  const catEn = FLUX_CATEGORY_EN[input.category] ?? 'product'

  // 商品を配置すべきエリアと空けるエリアを簡潔に指示
  const spaceMap: Record<string, string> = {
    'bottom-left':   'subject positioned in right-center area, large empty clean space on lower-left third',
    'bottom-center': 'subject positioned in upper-center, large empty clean space at the bottom',
    'bottom-right':  'subject positioned in left-center area, large empty clean space on lower-right third',
    'top-left':      'subject positioned in right-center area, empty clean space on upper-left',
    'top-center':    'subject positioned in lower-center, empty clean space at the top',
    'top-right':     'subject positioned in left-center area, empty clean space on upper-right',
  }
  const spaceInstr = spaceMap[input.textPosition ?? 'bottom-left']

  return [
    // 先頭に商品名＋英語カテゴリアンカー（Fluxは先頭トークンを最も重視）
    `${input.productName}, ${catEn}`,
    catStyle,
    `${colorDesc} dominant color scheme`,
    spaceInstr,
    'highly detailed sharp focus',
    'no text no watermarks no logos no letters no numbers',
    'photorealistic 8k commercial photography',
  ].join(', ')
}

// ─── 楽天EC バナー制作 20の鉄則 ──────────────────────────────────────────────
const RAKUTEN_BANNER_RULES = [
  'Main product clearly visible and occupying at least 55% of the frame',
  'Rule-of-thirds composition with product slightly off-center for dynamic tension',
  'Reserve 35% clean negative space in the designated text overlay zone',
  'Strong single focal point with no visual ambiguity about the product',
  'High visual contrast between product and background (minimum 4.5:1)',
  'Accent color used as intentional design element throughout composition',
  'Background must be simple: solid color smooth gradient or soft bokeh only',
  'No busy complex background patterns competing with the product',
  'Studio-quality lighting with soft shadows creating depth and dimension',
  'Specular highlights on product surface suggesting premium material quality',
  'Sharp product focus with naturally blurred background when applicable',
  'Photorealistic 8K resolution quality — not illustration or 3D render style',
  'Product readable and recognizable at 200x200px thumbnail size for mobile',
  'Mobile-first composition with key visual elements visible on narrow screens',
  'Contemporary color grading — not retro vintage or heavily filtered',
  'Professional trustworthy appearance matching Rakuten Ichiba standards',
  'Visual tone and color temperature tuned to the target demographic',
  'Emotional resonance with target audience primary desire or aspiration',
  'ABSOLUTE: No text letters numbers price tags logos or watermarks anywhere',
  'ABSOLUTE: No promotional badges sale stickers or AI-generated overlay graphics',
]

// ─── プロンプト構築（20鉄則組み込み）─────────────────────────────────────────
function buildPrompt(input: {
  productName: string
  category: string
  target: string
  catchcopy: string
  color: string
  textPosition?: string
}): string {
  const colorDesc = hexToColorDescription(input.color)
  const categoryStyle = CATEGORY_STYLE[input.category] ?? CATEGORY_STYLE['その他']
  const spaceDesc = textPositionToSpaceDesc(input.textPosition ?? 'bottom-left')

  return [
    `SUBJECT: Highly detailed commercial photograph of "${input.productName}".`,
    `AUDIENCE & MOOD: Designed to appeal to "${input.target}". Visual tone color grading and composition must resonate strongly with this demographic.`,
    `CATEGORY STYLE — ${input.category || 'General'}: ${categoryStyle}`,
    `TECHNICAL: 8K resolution photorealistic sharp focus professional studio lighting. Premium contemporary color grade.`,
    `COLOR THEME: Dominant accent and background color must be ${colorDesc}. Use this color as intentional design element throughout.`,
    `EC RULES (all 20 must be satisfied): ${RAKUTEN_BANNER_RULES.join(' | ')}`,
    `NEGATIVE SPACE — CRITICAL REQUIREMENT: Reserve a clean uncluttered area of exactly 35% of the total frame in the ${spaceDesc}. This area receives Japanese advertising text ("${input.catchcopy}") overlaid in post-production. Must have simple texture only — gradient solid color or soft bokeh. Position ALL visual interest AWAY from this reserved area.`,
  ].join(' ')
}

// ─── AI診断レポート生成（日本語 · 提案書用）──────────────────────────────────
function buildReasoning(input: {
  productName: string
  category: string
  target: string
  catchcopy: string
  color: string
  textPosition?: string
}): ReasoningPoint[] {
  const colorDesc = hexToColorDescription(input.color)
  const colorPsych = hexToColorPsychology(input.color)
  const catReasoning = CATEGORY_REASONING[input.category] ?? CATEGORY_REASONING['その他']
  const pos = input.textPosition ?? 'bottom-left'

  const productAreaMap: Record<string, string> = {
    'bottom-left': '右上〜中央', 'bottom-center': '上部中央', 'bottom-right': '左上〜中央',
    'top-left': '右下〜中央', 'top-center': '下部中央', 'top-right': '左下〜中央',
  }
  const textAreaMap: Record<string, string> = {
    'bottom-left': '左下', 'bottom-center': '下部中央', 'bottom-right': '右下',
    'top-left': '左上', 'top-center': '上部中央', 'top-right': '右上',
  }

  return [
    {
      icon: '🎯',
      title: '構図設計の根拠',
      body: `商品「${input.productName}」を画面${productAreaMap[pos] ?? '中央'}に配置し、${textAreaMap[pos] ?? '左下'}にキャッチコピー「${input.catchcopy}」用の35%ネガティブスペースを確保。楽天スマートフォン閲覧時に商品とテキストが干渉しない視線誘導を設計。視認性の黄金比に基づく構図です。`,
    },
    {
      icon: '🎨',
      title: 'カラー戦略の根拠',
      body: `${colorDesc}（${input.color}）をメインアクセントに採用。この色彩は「${colorPsych}」効果を持ち、ターゲット「${input.target}」の購買心理に直接訴求します。競合商品との差別化にも有効なカラー選定です。`,
    },
    {
      icon: '📸',
      title: 'カテゴリ演出の根拠',
      body: catReasoning,
    },
    {
      icon: '📱',
      title: '楽天EC最適化の根拠',
      body: `楽天市場バナー制作20鉄則に準拠した高コントラスト・モバイルファースト構図を採用。PCとスマートフォンの両方で最大訴求力を発揮し、サムネイル（200×200px）でも商品が明確に認識できる視認性を確保しています。`,
    },
  ]
}

// ─── 画像フェッチ共通処理 ────────────────────────────────────────────────────
async function fetchImageAsBase64(
  url: string,
  timeoutMs = 50_000,
): Promise<{ base64: string; contentType: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`)
  const buf = await res.arrayBuffer()
  return {
    base64: Buffer.from(buf).toString('base64'),
    contentType: res.headers.get('content-type') || 'image/jpeg',
  }
}

// ─── POST ハンドラー ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'リクエストの形式が不正です' }, { status: 400 })
  }

  const { productName, category, target, catchcopy, color, size, textPosition } = body

  if (!productName?.trim() || !target?.trim() || !catchcopy?.trim()) {
    return NextResponse.json({ error: '商品名・ターゲット・訴求テキストは必須です' }, { status: 400 })
  }

  const prompt = buildPrompt({ productName, category, target, catchcopy, color, textPosition })
  const fluxPrompt = buildFluxPrompt({ productName, category, target, color, textPosition })
  const reasoning = buildReasoning({ productName, category, target, catchcopy, color, textPosition })

  const seed = Math.floor(Math.random() * 1_000_000)
  let imageData: { base64: string; contentType: string }
  let imageSource = 'pollinations'

  // ── 1st try: Pollinations.ai（Flux最適化プロンプト）──
  try {
    const pUrl =
      `${POLLINATIONS_BASE}/${encodeURIComponent(fluxPrompt)}` +
      `?width=${size.width}&height=${size.height}&nologo=true&seed=${seed}`
    imageData = await fetchImageAsBase64(pUrl, 45_000)
  } catch (err) {
    // ── fallback: Picsum Photos（確実にダミー画像を返す）──
    console.warn('[generate] Pollinations failed, falling back to Picsum:', err)
    imageSource = 'picsum'
    try {
      const picsumUrl = `https://picsum.photos/${size.width}/${size.height}?random=${seed}`
      imageData = await fetchImageAsBase64(picsumUrl, 15_000)
    } catch (fallbackErr) {
      console.error('[generate] All image sources failed:', fallbackErr)
      return NextResponse.json({ error: '画像の取得に失敗しました。ネットワーク接続を確認してください。' }, { status: 502 })
    }
  }

  return NextResponse.json({
    imageDataUrl: `data:${imageData.contentType};base64,${imageData.base64}`,
    usedAspectRatio: '',
    imageSource,
    prompt,
    reasoning,
  })
}
