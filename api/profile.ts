import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const username = req.query.username as string;
  
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const baseUrl = `${protocol}://${host}`;

  try {
    const response = await fetch(`${baseUrl}/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch base HTML, status: ${response.status}`);
    }
    let html = await response.text();

    if (username) {
      const title = `${username} | ProofMark Digital Portfolio`;
      const description = `${username}の制作事実が証明された全作品を公開中。Digital Existence Proven by ProofMark.`;
      const ogImageUrl = `${baseUrl}/api/og?username=${username}`;

      // Replace Title Strings
      html = html.replaceAll(
        'ProofMark | AI作品のデジタル存在証明・無断転載防止サービス',
        title
      );
      html = html.replaceAll(
        'ProofMark | AI作品のデジタル存在証明',
        title
      );

      // Replace Description Strings
      html = html.replaceAll(
        'ブラウザ内で安全にSHA-256ハッシュを計算し、あなたのAI生成作品の制作日時とオリジナルデータを改ざん不能な状態で証明。無断転載や自作発言からクリエイターを守ります。',
        description
      );
      html = html.replaceAll(
        'ブラウザ内で安全にSHA-256ハッシュを計算。あなたのAI作品を無断転載や自作発言から守る、クリエイターのためのデジタル存在証明サービス。',
        description
      );

      // Replace Image OGP URLs
      html = html.replaceAll(
        'https://proofmark.jp/ogp-image.png',
        ogImageUrl
      );
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error: any) {
    console.error('BFF Error:', error.message || error);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(500).send('<html><body><h1>Internal Server Error</h1><p>BFF encountered an error while trying to fetch or process HTML.</p></body></html>');
  }
}
