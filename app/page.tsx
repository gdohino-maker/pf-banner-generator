import Link from 'next/link'

const MODES = [
  {
    href: '/generate/event',
    badge: 'Mode A',
    title: 'クーポン・イベント生成',
    subtitle: 'テンプレート合成',
    desc: 'クーポン金額・期限・CTAを入力するだけ。AIなし・即時・無料。楽天スタンダード/お得感/プレミアムの3テンプレートで高品質なクーポンバナーを生成。',
    tags: ['即時生成', 'AIなし', 'クーポン', 'イベント'],
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    gradient: 'from-orange-500 to-red-500',
    lightBg: 'bg-orange-50',
    lightText: 'text-orange-700',
    border: 'border-orange-100',
    cta: '今すぐ作成',
    ctaBg: 'bg-orange-500 hover:bg-orange-600',
  },
  {
    href: '/generate/concept',
    badge: 'Mode B',
    title: 'イメージ・コンセプト生成',
    subtitle: 'フルAI生成',
    desc: 'テキストプロンプトから、雰囲気重視の背景やビジュアルをAIで全自動生成。カテゴリトップのヘッダー画像・特集ページのメインビジュアルに最適。',
    tags: ['Imagen 4', 'Gemini', '背景生成', '特集ページ'],
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'bg-violet-50',
    lightText: 'text-violet-700',
    border: 'border-violet-100',
    cta: 'AI生成を試す',
    ctaBg: 'bg-violet-600 hover:bg-violet-700',
  },
  {
    href: '/generate/product',
    badge: 'Mode C',
    title: '商品画像ベース生成',
    subtitle: 'レイヤー合成',
    desc: '実物の商品画像をアップロード→背景自動切り抜き→AI背景生成→バッジ/テキスト合成まで全自動。父の日・お中元・季節商材の実物訴求バナーに。',
    tags: ['背景切り抜き', 'AI合成', '商品訴求', 'SOYレベル'],
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-teal-main to-teal-dark',
    lightBg: 'bg-teal-50',
    lightText: 'text-teal-700',
    border: 'border-teal-100',
    cta: '商品画像で作成',
    ctaBg: 'bg-teal-main hover:bg-teal-dark',
  },
]

export default function PortalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ─── ヘッダー ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #4ECDC4, #26A69A)' }}>
              <span className="text-white text-xs font-black tracking-tight">PF</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none">PFクリエイティブ生成</p>
              <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">楽天バナー・商品画像 AI生成ツール</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-teal-light"
            style={{ background: '#E0F2F1', color: '#26A69A' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-main animate-pulse" />
            Imagen 4 + Gemini
          </div>
        </div>
      </header>

      {/* ─── ヒーロー ─────────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-12 px-5 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border"
          style={{ background: '#E0F2F1', color: '#26A69A', borderColor: '#B2DFDB' }}>
          楽天 SHOP OF THE YEAR 受賞店舗クオリティを量産
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 leading-tight tracking-tight">
          ECバナーを、<span style={{ color: '#4ECDC4' }}>AIで瞬時に</span>プロ仕上げ
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          用途に合わせた3つの生成モード。クーポンバナーから商品訴求まで、
          楽天トンマナに合ったクリエイティブを誰でも即時生成。
        </p>
      </section>

      {/* ─── 3モードカード ────────────────────────────────────────────────────── */}
      <section className="flex-1 pb-20 px-5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {MODES.map((mode) => (
            <div key={mode.href}
              className={`bg-white rounded-2xl border ${mode.border} shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden animate-fade-in`}>
              {/* カードヘッダー */}
              <div className={`p-6 bg-gradient-to-br ${mode.gradient}`}>
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 text-white`}>
                    {mode.icon}
                  </div>
                  <span className="text-xs font-bold text-white/80 bg-white/20 px-2.5 py-1 rounded-full">
                    {mode.badge}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white mt-4 leading-tight">{mode.title}</h2>
                <p className="text-xs font-medium text-white/75 mt-1">{mode.subtitle}</p>
              </div>
              {/* カードボディ */}
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{mode.desc}</p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {mode.tags.map(tag => (
                    <span key={tag}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${mode.lightBg} ${mode.lightText}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href={mode.href}
                  className={`mt-5 w-full py-3 rounded-xl text-sm font-bold text-white text-center transition-all active:scale-95 shadow-md ${mode.ctaBg}`}>
                  {mode.cta} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── フッター ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-8 px-5 text-center">
        <p className="text-xs text-slate-400">© 2025 PFクリエイティブ生成 — Powered by Google Imagen 4 & Gemini</p>
      </footer>
    </div>
  )
}
