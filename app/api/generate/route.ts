import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const maxDuration = 60

const MODEL = 'imagen-4.0-generate-001'

// ─── 型定義 ────────────────────────────────────────────────────────────────────
export type ReasoningPoint = { icon: string; title: string; body: string }

type RequestBody = {
  productName?: string
  productImageDesc?: string
  category: string
  target?: string
  catchcopy: string
  color: string
  size: { label: string; width: number; height: number }
  textPosition?: string
  designStyle?: string
  productImageBase64?: string
  productImageMimeType?: string
  productBgColor?: string
  variations?: 1 | 2
}

// ─── デザインスタイル（日本語ラベル · 診断レポート用）─────────────────────────
const DESIGN_STYLE_JA: Record<string, string> = {
  professional: 'プロフェッショナル（高級感・信頼感）',
  pop:          'ポップ（元気・活気・インパクト）',
  cute:         'かわいい（パステル・ほっこり）',
  appetizing:   'おいしそう（シズル感・食欲喚起）',
  stylish:      'スタイリッシュ（クール・モダン）',
  natural:      'ナチュラル（自然・優しい）',
}

// ─── シーン辞書（Prop Dictionary）────────────────────────────────────────────
// キーワードで商品を判定し、具体的な撮影環境・小道具を付与
interface SceneContext {
  environment: string  // テーブル・背景・空間
  lighting: string     // ライティング
  props: string        // 演出小道具（背景ぼかし内）
  podium: string       // Mode C専用: 商品を置く台座（商品は描かない）
  sizzle?: string      // Mode B食品専用: シズル感・食欲訴求の追加描写
}

