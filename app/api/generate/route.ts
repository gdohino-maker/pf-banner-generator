import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const maxDuration = 60

const MODEL = 'imagen-4.0-generate-001'

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
  referenceUrl?: string
  designStyle?: string
  productImageBase64?: string
  productImageMimeType?: string
  productBgColor?: string
}

// ─── デザインスタイル → プロンプト変換 ────────────────────────────────────────
const DESIGN_STYLE_PROMPTS: Record<string, string> = {
  professional:
    'High-end professional commercial photography. Clean minimalist composition. Premium sophisticated materials and refined lighting. Corporate elegance. Muted tones with intentional accent.',
  pop:
    'Vibrant pop art inspired commercial photography. Bold saturated colors. Dynamic energetic composition. Fun playful atmosphere with strong contrast and cheerful energy.',
  cute:
    'Kawaii cute Japanese style photography. Soft pastel palette — cherry blossom pink, mint green, lavender, cream white. Warm cozy atmosphere. Gentle rounded elements. Sweet charming aesthetic.',
  appetizing:
    'Maximum appetite appeal photography. Sizzle effect with visible steam wisps and glistening water droplets. Rich saturated colors evoking freshness and taste. Close-up macro textures showing irresistible food details.',
  stylish:
    'Ultra-modern cool stylish commercial photography. High-contrast dark or pure-white background. Sharp geometric angular composition. Fashion-forward editorial aesthetic. Contemporary luxury magazine quality.',
  natural:
    'Natural organic lifestyle photography. Soft warm natural daylight with gentle bokeh. Earth tones, botanical elements, wooden textures, linen. Clean airy eco-friendly atmosphere.',
}

const DESIGN_STYLE_JA: Record<string, string> = {
  professional: 'プロフェッショナル（高級感・信頼感）',
  pop:          'ポップ（元気・活気・インパクト）',
  cute:         'かわいい（パステル・ほっこり）',
  appetizing:   'おいしそう（シズル感・食欲喚起）',
  stylish:      'スタイリッシュ（クール・モダン）',
  natural:      'ナチュラル（自然・優しい）',
}

// ─── 楽天URLからページデザインヒント取得 ─────────────────────────────────────
async function fetchPageDesignHints(url: string): Promise<string> {
  if (!url?.trim()) return ''
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BannerBot/1.0; +https://banner-app)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en;q=0.9',
      },
      signal: AbortSignal.timeout(7000),
    })
    if (!res.ok) return ''
    const html = await res.text()

    const clean = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()

    const themeColor =
      html.match(/name=["']theme-color["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
      html.match(/content=["']([^"']+)["'][^>]*name=["']theme-color["']/i)?.[1]
    const ogTitle =
      html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<title>([^<]+)<\/title>/i)?.[1]
    const ogDesc =
      html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
      html.match(/name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1]

    const hints: string[] = []
    if (themeColor) hints.push(`reference page accent color: ${themeColor}`)
    if (ogTitle)    hints.push(`reference product title: "${clean(ogTitle).slice(0, 80)}"`)
    if (ogDesc)     hints.push(`reference page context: "${clean(ogDesc).slice(0, 150)}"`)

    return hints.length > 0
      ? `REFERENCE PAGE DESIGN HINTS (from ${url.slice(0, 50)}): ${hints.join('. ')}. Align visual style with this page's design language.`
      : ''
  } catch {
    return ''
  }
}

// ─── Gemini で商品画像を分析してバックグラウンド設計ヒントを取得 ──────────────
async function analyzeProductImage(
  ai: GoogleGenAI,
  base64: string,
  mimeType: string,
): Promise<string> {
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: 'Analyze this product image for commercial banner background design. Answer in English only (max 70 words): 1) Main product colors (2-3 specific colors), 2) Product visual style and mood (2-3 adjectives), 3) What abstract background style, gradient colors, and atmosphere would best showcase this product in a Rakuten commercial banner. Focus on background design, not the product itself.' },
        ],
      }],
    })
    return result.text ?? ''
  } catch {
    return ''
  }
}

