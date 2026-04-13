import { VercelRequest, VercelResponse } from '@vercel/node';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { html } from 'satori-html';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // 1. パラメータの取得
        const title = (req.query.title as string) || 'Digital Certificate';
        const thumbUrl = req.query.thumb as string;
        const hash = (req.query.hash as string) || '000000000000';
        const timestamp = (req.query.timestamp as string) || 'N/A';
        const creator = (req.query.creator as string) || 'Anonymous';

        // 2. フォントの読み込み (Node.jsのfsモジュールを使用)
        // ※ public/fonts/NotoSansJP-Bold.ttf が存在することを前提としています
        const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansJP-Bold.ttf');
        let fontData: Buffer;
        try {
            fontData = fs.readFileSync(fontPath);
        } catch (e) {
            console.warn('Font file not found, fallback to system fonts if possible.');
            // 開発環境等でフォントがない場合の緊急用（本来は必須）
            fontData = Buffer.from('');
        }

        // 3. サムネイル画像（WebP等）の処理とBase64化
        let base64Thumb = '';
        if (thumbUrl) {
            try {
                const imageRes = await fetch(thumbUrl);
                const imageBuffer = await imageRes.arrayBuffer();

                // Sharpの力：どんな画像形式（WebP等）が来ても、強制的にPNGに変換し、リサイズする
                const pngBuffer = await sharp(Buffer.from(imageBuffer))
                    .resize(1200, 630, { fit: 'cover' })
                    .png()
                    .toBuffer();

                base64Thumb = `data:image/png;base64,${pngBuffer.toString('base64')}`;
            } catch (err) {
                console.error('Failed to process thumbnail with sharp:', err);
            }
        }

        // 4. Satori用のHTML（JSX不使用、ピュアなHTML文字列）
        const markup = html`
      <div style="height: 100%; width: 100%; display: flex; flex-direction: column; position: relative; background-color: #07061A; font-family: 'Noto Sans JP', sans-serif;">
        
        ${base64Thumb ?
                `<img src="${base64Thumb}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" />` :
                `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: #1C1A38;"></div>`
            }

        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: linear-gradient(to bottom, rgba(13, 11, 36, 0) 0%, rgba(13, 11, 36, 0.4) 40%, rgba(13, 11, 36, 0.95) 80%, rgba(13, 11, 36, 1) 100%);"></div>

        <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; width: 100%; padding: 60px; position: absolute; top: 0; left: 0;">
          
          <div style="display: flex; align-items: center; font-size: 36px; font-weight: 900; color: #F0EFF8;">
            <img src="https://proofmark.jp/apple-touch-icon.png" width="48" height="48" style="border-radius: 12px; margin-right: 12px;" />
            <div style="display: flex;">Proof<span style="color: #00D4AA;">Mark</span></div>
          </div>

          <div style="display: flex; flex-direction: column;">
            
            <div style="display: flex; flex-direction: column; margin-bottom: 24px;">
              <div style="font-size: 64px; font-weight: 900; color: #F0EFF8; text-shadow: 0 4px 20px rgba(0,0,0,0.8); line-height: 1.1; max-width: 1080px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${title}
              </div>
              <div style="font-size: 32px; font-weight: 600; color: #A8A0D8; margin-top: 8px;">
                By ${creator}
              </div>
            </div>

            <div style="display: flex; align-items: center; background: rgba(28, 26, 56, 0.8); border: 1px solid rgba(168, 160, 216, 0.2); border-radius: 16px; padding: 16px 24px; font-size: 22px; color: #A8A0D8;">
              <div style="display: flex; color: #F0EFF8;">[ File ]</div>
              <div style="display: flex; margin: 0 12px; opacity: 0.7;">➔</div>
              <div style="display: flex; color: #6C3EF4;">(SHA-256)</div>
              <div style="display: flex; margin: 0 12px; opacity: 0.7;">➔</div>
              <div style="display: flex; color: #00D4AA; background: rgba(0, 212, 170, 0.1); padding: 2px 8px; border-radius: 4px;">[${hash.substring(0, 12)}...]</div>
              <div style="display: flex; margin: 0 12px; opacity: 0.7;">➔</div>
              <div style="display: flex; color: #6C3EF4;">(RFC3161)</div>
              <div style="display: flex; margin: 0 12px; opacity: 0.7;">➔</div>
              <div style="display: flex; color: #00D4AA; background: rgba(0, 212, 170, 0.1); padding: 2px 8px; border-radius: 4px;">[${timestamp}]</div>
            </div>

          </div>
        </div>
      </div>
    `;

        // 5. SatoriでSVGを生成
        const svg = await satori(markup as any, {
            width: 1200,
            height: 630,
            fonts: [
                {
                    name: 'Noto Sans JP',
                    data: fontData,
                    weight: 700,
                    style: 'normal',
                },
            ],
        });

        // 6. ResvgでSVGをPNGに変換
        const resvg = new Resvg(svg, {
            fitTo: { mode: 'width', value: 1200 },
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        // 7. 生成したPNG画像を返す
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.status(200).send(pngBuffer);

    } catch (e: any) {
        console.error('Failed to generate OGP image:', e);
        return res.status(500).send('Failed to generate the image');
    }
}