const SCENE_DICT: { pattern: RegExp; ctx: SceneContext }[] = [
  {
    pattern: /鰻|うなぎ|ウナギ|蒲焼|うな重|鰻丼/,
    ctx: {
      environment: 'dark traditional Japanese hinoki lacquer serving tray, tatami room atmosphere, vintage Japanese high-end dining setting',
      lighting: 'warm golden dramatic side lighting from paper lantern, soft steam wisps rising, candlelight amber glow',
      props: 'antique lacquerware bowl with gold trim, bamboo leaf garnish, charcoal grill ember glow in deep background bokeh, sake cup silhouette',
      podium: 'premium dark lacquered round plate on hinoki wooden slab, premium chopsticks resting beside, antique sake cup in background',
      sizzle: 'glistening sweet tare sauce dripping with intense caramelized sheen, steam rising from perfectly charred surface, rich amber color depth',
    },
  },
  {
    pattern: /寿司|すし|刺身|さしみ|海鮮|マグロ|サーモン|イクラ|ウニ|カニ|魚介|海老/,
    ctx: {
      environment: 'dark glossy black slate sushi counter surface, minimalist professional sushi bar, authentic Japanese restaurant atmosphere',
      lighting: 'precise directional spotlight highlighting seafood glistening sheen, cool-white LED restaurant ambient, subtle reflection on slate',
      props: 'wasabi leaf accent, ceramic soy sauce cup, bamboo leaves, premium Japanese chopsticks, pickled ginger slices corner',
      podium: 'dark slate slab on woven bamboo mat, ceramic sauce dish accent, premium chopsticks, wasabi leaf decoration',
      sizzle: 'ultra-fresh jewel-like glistening sheen on fish surface, vibrant jewel-tone color saturation, crystal water droplets',
    },
  },
  {
    pattern: /和食|日本食|天ぷら|てんぷら|そば|蕎麦|うどん|鍋|丼|焼き魚|煮物|おでん|焼鳥|串焼き/,
    ctx: {
      environment: 'dark traditional Japanese wooden table with subtle aged wood grain, warm washi paper ambient backdrop',
      lighting: 'warm dramatic side lighting, gentle rising steam, golden candlelight warmth, traditional restaurant ambiance',
      props: 'ceramic Japanese tableware, bamboo serving tray, handmade chopsticks, small bonsai plant in background bokeh',
      podium: 'dark matte ceramic round plate on wooden placemat, chopsticks placed beside, small ceramic sauce dish',
      sizzle: 'steam rising delicately, rich sauce sheen and gloss, artisanal premium Japanese presentation',
    },
  },
  {
    pattern: /和菓子|お菓子|あんこ|餅|もち|どら焼き|団子|羊羹|最中/,
    ctx: {
      environment: 'light maple wooden board, washi paper texture accent, traditional Japanese confectionery aesthetic, zen minimalism',
      lighting: 'soft diffused natural side lighting, delicate gentle shadows, refined and quiet atmosphere',
      props: 'bamboo leaf, cherry blossom petal, white linen cloth, small ceramic tea cup in bokeh',
      podium: 'light maple wooden board, bamboo leaf accent, cherry blossom petal, washi paper texture',
      sizzle: 'delicate artisan texture detail, subtle natural sheen, handcrafted craftsmanship evident',
    },
  },
  {
    pattern: /パスタ|ピザ|ステーキ|ハンバーグ|洋食|フレンチ|イタリアン|グラタン|チーズ|ハム|ソーセージ/,
    ctx: {
      environment: 'dark rustic Italian bistro wooden table, elegant linen tablecloth, warm Michelin-starred candlelit restaurant',
      lighting: 'warm amber candlelight drama, bokeh restaurant lights in background, cinematic directional side lighting',
      props: 'wine glass silhouette in bokeh, rustic silver cutlery, fresh herb bundle, artisan sourdough corner',
      podium: 'white ceramic plate on dark wood restaurant table, linen napkin fold, silver cutlery, wine glass silhouette',
      sizzle: 'melted cheese pull stretching, rising steam cloud, rich sauce gloss and sheen, dramatic texture close-up',
    },
  },
  {
    pattern: /スイーツ|ケーキ|チョコ|クッキー|マフィン|パン|ベーカリー|デザート|アイス|プリン|タルト|ドーナツ|クレープ/,
    ctx: {
      environment: 'soft white marble pastry surface, Parisian patisserie elegance, light airy editorial',
      lighting: 'bright diffused natural window light, golden hour warmth, soft delicate shadows',
      props: 'scattered powdered sugar mist, delicate flower petals, satin ribbon, elegant marble cake stand corner',
      podium: 'white marble round pedestal, powder sugar dusting, rose petal accent, lace doily texture',
      sizzle: 'melted chocolate cascade drip, powdered sugar cloud mist, berry glaze jewel sheen, golden butter sheen',
    },
  },
  {
    pattern: /コーヒー|カフェ|珈琲|ラテ|カプチーノ|エスプレッソ|カフェラテ/,
    ctx: {
      environment: 'dark slate third-wave artisan coffee bar counter, specialty cafe atmosphere, warm moody',
      lighting: 'warm backlit glow through steam, moody atmospheric cafe lighting, rich bokeh background',
      props: 'scattered premium roasted coffee beans, burlap texture accent, latte art cup in background bokeh, small succulent',
      podium: 'dark slate coaster on natural wooden table, coffee beans scattered beside, ceramic espresso cup accent',
      sizzle: 'steam cloud rising from hot liquid, perfect crema surface, rich dark liquid depth with reflection',
    },
  },
  {
    pattern: /飲料|ドリンク|お茶|緑茶|抹茶|紅茶|ジュース|ビール|ワイン|日本酒|焼酎|ウイスキー|スムージー|ハーブティー/,
    ctx: {
      environment: 'polished dark premium stone bar surface, sophisticated high-end bar or cafe atmosphere',
      lighting: 'dramatic backlit glow highlighting liquid transparency and color, rim lighting on glass surface',
      props: 'ice cubes catching and refracting light, condensation water beads, citrus slice, fresh mint sprig',
      podium: 'premium marble coaster, condensation ring accent, ice cube, citrus slice garnish, minimal premium surface',
      sizzle: 'liquid splash dynamics frozen in time, crystal ice clarity, heavy condensation, backlit liquid jewel glow',
    },
  },
  {
    pattern: /野菜|果物|フルーツ|オーガニック|新鮮|ヘルシー|サラダ|農産物|農家|産直/,
    ctx: {
      environment: 'pristine white marble surface, fresh morning organic farmers market aesthetic, clean and vibrant',
      lighting: 'bright crisp natural daylight, clean soft shadows, ultra-fresh and vibrant quality',
      props: 'scattered morning dew water droplets, fresh herb leaves, natural linen cloth, rustic wooden cutting board corner',
      podium: 'white marble slab, fresh herb sprig accent, folded linen cloth, water droplet accents on surface',
      sizzle: 'morning dew droplets on fresh surface, vibrant saturated color, crisp texture and freshness detail',
    },
  },
  {
    pattern: /スキンケア|化粧品|コスメ|美容液|乳液|クリーム|洗顔|化粧水|セラム|ファンデ|リップ|アイシャドウ|マスカラ|香水/,
    ctx: {
      environment: 'smooth pearl-white luxury beauty editorial surface with subtle spatial depth, high-end boutique counter aesthetic',
      lighting: 'soft perfect butterfly lighting with gentle luminous background glow, luminous even illumination, beautiful soft bokeh glow in background',
      props: 'beautiful soft bokeh light orbs in distant background, draped pearl white silk satin, crystal water droplets, delicate jasmine flowers in deep background blur',
      podium: 'white acrylic cylindrical podium with silk satin drape behind, crystal droplets, soft background bokeh depth',
    },
  },
  {
    pattern: /シャンプー|ヘアケア|コンディショナー|育毛|スカルプ|ヘアオイル|ヘアマスク/,
    ctx: {
      environment: 'clean white luxury spa bathroom counter, frosted glass background, serene and premium',
      lighting: 'clean diffused bathroom lighting, fresh airy spa-like quality, bright and calming',
      props: 'eucalyptus botanical sprig, smooth white river stones, rolled white linen towel, clear glass refraction',
      podium: 'white ceramic bathroom surface, smooth stone pebble, eucalyptus sprig, clinical minimal premium',
    },
  },
  {
    pattern: /サプリ|プロテイン|栄養補助|ビタミン|健康食品|コラーゲン|ダイエット|サプリメント|漢方|薬膳/,
    ctx: {
      environment: 'clean white clinical precision surface, scientific laboratory aesthetic, trust-building minimal',
      lighting: 'bright even clean studio lighting, shadowless clinical illumination, fresh and trustworthy',
      props: 'fresh green botanical leaf, geometric white shape accent, subtle DNA helix bokeh background',
      podium: 'white cylindrical scientific pedestal, fresh green leaf, clean clinical surface with precision',
    },
  },
  {
    pattern: /美容|スキン|フェイス|body|ボディ|マッサージ|アロマ|エッセンシャル/,
    ctx: {
      environment: 'luxurious spa treatment surface, smooth stone, candle atmosphere, zen wellness',
      lighting: 'warm soft candlelight glow, relaxing spa ambiance, golden warmth',
      props: 'smooth river stones, eucalyptus and lavender botanical, candle flame bokeh, water ripple',
      podium: 'smooth stone spa surface, botanical herbs, candle accent, premium wellness aesthetic',
    },
  },
  {
    pattern: /服|アパレル|ファッション|コート|ジャケット|シャツ|パンツ|スカート|ニット|ワンピース|トップス|ボトムス/,
    ctx: {
      environment: 'premium minimalist fashion studio with subtle architectural spatial depth, elegant light-grey textured wall, natural depth and dimension',
      lighting: 'soft natural window light casting elegant subtle architectural shadows on wall, cinematic depth of field, minimalist high-end studio staging',
      props: 'beautiful blurred distant background bokeh with soft light orbs, subtle clothing rack silhouette far in deep background, architectural shadow play',
      podium: 'clean concrete plinth with subtle matte depth, industrial metal element, soft shadow casting on floor',
    },
  },
  {
    pattern: /靴|シューズ|スニーカー|ブーツ|サンダル|ヒール|パンプス|ローファー/,
    ctx: {
      environment: 'polished high-gloss white studio floor with subtle reflection, premium fashion stage',
      lighting: 'dramatic directional spotlight, clean silhouette, beautiful floor reflection',
      props: 'polished reflection floor, geometric clean white backdrop, minimal crisp shadow',
      podium: 'white polished plinth with floor reflection, clean studio white backdrop, minimal precision',
    },
  },
  {
    pattern: /家電|PC|パソコン|スマホ|スマートフォン|タブレット|カメラ|イヤホン|ヘッドフォン|スピーカー|ゲーム|デジタル|電子/,
    ctx: {
      environment: 'dark space-gray engineered precision surface, Apple-style product photography dark studio set',
      lighting: 'precise directional rim lighting accent, cool blue-white glow, dramatic premium dark atmosphere',
      props: 'subtle geometric dark surfaces, precision-cut reflections, abstract tech circuit bokeh background',
      podium: 'dark matte cylindrical precision podium, subtle blue rim glow, premium dark studio surface',
    },
  },
  {
    pattern: /アウトドア|登山|キャンプ|ランニング|フィットネス|スポーツ|ヨガ|自転車|サーフ|スキー|トレーニング/,
    ctx: {
      environment: 'dramatic natural terrain, rugged granite rock surface, golden hour mountain or coastal backdrop',
      lighting: 'golden hour dramatic directional sunlight, adventure energy, dynamic cloud shadows',
      props: 'rugged mountain stone texture, pine and cedar branches bokeh, adventure trail dust and mist',
      podium: 'natural granite rock slab, pine branch accent, outdoor terrain and sky backdrop',
    },
  },
  {
    pattern: /インテリア|家具|雑貨|キッチン|リビング|ダイニング|テーブル|椅子|棚|照明|カーテン/,
    ctx: {
      environment: 'Scandinavian minimal living room, warm light oak tones, hygge cozy afternoon aesthetic',
      lighting: 'warm diffused natural window light, soft cozy ambient home glow, golden hour warmth',
      props: 'small potted succulent plant, folded linen throw, matte ceramic vase in bokeh, oak shelf surface',
      podium: 'light oak wooden shelf surface, small plant accent, linen fabric drape, warm neutral backdrop',
    },
  },
  {
    pattern: /ベビー|赤ちゃん|キッズ|子供|マタニティ|おもちゃ|ベビー用品|出産|育児/,
    ctx: {
      environment: 'ultra-soft pastel cotton nursery dreamscape, warm gentle baby room, safe and tender',
      lighting: 'ultra-soft diffused golden natural light, absolutely no harsh shadows, warm protective',
      props: 'soft cotton blanket fold, small pastel colored ball, hand-knitted texture, tiny plush toy silhouette',
      podium: 'soft white cotton fabric surface, pastel accent element, gentle rounded organic shapes, warm fiber',
    },
  },
]