// ─── Imagen 4 サポートアスペクト比へのマッピング ─────────────────────────────
function toImagenAspectRatio(width: number, height: number): string {
  const ratio = width / height
  if (ratio >= 1.6) return '16:9'
  if (ratio >= 1.2) return '4:3'
  if (ratio >= 0.84) return '1:1'
  if (ratio >= 0.6) return '3:4'
  return '9:16'
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

// ─── プロンプト構築（Imagen 4用 · 20鉄則組み込み）───────────────────────────
function buildPrompt(input: {
  productName: string
  category: string
  target: string
  catchcopy: string
  color: string
  textPosition?: string
  designStyle?: string
  pageHints?: string
  hasProductImage?: boolean
  productImageAnalysis?: string
  productBgColor?: string
}): string {
  const colorDesc = hexToColorDescription(input.color)
  const categoryStyle = CATEGORY_STYLE[input.category] ?? CATEGORY_STYLE['その他']
  const spaceDesc = textPositionToSpaceDesc(input.textPosition ?? 'bottom-left')
  const stylePrompt = input.designStyle ? DESIGN_STYLE_PROMPTS[input.designStyle] ?? '' : ''

  // 商品画像あり → 背景だけ生成するモード
  if (input.hasProductImage) {
    const productSide = (input.textPosition ?? 'bottom-left').includes('left') ? 'right' : 'left'
    const bgColor = input.productBgColor ?? '#f5f5f5'
    return [
      `COMMERCIAL BANNER BACKGROUND: Create a clean abstract atmospheric background for a "${input.productName}" product banner. The actual product photo is composited separately in post-production. Generate BACKGROUND ENVIRONMENT ONLY — no products, no objects, no merchandise.`,
      `TARGET: "${input.target}".`,
      stylePrompt ? `VISUAL STYLE: ${stylePrompt}` : `ATMOSPHERE: ${categoryStyle}`,
      input.productImageAnalysis ? `COLOR REFERENCE: ${input.productImageAnalysis}` : '',
      input.pageHints ? input.pageHints : '',
      `GRADIENT COMPOSITION: Smooth horizontal gradient — ${productSide === 'right' ? 'left 55%' : 'right 55%'} is ${colorDesc} with soft atmospheric bokeh and gentle light. ${productSide} 45% gradually transitions to the exact color ${bgColor} to seamlessly receive the product composite. Smooth natural fade between zones, zero hard edge.`,
      `VISUAL ELEMENTS: Soft bokeh spheres of light, gentle gradients, subtle atmospheric glow. Abstract and minimal. No faces, no people, no objects of any kind.`,
      `TECHNICAL: 8K resolution, professional studio quality, premium contemporary color grade.`,
      `ABSOLUTE CRITICAL: ZERO TEXT. ZERO TYPOGRAPHY. ZERO CHARACTERS. ZERO NUMBERS. ZERO LETTERS. ZERO JAPANESE CHARACTERS. ZERO WORDS. The image must contain exclusively visual elements — colors, light, gradients, bokeh only. Any typographic element constitutes automatic failure.`,
    ].filter(Boolean).join(' ')
  }

  // 商品画像なし → 従来の商品込み生成
  return [
    `SUBJECT: Highly detailed commercial photograph of "${input.productName}".`,
    `AUDIENCE & MOOD: Designed to appeal to "${input.target}". Visual tone color grading and composition must resonate strongly with this demographic.`,
    stylePrompt ? `DESIGN STYLE — OVERRIDE PRIORITY: ${stylePrompt}` : `CATEGORY STYLE — ${input.category || 'General'}: ${categoryStyle}`,
    input.pageHints ? input.pageHints : '',
    `TECHNICAL: 8K resolution photorealistic sharp focus professional studio lighting. Premium contemporary color grade.`,
    `COLOR THEME: Dominant accent and background color must be ${colorDesc}. Use this color as intentional design element throughout.`,
    `EC RULES (all 20 must be satisfied): ${RAKUTEN_BANNER_RULES.join(' | ')}`,
    `NEGATIVE SPACE — CRITICAL REQUIREMENT: Reserve a clean uncluttered area of exactly 35% of the total frame in the ${spaceDesc}. This area receives Japanese advertising text ("${input.catchcopy}") overlaid in post-production. Must have simple texture only — gradient solid color or soft bokeh. Position ALL visual interest AWAY from this reserved area.`,
  ].filter(Boolean).join(' ')
}

// ─── AI診断レポート生成（日本語 · 提案書用）──────────────────────────────────
function buildReasoning(input: {
  productName: string
  category: string
  target: string
  catchcopy: string
  color: string
  textPosition?: string
  designStyle?: string
  referenceUrl?: string
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
      body: input.designStyle
        ? `デザインスタイル「${DESIGN_STYLE_JA[input.designStyle] ?? input.designStyle}」を最優先に採用。${catReasoning}`
        : catReasoning,
    },
    {
      icon: '📱',
      title: '楽天EC最適化の根拠',
      body: input.referenceUrl
        ? `参照URL（${input.referenceUrl.slice(0, 40)}...）のページデザイン言語を反映し、楽天市場バナー制作20鉄則に準拠した構図を生成。PCとスマートフォンの両方で最大訴求力を発揮し、サムネイル（200×200px）でも商品が明確に認識できる視認性を確保しています。`
        : `楽天市場バナー制作20鉄則に準拠した高コントラスト・モバイルファースト構図を採用。PCとスマートフォンの両方で最大訴求力を発揮し、サムネイル（200×200px）でも商品が明確に認識できる視認性を確保しています。`,
    },
  ]
}

