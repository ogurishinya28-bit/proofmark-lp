/**
 * SupportedToolsSection Component
 * Design: Cyber-Minimalist Security
 * Tools: 8種 / Formats: 6種
 */

export const SupportedToolsSection = () => {
  const tools = [
    {
      name: "Nano Banana Pro",
      logo: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto" }}>
          <path d="M12 2C16.4183 2 20 5.58172 20 10C20 15.5228 12 22 12 22C12 22 4 15.5228 4 10C4 5.58172 7.58172 2 12 2Z" stroke="url(#nbp-gradient)" strokeWidth="1.5" />
          <path d="M8 9C8 9 9.5 7.5 12 7.5C14.5 7.5 16 9 16 9" stroke="#00D4AA" strokeWidth="1.5" strokeLinecap="round" />
          <defs>
            <linearGradient id="nbp-gradient" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6C3EF4" /><stop offset="1" stopColor="#00D4AA" />
            </linearGradient>
          </defs>
        </svg>
      ),
      description: "次世代生成AIエンジン対応。"
    },
    { name: "Midjourney", logo: "🎨", description: "AI画像生成" },
    { name: "Stable Diffusion", logo: "⚡", description: "オープンソースAI" },
    { name: "DALL-E", logo: "🤖", description: "OpenAI生成" },
    { name: "Adobe Firefly", logo: "✨", description: "Adobe統合" },
    { name: "Leonardo.AI", logo: "🎭", description: "クリエイティブAI" },
    { name: "Niji・journey", logo: "🌸", description: "アニメ系AI" },
    {
      name: "NovelAI",
      logo: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F0EFF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
      description: "アニメ・イラスト特化型生成AI。"
    },
  ];

  // 対応フォーマット（6種）
  const supportedFormats = [
    "JPG",
    "PNG",
    "WebP",
    "GIF",
    "AVIF",
    "HEIC", // iPhoneデフォルト形式
  ];

  return (
    <section className="py-20 bg-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-3">Supported Formats &amp; AI Tools</h2>
          <p className="text-muted max-w-2xl mx-auto">
            主要なAIツールの出力に対応。あなたのワークフローをそのまま活かせます。
          </p>
        </div>

        {/* Tools Grid: 2列(SP) → 4列(タブレット以上) × 2段 = 8枠 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-4 mb-12">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="group flex flex-col items-center justify-center p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all hover:bg-card/80"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                {tool.logo}
              </div>
              <h3 className="text-sm font-bold text-center mb-1">{tool.name}</h3>
              <p className="text-xs text-muted text-center">{tool.description}</p>
            </div>
          ))}
        </div>

        {/* Format Support: 6フォーマット を 3列×2段 or 6列で表示 */}
        <div className="max-w-3xl mx-auto">
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-bold mb-4">対応フォーマット</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {supportedFormats.map((format) => (
                <div
                  key={format}
                  className="px-4 py-2 rounded-lg bg-secondary/50 border border-border text-sm font-semibold text-center"
                >
                  {format}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compatibility Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted">
            ※ ProofMarkはこれらのツールに対応しています。公式な提携ではなく、互換性を示しています。
          </p>
        </div>
      </div>
    </section>
  );
};