// カテゴリフォールバックシーン
const CATEGORY_SCENE_FALLBACK: Record<string, SceneContext> = {
  '食品・飲料': {
    environment: 'elegant premium dining table with warm wooden accents, high-end restaurant atmosphere',
    lighting: 'warm dramatic directional side lighting, golden warmth, atmospheric depth',
    props: 'premium tableware, herb garnish, atmospheric warm background bokeh',
    podium: 'premium serving plate on elegant table, food-safe surface, restaurant atmosphere',
    sizzle: 'appetizing food presentation, steam rising, sauce sheen and gloss',
  },
  '美容・コスメ': {
    environment: 'smooth pearl-white luxury beauty editorial surface with subtle spatial depth, high-end boutique aesthetic',
    lighting: 'soft butterfly lighting with beautiful background glow, luminous even illumination, soft bokeh depth in background',
    props: 'beautiful bokeh light orbs in background, silk fabric, crystal accents, water droplets, floral elements in distant blur',
    podium: 'white acrylic pedestal with silk drape, soft background depth, flower accent',
  },
  'ファッション': {
    environment: 'premium minimalist fashion studio with subtle architectural depth, elegant textured wall',
    lighting: 'soft natural window light with elegant shadows, cinematic depth of field, minimalist staging',
    props: 'beautiful bokeh depth in background, subtle rack silhouette in distance, architectural shadow play',
    podium: 'clean concrete plinth, subtle shadow casting on floor, minimal depth',
  },
  '家電・PC': {
    environment: 'dark precision tech studio surface, Apple-level product photography',
    lighting: 'precise rim lighting, dramatic premium dark atmosphere',
    props: 'geometric dark surfaces, subtle tech bokeh',
    podium: 'dark matte pedestal, subtle blue rim glow, precision dark surface',
  },
  'スポーツ・アウトドア': {
    environment: 'dynamic natural terrain, adventure atmosphere, golden hour',
    lighting: 'dramatic directional outdoor golden light, energy and motion',
    props: 'natural terrain textures, adventure elements in bokeh',
    podium: 'natural stone surface, outdoor terrain and sky backdrop',
  },
  'インテリア・家具': {
    environment: 'Scandinavian minimal home setting, warm oak tones, hygge',
    lighting: 'warm natural window light, cozy home glow',
    props: 'plant, linen throw, wooden elements, ceramic accents',
    podium: 'wooden shelf surface, small plant, cozy home backdrop',
  },
  'ベビー・マタニティ': {
    environment: 'soft pastel nursery setting, gentle warm dreamscape',
    lighting: 'ultra-soft diffused natural light, protective warmth',
    props: 'soft cotton, pastel accent textures, gentle rounded elements',
    podium: 'soft fabric surface, pastel color accent, warm organic shapes',
  },
  'その他': {
    environment: 'premium commercial photography studio, sophisticated neutral backdrop',
    lighting: 'professional balanced studio lighting, even quality illumination',
    props: 'clean minimal premium props, sophisticated neutral tones',
    podium: 'clean white studio pedestal, professional neutral backdrop',
  },
}

