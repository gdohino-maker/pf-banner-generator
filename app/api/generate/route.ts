import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const maxDuration = 60

const MODEL = 'imagen-4.0-generate-001'

// ─── 型定義 ───────────────────────────────────────────────────────────────────
export type ReasoningPoint = { icon: string; title: string; body: string }

type RequestBody = {
  productName?: string
  productImageDesc?: string
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
  productFeatures?: string
  saleInfo?: string
  campaignType?: string
  copyTone?: string
  variations?: 1 | 2
}

// ─── デザインスタイル → 背景ムード（物体・商品を描写しない）─────────────────
const DESIGN_STYLE_PROMPTS: Record<string, string> = {
  professional:
    'Refined premium color palette with muted tones and deep shadows. Precise studio lighting with clean soft-box quality. Elegant, restrained, corporate sophistication expressed purely through light and gradient.',
  pop:
    'Vibrant bold saturated color gradient. High-energy contrasting colors — bright primary tones with dynamic bokeh bursts. Fun cheerful electric atmosphere through pure color and light.',
  cute:
    'Soft kawaii pastel gradient — cherry blossom pink, mint green, lavender, cream white. Warm diffused light with gentle rounded bokeh orbs. Sweet charming atmosphere through delicate color transitions.',
  appetizing:
    'Rich warm amber and golden gradient. Saturated warm tones evoking richness and appetite. Soft glowing studio light suggesting warmth and abundance through color temperature and bokeh.',
  stylish:
    'High-contrast dark gradient from deep charcoal to pure white or midnight. Dramatic directional studio light with sharp tonal contrast. Fashion-forward editorial minimalism through light and shadow.',
  natural:
    'Soft warm earthy gradient — warm beige, sage green, natural linen tones. Gentle natural daylight feel with soft bokeh. Organic airy eco-inspired atmosphere through natural color palette.',
}

// ─── キャンペーン種別 → 背景エネルギー（物体なし）────────────────────────────
const CAMPAIGN_TYPE_PROMPTS: Record<string, string> = {
  sale:    'High-energy bold warm gradient with strong visual excitement. Dynamic light burst from center. Urgent energetic color atmosphere.',
  new:     'Fresh clean bright gradient with cool luminous tones. Crisp revealing light suggesting discovery and newness. Contemporary minimalist glow.',
  season:  'Seasonal mood color palette with soft atmospheric gradients evoking the season through color temperature and light quality only.',
  ranking: 'Prestigious warm gold and deep tones. Confident premium lighting with golden accent glow suggesting achievement and authority.',
  set:     'Generous abundant warm gradient with rich full tones. Welcoming wide open color field suggesting completeness and value.',
  gift:    'Elegant warm sophisticated gradient. Soft premium glow with warm accent light. Special occasion luxury atmosphere through refined color.',
}

// ─── コピートーン → 背景雰囲気（物体なし）────────────────────────────────────
const COPY_TONE_PROMPTS: Record<string, string> = {
  premium:  'Deep rich dark gradient — near-black or pure white field. Ultra-premium minimalist lighting. Aspirational restrained elegance through tonal depth.',
  bargain:  'Bright cheerful warm gradient. Inviting accessible color palette with open friendly light. Welcoming approachable atmosphere.',
  urgent:   'High-contrast dramatic gradient with bold color tension. Sharp directional light. Strong visual urgency through color and shadow.',
  safe:     'Calm balanced soft gradient. Stable even professional lighting. Trustworthy reliable authoritative atmosphere through clean neutral tones.',
  health:   'Fresh vibrant clean gradient — natural greens, whites, and organic tones. Soft natural light quality. Vitality and wellness through color.',
  fun:      'Bright joyful colorful gradient. Saturated playful tones with cheerful bokeh bursts. Celebratory energetic positive atmosphere.',
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
async function fetchPageDesignHints(url: string, ai: GoogleGenAI): Promise<string> {
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
    const ogImage =
      html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
      html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i)?.[1]

    const hints: string[] = []
    if (themeColor) hints.push(`reference page accent color: ${themeColor}`)
    if (ogTitle)    hints.push(`reference product title: "${clean(ogTitle).slice(0, 80)}"`)
    if (ogDesc)     hints.push(`reference page context: "${clean(ogDesc).slice(0, 150)}"`)

    let imageAnalysis = ''
    if (ogImage) {
      imageAnalysis = await analyzeReferenceImage(ai, ogImage)
    }

    const hintStr = hints.length > 0
      ? `REFERENCE PAGE DESIGN HINTS (from ${url.slice(0, 50)}): ${hints.join('. ')}. Align visual style with this page's design language.`
      : ''

    return [hintStr, imageAnalysis].filter(Boolean).join(' ')
  } catch {
    return ''
  }
}

