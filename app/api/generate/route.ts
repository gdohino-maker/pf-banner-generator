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

// ─── キャンペーン種別プロンプト ───────────────────────────────────────────────
const CAMPAIGN_TYPE_PROMPTS: Record<string, string> = {
  sale:    'High-energy SALE commercial atmosphere. Bold dynamic composition communicating exceptional VALUE and savings. Strong visual urgency with exciting energy.',
  new:     'Fresh exciting NEW PRODUCT launch energy. Premium reveal atmosphere. Discovery excitement. Clean contemporary modern staging.',
  season:  'Seasonal celebration atmosphere with carefully chosen natural seasonal elements. Festive mood perfectly aligned with the season.',
  ranking: 'Award-winning best-seller confidence and prestige. Popular choice authority. Trophy-quality premium achievement atmosphere.',
  set:     'Abundance and generous value composition. Products arranged to emphasize completeness and great quantity. Compelling set deal presentation.',
  gift:    'Elegant premium gift-giving atmosphere. Warm sophisticated presentation. Special occasion luxury. Thoughtful and aspirational.',
}

// ─── コピートーンプロンプト ───────────────────────────────────────────────────
const COPY_TONE_PROMPTS: Record<string, string> = {
  premium:  'Ultra-premium luxury commercial photography. Elegant minimalist background — deep black or pure white. High-end material quality. Aspirational sophisticated restraint.',
  bargain:  'Bright cheerful inviting accessible atmosphere. Warm approachable colors. Open friendly composition clearly communicating value and accessibility.',
  urgent:   'Dynamic high-contrast dramatic lighting. Bold composition with tension and immediacy. Strong visual energy suggesting limited-time opportunity.',
  safe:     'Clean professional trustworthy photography. Stable soft corporate lighting. Reliable calm authoritative atmosphere suggesting quality assurance.',
  health:   'Fresh organic natural photography. Soft warm natural window light. Clean botanical wellness lifestyle. Vitality and healthy living.',
  fun:      'Vibrant playful cheerful photography. Bright saturated joyful colors. Dynamic energetic happy composition. Positive celebratory energy.',
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

// ─── Gemini で商品名をウェブ検索して正確な英語ビジュアル説明に変換 ──────────
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
  const prompt = `You are a commercial photographer's art director. Your job is to produce a precise English visual description of a product for Imagen 4 AI image generation.

${productName ? `Product name/brand/model: "${productName}"` : ''}
${productImageDesc ? `Product category/image description: "${productImageDesc}"` : ''}
Category: ${category || 'General'}
Target customer: ${target}
${productFeatures ? `Key features: ${productFeatures}` : ''}
${saleInfo ? `Promotion context: ${saleInfo}` : ''}
${designStyle ? `Desired design style: ${designStyle}` : ''}

${hasSpecificProduct
    ? `CRITICAL INSTRUCTION: Search the web NOW for "${productName}" to find its ACTUAL, REAL appearance. You must describe the product's TRUE physical look based on search results — actual packaging colors, container shape, brand color scheme, materials. Do NOT guess or use generic assumptions. If the product is "リグロEX5エナジー 60ml" you must find and describe the real white/red/gold packaging. If it is "Columbia YH4977" you must find that specific shoe's real colors. Always verify with search.`
    : `Use your knowledge of Japanese and global consumer brands to describe the product's likely appearance accurately.`
}

STRICT OUTPUT RULES:
1. Write 3-4 sentences of precise English ONLY
2. Describe the product's ACTUAL PHYSICAL APPEARANCE: exact colors, container/packaging shape, materials, brand color scheme
3. Describe the IDEAL PHOTOGRAPHIC SCENE and background atmosphere that would best showcase this product
4. NEVER include numbers, weights (g, kg, ml), prices, quantities, or measurements
5. NEVER include text, logos, letters, or words that would appear on packaging
6. Be precise: "white matte bottle with crimson red cap and gold accent band" not just "cosmetic bottle"
7. Professional commercial photography language only