function detectScene(productDesc: string, category: string): SceneContext {
  const text = productDesc
  for (const { pattern, ctx } of SCENE_DICT) {
    if (pattern.test(text)) return ctx
  }
  return CATEGORY_SCENE_FALLBACK[category] ?? CATEGORY_SCENE_FALLBACK['その他']
}

// ─── Hex → 自然言語カラー名（英語プロンプト用）────────────────────────────────
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

// ─── Imagen 4 サポートアスペクト比へのマッピング ─────────────────────────────
function toImagenAspectRatio(width: number, height: number): string {
  const ratio = width / height
  if (ratio >= 1.6) return '16:9'
  if (ratio >= 1.2) return '4:3'
  if (ratio >= 0.84) return '1:1'
  if (ratio >= 0.6) return '3:4'
  return '9:16'
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

// ─── 商品画像を分析してステージ設計ヒントを取得（Mode C用）──────────────────
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
          { text: 'Analyze this product image for commercial banner background design. Answer in English only (max 60 words): 1) Main product dominant colors (2-3 specific color adjectives), 2) Product material/quality feel (premium/casual/minimal/etc), 3) Best complementary background color palette and mood to showcase this product. Be specific and visual.' },
        ],
      }],
    })
    return result.text?.trim() ?? ''
  } catch {
    return ''
  }
}