// ─── POST ハンドラー ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_api_key_here') {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY が設定されていません。.env.local または Vercel の環境変数を確認してください。' },
      { status: 503 }
    )
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'リクエストの形式が不正です' }, { status: 400 })
  }

  const { productName, category, target, catchcopy, color, size, textPosition, referenceUrl, designStyle, productImageBase64, productImageMimeType, productBgColor } = body

  if (!productName?.trim() || !target?.trim() || !catchcopy?.trim()) {
    return NextResponse.json({ error: '商品名・ターゲット・訴求テキストは必須です' }, { status: 400 })
  }

  const ai = new GoogleGenAI({ apiKey })
  const hasProductImage = !!(productImageBase64 && productImageMimeType)

  const [pageHints, productImageAnalysis] = await Promise.all([
    fetchPageDesignHints(referenceUrl ?? ''),
    hasProductImage ? analyzeProductImage(ai, productImageBase64!, productImageMimeType!) : Promise.resolve(''),
  ])

  const prompt = buildPrompt({ productName, category, target, catchcopy, color, textPosition, designStyle, pageHints, hasProductImage, productImageAnalysis, productBgColor })
  const reasoning = buildReasoning({ productName, category, target, catchcopy, color, textPosition, designStyle, referenceUrl })
  const aspectRatio = toImagenAspectRatio(size.width, size.height)

  try {
    const response = await ai.models.generateImages({
      model: MODEL,
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio,
        outputMimeType: 'image/jpeg',
      },
    })

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes
    if (!imageBytes) {
      return NextResponse.json(
        { error: '画像が生成されませんでした。コンテンツポリシーに抵触した可能性があります。' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      imageDataUrl: `data:image/jpeg;base64,${imageBytes}`,
      usedAspectRatio: aspectRatio,
      imageSource: 'imagen4',
      prompt,
      reasoning,
    })
  } catch (err) {
    console.error('[generate] Imagen 4 error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Imagen 4 エラー: ${msg}` }, { status: 502 })
  }
}