// ─── og:image を分析してデザイン参照情報を取得 ───────────────────────────────
async function analyzeReferenceImage(ai: GoogleGenAI, imageUrl: string): Promise<string> {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BannerBot/1.0)' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return ''
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) return ''
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = contentType.split(';')[0].trim()
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: 'Analyze this product/banner image as a design reference. English only, max 80 words: 1) exact dominant colors and secondary colors with their mood, 2) visual style (premium/casual/energetic/etc) and aesthetic category, 3) background style and lighting character, 4) photography technique and atmosphere. This will be used to match the visual language of a new banner.' },
        ],
      }],
    })
    return result.text?.trim() ? `REFERENCE IMAGE ANALYSIS: ${result.text.trim()}` : ''
  } catch {
    return ''
  }
}

// ─── Gemini でウェブ検索して商品のブランドカラーと背景テーマを特定 ──────────
// 重要: 商品の「外観説明」ではなく「背景に使うべき色・ムード」のみを返す
// 商品形状・ボトル形状などをImagenに伝えると背景に描画されてしまうため
async function describeProductVisually(
  ai: GoogleGenAI,
  productName: string | undefined,
  productImageDesc: string | undefined,
  category: string,
  target: string,
  productFeatures?: string,
  saleInfo?: string,
  designStyle?: string,
): Promise<string> {
  const hasSpecificProduct = !!(productName?.trim())

  const prompt = `You are a banner background design specialist for Japanese e-commerce.

${productName ? `Product: "${productName}"` : ''}
${productImageDesc ? `Product type: "${productImageDesc}"` : ''}
Category: ${category || 'General'}
Target: ${target}
${productFeatures ? `Features: ${productFeatures}` : ''}
${saleInfo ? `Promotion: ${saleInfo}` : ''}
${designStyle ? `Design style: ${designStyle}` : ''}

${hasSpecificProduct
  ? `STEP 1 — SEARCH: Search the web for "${productName}" right now. Find its actual brand color palette (e.g., Rohto ReGRO = crimson red + gold + white; Columbia = navy + orange; Sony WH-1000XM5 = platinum silver + black). Use real search results, not assumptions.`
  : `Use brand knowledge to determine this product type's typical color identity.`
}

STEP 2 — OUTPUT: Based on the product's ACTUAL brand identity, specify the ideal BACKGROUND for a commercial banner.

OUTPUT FORMAT (English only, 2-3 sentences):
"GRADIENT COLORS: [2-3 specific background gradient colors matching the product's brand palette]. LIGHTING: [atmospheric lighting style]. MOOD: [2-3 mood adjectives matching the brand identity]."