// ─── Two-Step Prompting: GeminiがImagenプロンプトを最適生成 ──────────────────
// Mode B (isHeroShot=true):  商品をヒーローとして描画
// Mode C (isHeroShot=false): 空の台座・ステージのみ（商品は後から合成）
async function generateImagenPrompt(
  ai: GoogleGenAI,
  input: {
    productDesc: string
    category: string
    designStyle: string
    colorDesc: string
    textSide: 'left' | 'right'
    scene: SceneContext
    isHeroShot: boolean
    isUltraWide: boolean
    isWide: boolean
    catchcopy?: string
    productColorHint?: string
  }
): Promise<string> {
  const subjectSide = input.textSide === 'left' ? 'right' : 'left'

  // ─── バリエーション強化: スタイルモディファイアをランダム付与 ──────────────
  const STYLE_MODIFIERS = [
    'minimalist and refined, clean elegance',
    'elegant and luxurious, ultra-premium feel',
    'dynamic and bold with dramatic high-contrast',
    'soft and atmospheric with gentle cinematic depth',
    'dramatic and moody with rich deep shadows',
    'bright and airy with fresh luminous appeal',
    'sophisticated and editorial, fashion-forward',
    'warm and inviting with rich golden tones',
  ]
  const styleModifier = STYLE_MODIFIERS[Math.floor(Math.random() * STYLE_MODIFIERS.length)]

  // ─── 構図制約 ───────────────────────────────────────────────────────────────
  const cropWarning = input.isUltraWide
    ? `CRITICAL CROP: This 16:9 image will be severely cropped to an ultra-wide panoramic banner (~8:1 ratio). ONLY the central 30% height band will be visible. ALL elements MUST be within the center horizontal strip.`
    : input.isWide
      ? `WIDE CROP: Image cropped to wide horizontal banner. All elements must stay within center 50% height zone.`
      : `STANDARD: Balanced composition.`

  // Mode B: テキスト側の絶対空白を強制する非対称構図（"typography"/"text"を含めない）
  const asymmetricRule = `ASYMMETRIC GOLDEN RATIO (MANDATORY): The ENTIRE ${input.textSide} half of the image MUST be a vast, clean, and elegant negative space — completely minimal, smooth, unobstructed, out-of-focus. Zero visual subjects in that zone. The main subject must be placed ENTIRELY on the ${subjectSide} side, occupying only the ${subjectSide} third. Extreme asymmetry required.`

  // Mode C: シーンのenvironmentからフラットレイ用の素材を導出
  const flatlaySurface = (() => {
    const env = input.scene.environment.toLowerCase()
    if (env.includes('marble')) return 'polished white marble surface with subtle grey veining'
    if (env.includes('hinoki') || env.includes('lacquer')) return 'dark Japanese lacquer surface with subtle wood grain texture'
    if (env.includes('slate')) return 'dark matte polished slate surface'
    if (env.includes('oak') || (env.includes('wood') && !env.includes('dark'))) return 'warm natural light oak wood grain surface'
    if (env.includes('dark') && env.includes('wood')) return 'dark aged wood grain surface'
    if (env.includes('concrete')) return 'textured matte concrete surface'
    if (env.includes('cotton') || env.includes('fabric') || env.includes('pastel')) return 'soft white cotton fabric surface'
    if (env.includes('stone')) return 'smooth natural stone surface'
    if (env.includes('white') || env.includes('pearl')) return 'smooth pearl-white studio surface'
    if (env.includes('dark') || env.includes('space-gray')) return 'dark premium matte surface'
    return 'clean neutral studio surface with subtle texture'
  })()

  // 全モード共通: 品質タグ（末尾に付与）
  const qualityTags = `Commercial product photography, 8K resolution, cinematic studio lighting, highly detailed texture, shot on 85mm lens, professional color grading. Overall style: ${styleModifier}.`

  // 全モード共通: ネガティブ指示（hallucination対策 — "typography"等のポジ的言及を除外）
  const negativeRule = `FORBIDDEN — must never appear: letters, characters, words, writing, scripts, fonts, logos, watermarks, UI elements, signs, labels, numbers, symbols, brand marks.`

  const geminiInstruction = input.isHeroShot
    ? `You are a master commercial photographer writing Imagen 4 image generation prompts for premium Japanese e-commerce banners (Rakuten SHOP OF THE YEAR quality).

Write ONE complete Imagen 4 image generation prompt for a HERO PRODUCT SHOT.

PRODUCT TO PHOTOGRAPH: "${input.productDesc}"
Category: ${input.category || 'general product'}
Design style: ${input.designStyle || 'professional and premium'}
Color palette / accent: ${input.colorDesc}
${input.catchcopy ? `Campaign mood: "${input.catchcopy}"` : ''}

SCENE SETUP:
- Environment: ${input.scene.environment}
- Lighting: ${input.scene.lighting}
- Supporting props (in background bokeh): ${input.scene.props}
${input.scene.sizzle ? `- Appetite/sizzle appeal: ${input.scene.sizzle}` : ''}

COMPOSITION (MANDATORY):
- ${cropWarning}
- ${asymmetricRule}
- Camera: slightly elevated 30-45 degree perspective, 85mm equivalent, f/1.8 shallow depth of field, cinema-quality bokeh

QUALITY: ${qualityTags}

${negativeRule}

OUTPUT RULES: Write ONLY the Imagen 4 prompt text. No explanation, no headers. Maximum 200 words. English only. Make it vivid, specific, and sensory.`
    : `You are a commercial photographer writing Imagen 4 prompts for product photography backgrounds.

The client will composite their own product photograph onto this image AFTER generation.
CRITICAL RULE: Use TOP-DOWN FLATLAY or STRAIGHT-ON STUDIO BACKDROP view only. NO 3D podiums, NO raised platforms, NO plates with depth — flat surface only, perfect for overlaying product images.

PRODUCT TYPE (for background design): "${input.productDesc}"
Category: ${input.category || 'general'}
Accent color palette: ${input.colorDesc}
${input.productColorHint ? `Product colors to complement: ${input.productColorHint}` : ''}

BACKGROUND TO CREATE:
- View: Top-down flatlay OR straight-on studio backdrop (NO perspective, NO 3D objects in foreground)
- Surface texture: ${flatlaySurface}
- Lighting: ${input.scene.lighting}
- Background atmosphere (heavily blurred): ${input.scene.props}

COMPOSITION (MANDATORY):
- ${cropWarning}
- OPEN ZONE: The ${input.textSide} side (40% of width) must be a vast, clean, elegant negative space — completely minimal and unobstructed
- SURFACE: Flat textured surface on the ${subjectSide} area, smoothly blurred background
- Beautiful cinematic bokeh, f/1.4 equivalent depth of field

QUALITY: ${qualityTags}

${negativeRule}
- NO 3D objects in foreground, NO podiums, NO raised plates, NO products

OUTPUT RULES: Write ONLY the Imagen 4 prompt. No explanation. Maximum 200 words. English only.`

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: geminiInstruction }] }],
    })
    const text = result.text?.trim() ?? ''
    if (text.length > 40) return text
  } catch (e) {
    console.warn('[generateImagenPrompt] Gemini call failed, using scene fallback:', e)
  }

  // Gemini失敗時フォールバック（"text"/"typography"を含めない）
  const qualitySuffix = `Commercial product photography, 8K, cinematic studio lighting, 85mm lens, ${styleModifier}. No letters, no logos, no watermarks, no symbols.`
  if (input.isHeroShot) {
    return `Hero product shot of ${input.productDesc}. ${input.scene.environment}. ${input.scene.lighting}. Props in bokeh: ${input.scene.props}. ${input.colorDesc} palette. ${input.textSide} half: vast clean elegant negative space, completely empty. ${input.scene.sizzle ?? ''} f/1.8 shallow bokeh. ${qualitySuffix}`
  }
  return `Top-down flatlay background. ${flatlaySurface}. ${input.scene.lighting}. Out-of-focus atmosphere: ${input.scene.props}. ${input.colorDesc} palette. NO 3D objects in foreground, flat surface only. ${input.textSide} side: vast clean minimal open area. f/1.4 cinematic bokeh. ${qualitySuffix}`
}