Output ONLY the English visual description, no explanations, no Japanese, no commentary.`

  try {
    // 具体的な商品名がある場合はGoogle Searchで実際の商品情報を検索
    const config = hasSpecificProduct
      ? { tools: [{ googleSearch: {} }] }
      : undefined

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config,
    })
    return result.text?.trim() ?? ''
  } catch {
    // Search grounding失敗時はフォールバック（検索なし）
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
    'bottom-left':   'lower-left corner area',
    'bottom-center': 'bottom strip (full width)',
    'bottom-right':  'lower-right corner area',
    'top-left':      'upper-left corner area',
    'top-center':    'top strip (full width)',
    'top-right':     'upper-right corner area',
  }
  return map[pos] ?? 'lower-left or left side of the frame'
}


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

  // 常に背景のみ生成（Imagenに商品を作らせない — 偽商品・文字化けパッケージを根絶）
  const textSide = (input.textPosition ?? 'bottom-left').includes('left') ? 'left' : 'right'
  const productSide = textSide === 'left' ? 'right' : 'left'

  // 商品画像ありの場合：商品側の雰囲気をgradeーションで合成
  const productBgColorDesc = input.productBgColor ? hexToColorDescription(input.productBgColor) : 'soft neutral light'
  const gradientInstruction = input.hasProductImage
    ? `GRADIENT COMPOSITION: Smooth seamless horizontal gradient — the ${textSide} half features ${colorDesc} with soft atmospheric bokeh and warm light glow. The ${productSide} half gently fades to ${productBgColorDesc} to seamlessly blend with the composited product photo. No hard edges, no abrupt transitions, only smooth organic color flow.`
    : `GRADIENT COMPOSITION: Full-width smooth atmospheric gradient. The dominant tone is ${colorDesc}. Light softly blooms from the ${productSide} side and gently dims toward the ${textSide} side for text legibility. Seamless, no visible bands or hard edges.`

  // 商品画像なしでビジュアル説明あり：雰囲気としてビジュアルを取り込む
  const atmosphereHint = (!input.hasProductImage && input.productVisualDesc)
    ? `ATMOSPHERE REFERENCE: The banner promotes "${input.productVisualDesc}". Reflect this product's visual character (colors, mood, textures) purely through abstract light, color, and bokeh — no objects, no products.`
    : ''

  return [
    `COMMERCIAL BANNER BACKGROUND ONLY: Generate a pure atmospheric background for a "${input.productName}" banner. This is a background layer — the product photo is composited in post-production. GENERATE ZERO PRODUCTS, ZERO OBJECTS, ZERO MERCHANDISE, ZERO PACKAGING, ZERO BOTTLES, ZERO BAGS, ZERO CUPS — background environment only.`,
    compositionHint ? compositionHint : '',
    `TARGET AUDIENCE: "${input.target}".`,
    stylePrompt ? `VISUAL STYLE: ${stylePrompt}` : `CATEGORY ATMOSPHERE: ${categoryStyle}`,
    input.campaignType && CAMPAIGN_TYPE_PROMPTS[input.campaignType] ? `CAMPAIGN ENERGY: ${CAMPAIGN_TYPE_PROMPTS[input.campaignType]}` : '',
    input.copyTone && COPY_TONE_PROMPTS[input.copyTone] ? `TONE: ${COPY_TONE_PROMPTS[input.copyTone]}` : '',
    input.catchcopy?.trim() ? `MOOD & ATMOSPHERE: The banner's message is "${input.catchcopy}" — let this emotional tone subtly influence the atmospheric color temperature and energy of the background.` : '',
    atmosphereHint,
    input.productImageAnalysis ? `COLOR HARMONY: ${input.productImageAnalysis}` : '',
    input.pageHints ? input.pageHints : '',
    gradientInstruction,
    `COLOR THEME: ${colorDesc} is the dominant color. Soft bokeh, atmospheric light, smooth gradients only.`,
    `NEGATIVE SPACE: Keep the ${spaceDesc} completely clear and visually empty — reserved for text overlay that will be added in post-production. This zone must have zero objects, zero visual elements, zero graphics, zero text — only the gradient background color.`,
    `VISUAL ELEMENTS: ONLY smooth gradients, soft circular bokeh orbs, and gentle light diffusion. Absolutely NO geometric shapes, NO diamonds, NO polygons, NO hexagons, NO triangles, NO lines, NO patterns, NO abstract shapes, NO objects of any kind.`,
    `TECHNICAL: 8K resolution, professional studio quality, premium contemporary color grade.`,
    `ABSOLUTE CRITICAL — HIGHEST PRIORITY: ZERO TEXT. ZERO TYPOGRAPHY. ZERO CHARACTERS. ZERO NUMBERS. ZERO LETTERS. ZERO JAPANESE. ZERO CHINESE. ZERO KOREAN. ZERO WORDS. ZERO LOGOS. ZERO LABELS. ZERO PRODUCTS. ZERO OBJECTS. Pure color, light, gradient, bokeh only. Any character, product, or object anywhere is automatic failure.`,
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