ABSOLUTE RULES:
- Output ONLY background color/mood specifications — NEVER describe product shape, bottle, container, packaging form
- Colors must come from the product's REAL brand palette found via search
- No numbers, weights, measurements in output
- No Japanese in output`

  try {
    const config = hasSpecificProduct ? { tools: [{ googleSearch: {} }] } : undefined
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config,
    })
    return result.text?.trim() ?? ''
  } catch {
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      })
      return result.text?.trim() ?? ''
    } catch {
      return ''
    }
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
      model: 'gemini-2.5-flash',
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

// ─── サイズ比率 → 構図ヒント（Imagen 4 クロップ対応）────────────────────────
function getSizeCompositionHint(width: number, height: number): string {
  const ratio = width / height
  if (ratio >= 5) {
    return 'CRITICAL COMPOSITION — ULTRA-WIDE PANORAMIC BANNER: The generated 16:9 image will be center-cropped to an extreme horizontal strip. ONLY the center vertical third of the image will be visible — the top third and bottom third will be completely cut off. Design exclusively for the horizontal center band: use a pure horizontal gradient flow, bokeh elements clustered in the center height zone, no visual interest near top or bottom edges.'
  }
  if (ratio >= 2.5) {
    return 'WIDE HORIZONTAL BANNER COMPOSITION: This image will be cropped to a wide strip. Keep all atmospheric visual elements within the center half vertically. Use a strong left-to-right horizontal gradient flow. The final result should feel like a cinematic panoramic sweep.'
  }
  if (ratio >= 1.6) {
    return 'STANDARD HORIZONTAL BANNER: Classic horizontal commercial banner composition. Left side features the main atmospheric color for text legibility. Right side transitions to the product zone. Balanced horizontal flow with natural depth.'
  }
  // Square
  return 'SQUARE FORMAT: Full square balanced composition. The atmospheric gradient and bokeh should flow from corner to corner with equal visual weight on all four sides. No strong horizontal or vertical bias — omnidirectional soft light diffusion.'
}

// ─── Hex → 自然言語カラー名（英語プロンプト用）────────────────────────────────
// 重要: 絶対にhex文字列をそのまま返さない（Imagenが文字として描画するため）
function hexToColorDescription(hex: string): string {
  if (!hex || hex.length < 7) return 'deep navy blue'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  const s = d === 0 ? 0 : l > 0.5 ? d / (2 - max - min) : d / (max + min)

  if (l < 0.08) return 'deep charcoal black'
  if (l > 0.93) return 'clean bright white'
  if (s < 0.10) {
    if (l < 0.30) return 'dark charcoal grey'
    if (l < 0.65) return 'neutral mid grey'
    return 'soft silver grey'
  }

  let h = 0
  if (d > 0) {
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0))
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
  }

  if (h < 20 || h >= 340) return l < 0.35 ? 'deep dark crimson red' : l < 0.60 ? 'rich vivid red' : 'bright vibrant red'
  if (h < 45)  return l < 0.40 ? 'deep burnt amber orange' : 'warm energetic orange'
  if (h < 70)  return l < 0.50 ? 'rich warm gold' : 'bright golden yellow'
  if (h < 150) return l < 0.30 ? 'deep forest green' : l < 0.55 ? 'vibrant emerald green' : 'fresh bright green'
  if (h < 195) return l < 0.35 ? 'deep dark teal' : 'fresh teal blue-green'
  if (h < 250) return l < 0.22 ? 'deep midnight navy blue' : l < 0.40 ? 'rich royal blue' : 'bright clear blue'
  if (h < 300) return l < 0.30 ? 'deep regal purple' : l < 0.55 ? 'rich violet purple' : 'vibrant purple'
  return l < 0.50 ? 'deep rose magenta' : 'vibrant rose pink'
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

// ─── カテゴリ別背景ムード（抽象背景専用 — 商品・物体を描写しない）──────────
const CATEGORY_STYLE: Record<string, string> = {
  '食品・飲料':
    'Warm inviting color palette with golden amber, rich ochre, and deep warm tones. Soft studio lighting suggesting richness and abundance. The atmosphere evokes warmth and natural authenticity through pure color gradients and diffused light alone.',
  '美容・コスメ':
    'Elegant pearl white, soft rose, and champagne gold gradient tones. Gentle butterfly lighting with a luminous glow. Clean sophisticated atmosphere evoking luxury and refinement through smooth color fields and bokeh.',
  'ファッション':
    'Clean editorial gradient from pure white to soft cool neutral. Fashion magazine minimalism. Crisp even studio light with subtle tonal shift suggesting style and contemporary sophistication.',
  '家電・PC':
    'Cool dark gradient from deep charcoal to midnight blue with precise clean lighting. Tech-forward minimalist atmosphere suggesting innovation and premium quality through abstract tones and precise light.',
  'スポーツ・アウトドア':
    'Dynamic high-contrast gradient with bold energetic colors — deep navy, vibrant accent. Strong directional light suggesting power and motion. Active energetic atmosphere through pure color and dramatic lighting.',
  'インテリア・家具':
    'Warm natural gradient with soft earth tones, warm beige, and honey oak tones. Gentle ambient light suggesting cozy sophisticated living through smooth color gradients and warm bokeh.',
  'ベビー・マタニティ':
    'Soft pastel gradient — gentle blush pink, mint green, and ivory cream. Diffused natural light. Warm protective atmosphere through gentle colors and soft bokeh spheres.',
  'その他':
    'Clean versatile gradient with professional studio tones. Balanced contemporary palette with crisp lighting and smooth color transitions.',
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
    'bottom-left':   'lower-left corner area',
    'bottom-center': 'bottom strip (full width)',
    'bottom-right':  'lower-right corner area',
    'top-left':      'upper-left corner area',
    'top-center':    'top strip (full width)',
    'top-right':     'upper-right corner area',
  }
  return map[pos] ?? 'lower-left or left side of the frame'
}


// ─── プロンプト構築（Imagen 4用 — 純粋抽象背景特化）─────────────────────────
// 重要設計原則:
//   1. Imagenに「commercial」「banner」「product」を伝えない → 商品の描画を誘発するため
//   2. 「abstract fine art gradient photography」としてフレームする
//   3. 商品名・ブランド名は一切Imagenに渡さない（Geminiが変換した色情報のみ使う）
//   4. 色指定を最前列に置く（Imagenは前半の指示を最も重視する）
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
  productFeatures?: string
  saleInfo?: string
  campaignType?: string
  copyTone?: string
  productVisualDesc?: string
  size?: { width: number; height: number }
}): string {
  const compositionHint = input.size ? getSizeCompositionHint(input.size.width, input.size.height) : ''
  const colorDesc = hexToColorDescription(input.color)
  const categoryStyle = CATEGORY_STYLE[input.category] ?? CATEGORY_STYLE['その他']
  const spaceDesc = textPositionToSpaceDesc(input.textPosition ?? 'bottom-left')
  const stylePrompt = input.designStyle ? DESIGN_STYLE_PROMPTS[input.designStyle] ?? '' : ''
  const textSide = (input.textPosition ?? 'bottom-left').includes('left') ? 'left' : 'right'
  const productSide = textSide === 'left' ? 'right' : 'left'
  const productBgColorDesc = input.productBgColor ? hexToColorDescription(input.productBgColor) : 'soft neutral warm light'

  // ブランドカラーの優先度:
  //   1. 商品画像あり → ユーザー選択色 + 商品背景色でグラジエント
  //   2. Gemini検索でブランドカラーあり → ブランドカラー主体 + ユーザー選択色を補助
  //   3. 何もなし → ユーザー選択色のみ
  let gradientSpec: string
  if (input.hasProductImage) {
    gradientSpec = `COLOR GRADIENT: Smooth seamless gradient — ${colorDesc} on the ${textSide} side with soft bokeh glow, gently fading to ${productBgColorDesc} on the ${productSide} side. Seamless blend, no hard edges.`
  } else if (input.productVisualDesc) {
    gradientSpec = `COLOR GRADIENT: ${input.productVisualDesc} Additionally blend with ${colorDesc} accent on the ${textSide} side for text legibility. Smooth seamless transition, no hard edges.`
  } else {
    gradientSpec = `COLOR GRADIENT: ${colorDesc} as the primary dominant tone. Light blooms atmospherically from the ${productSide} side and gently dims toward the ${textSide} side. Seamless smooth gradient.`
  }

  const moodStyle = stylePrompt
    ? `VISUAL MOOD: ${stylePrompt}`
    : `VISUAL MOOD: ${categoryStyle}`

  const campaignLine = input.campaignType && CAMPAIGN_TYPE_PROMPTS[input.campaignType]
    ? `ENERGY CHARACTER: ${CAMPAIGN_TYPE_PROMPTS[input.campaignType]}`
    : ''

  const toneLine = input.copyTone && COPY_TONE_PROMPTS[input.copyTone]
    ? `ATMOSPHERE: ${COPY_TONE_PROMPTS[input.copyTone]}`
    : ''

  const catchcopyLine = input.catchcopy?.trim()
    ? `EMOTIONAL TONE: Inspired by the feeling of "${input.catchcopy}" — let this subtly influence the color temperature and lighting energy.`
    : ''

  const imageAnalysisLine = input.productImageAnalysis
    ? `SECONDARY COLOR HARMONY: ${input.productImageAnalysis}`
    : ''

  return [
    // フレームを「抽象ファインアート」に — 「commercial banner」「product」の文言なし
    `Abstract fine art gradient photography. Smooth seamless color field with professional studio lighting. Pure atmospheric color background with soft defocused bokeh orbs.`,
    compositionHint,
    // 色指定を最前列に（Imagenは冒頭を最重視）
    gradientSpec,
    moodStyle,
    campaignLine,
    toneLine,
    catchcopyLine,
    imageAnalysisLine,
    input.pageHints || '',
    // 空白スペースの確保
    `COMPOSITION DETAIL: The ${spaceDesc} zone must be kept especially clean, open, and free of any visual elements — reserved for text overlay in post-production. Soft empty gradient only in that zone.`,
    // 許可要素の明示
    `ALLOWED ELEMENTS: Smooth color gradients. Soft out-of-focus circular bokeh light orbs. Diffused studio lighting glow. Subtle atmospheric light bloom. Nothing else.`,
    // 禁止事項（簡潔・明確）
    `STRICTLY FORBIDDEN — AUTOMATIC FAILURE: Any bottle, container, tube, dispenser, shoe, food, clothing, furniture, tool, plant, hand, or any physical object whatsoever. Any text, letter, number, character, logo, brand mark, or symbol. Hard geometric shapes or patterns. The image must contain ONLY abstract color gradients and soft defocused light — nothing identifiable as any real-world object.`,
    `TECHNICAL: 8K photographic resolution. Smooth color transitions. Contemporary color grade. Professional studio quality.`,
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

  const { productName, productImageDesc, category, target, catchcopy, color, size, textPosition, referenceUrl, designStyle, productImageBase64, productImageMimeType, productBgColor, productFeatures, saleInfo, campaignType, copyTone, variations } = body

  if ((!productName?.trim() && !productImageDesc?.trim()) || !target?.trim()) {
    return NextResponse.json({ error: '商品名またはイメージ・ターゲットは必須です' }, { status: 400 })
  }

  const ai = new GoogleGenAI({ apiKey })
  const hasProductImage = !!(productImageBase64 && productImageMimeType)

  const productIdentifier = [productName, productImageDesc].filter(Boolean).join(' / ') || '商品'

  const [pageHints, productImageAnalysis, productVisualDesc] = await Promise.all([
    fetchPageDesignHints(referenceUrl ?? '', ai),
    hasProductImage ? analyzeProductImage(ai, productImageBase64!, productImageMimeType!) : Promise.resolve(''),
    !hasProductImage ? describeProductVisually(ai, productName, productImageDesc, category, target, productFeatures, saleInfo, designStyle) : Promise.resolve(''),
  ])

  const prompt = buildPrompt({ productName: productIdentifier, category, target, catchcopy, color, textPosition, designStyle, pageHints, hasProductImage, productImageAnalysis, productBgColor, productFeatures, saleInfo, campaignType, copyTone, productVisualDesc, size })
  const reasoning = buildReasoning({ productName: productIdentifier, category, target, catchcopy, color, textPosition, designStyle, referenceUrl })
  const aspectRatio = toImagenAspectRatio(size.width, size.height)

  try {
    const numImages = variations === 2 ? 2 : 1
    const response = await ai.models.generateImages({
      model: MODEL,
      prompt,
      config: {
        numberOfImages: numImages,
        aspectRatio,
        outputMimeType: 'image/jpeg',
      },
    })

    const generatedImages = response.generatedImages ?? []
    if (generatedImages.length === 0) {
      return NextResponse.json(
        { error: '画像が生成されませんでした。コンテンツポリシーに抵触した可能性があります。' },
        { status: 422 }
      )
    }

    const imageDataUrls = generatedImages
      .map(img => img.image?.imageBytes ? `data:image/jpeg;base64,${img.image.imageBytes}` : null)
      .filter(Boolean) as string[]

    return NextResponse.json({
      imageDataUrls,
      imageDataUrl: imageDataUrls[0],
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