// ─── AI診断レポート生成（診断カード用）──────────────────────────────────────
function buildReasoning(input: {
  productName: string
  category: string
  target: string
  catchcopy: string
  color: string
  textPosition?: string
  designStyle?: string
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
      body: `商品「${input.productName}」を画面${productAreaMap[pos] ?? '中央'}に配置し、${textAreaMap[pos] ?? '左下'}にキャッチコピー「${input.catchcopy}」用のネガティブスペースを確保。三分割法に基づく視線誘導で、楽天スマートフォン閲覧時の視認性を最大化。`,
    },
    {
      icon: '🎨',
      title: 'カラー戦略の根拠',
      body: `${colorDesc}（${input.color}）をアクセントに採用。この色彩は「${colorPsych}」効果を持ち、ターゲット「${input.target || '一般顧客'}」の購買心理に直接訴求します。`,
    },
    {
      icon: '📸',
      title: 'シーン演出の根拠',
      body: input.designStyle
        ? `デザインスタイル「${DESIGN_STYLE_JA[input.designStyle] ?? input.designStyle}」を優先採用。${catReasoning}`
        : catReasoning,
    },
    {
      icon: '📱',
      title: '楽天EC最適化の根拠',
      body: '楽天市場バナー制作20鉄則に準拠した高コントラスト・モバイルファースト構図を採用。PCとスマートフォンの両方で最大訴求力を発揮し、サムネイル（200×200px）でも商品が明確に認識できる視認性を確保。',
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

  const {
    productName, productImageDesc, category, target, catchcopy,
    color, size, textPosition, designStyle,
    productImageBase64, productImageMimeType,
    variations,
  } = body

  const hasProductImage = !!(productImageBase64 && productImageMimeType)
  if (!hasProductImage && !productName?.trim() && !productImageDesc?.trim()) {
    return NextResponse.json({ error: '商品画像またはバナーイメージを入力してください' }, { status: 400 })
  }

  const ai = new GoogleGenAI({ apiKey })

  const productIdentifier = [productName, productImageDesc].filter(Boolean).join(' / ') || '商品'
  const userColorDesc = hexToColorDescription(color)
  const textSide = (textPosition ?? 'bottom-left').includes('left') ? 'left' as const : 'right' as const
  const ratio = size.width / size.height
  const isUltraWide = ratio >= 5
  const isWide = ratio >= 2.5

  // シーン検出（キーワードマッチング → 撮影環境・小道具の決定）
  const scene = detectScene(productIdentifier, category)

  // Mode B (isHeroShot=true): テキスト入力のみ → 商品ヒーローショット
  // Mode C (isHeroShot=false): 商品画像あり → 空の台座ステージ
  const isHeroShot = !hasProductImage

  // Mode C: 商品画像を分析して補色・質感情報を取得
  let productColorHint = ''
  if (hasProductImage) {
    try {
      productColorHint = await analyzeProductImage(ai, productImageBase64!, productImageMimeType!)
    } catch {
      // 分析失敗しても続行
    }
  }

  // Two-Step Prompting: Geminiが最適なImagenプロンプトを生成
  const prompt = await generateImagenPrompt(ai, {
    productDesc: productIdentifier,
    category: category || '',
    designStyle: designStyle || '',
    colorDesc: userColorDesc,
    textSide,
    scene,
    isHeroShot,
    isUltraWide,
    isWide,
    catchcopy: catchcopy?.trim() || undefined,
    productColorHint: productColorHint || undefined,
  })

  const reasoning = buildReasoning({
    productName: productIdentifier,
    category,
    target: target ?? '',
    catchcopy,
    color,
    textPosition,
    designStyle,
  })

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
