import { Heart, Shield, Zap } from "lucide-react"; // LockをZap（武器/加速）に変更

/**
 * DeveloperMessage Component
 * 修正版：実態に即した透明性と、クリエイターの矜持を強調
 */

export const DeveloperMessage = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-4">Message from the Developer</h2>
          <p className="text-muted">
            ProofMarkに込めた、クリエイターへの想い。
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-card border border-border/50">
          {/* 想い */}
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1.5">「どうせAIでしょ？」と言わせないために</h3>
              <div className="text-muted leading-relaxed space-y-2">
                <p>
                  AIは魔法の杖ではありません。あなたが何百回もプロンプトを練り、構図を調整し、魂を込めて仕上げた作品は、立派な「あなたの創作物」です。
                </p>
                <p>
                  世間の軽視や、心ない盗用からあなたの誇りを守りたい。 ProofMarkは、AIと向き合うクリエイターの「創作の事実」を、揺るぎないデジタル証明として刻みます。
                </p>
              </div>
            </div>
          </div>

          {/* 技術的透明性（重要：ここを実態に合わせました） */}
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1.5">透明性とセキュリティの両立</h3>
              <div className="text-muted leading-relaxed space-y-2">
                <p>
                  あなたの作品は、Vercelサーバーを経由せずSupabase Storageへ直接転送（Direct Upload）されます。
                </p>
                <p>
                  転送後、サーバーサイドで安全にSHA-256ハッシュを計算。この「デジタル指紋」だけをデータベースに記録することで、作品の改ざんを防ぎ、あなたのプライバシーを保護します。
                </p>
              </div>
            </div>
          </div>

          {/* 未来の武器 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1.5">正当な評価を得るための「武器」</h3>
              <div className="text-muted leading-relaxed space-y-2">
                <p>
                  ProofMarkは単なる保存ツールではありません。納品物に証明書を添える、ポートフォリオにリンクを貼る。
                </p>
                <p>
                  そうした「管理された創作」の証明が、クライアントからの信頼を生み、AI時代の新しい実績証明になると信じています。あなたの情熱を、誰にも否定させないために。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted">
            一緒に、クリエイターが報われる新しい基準を作りませんか？
          </p>
        </div>
      </div>
    </section>
  );
};