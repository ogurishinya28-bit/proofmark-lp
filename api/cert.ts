import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  
  // 2. req.headers.host や x-forwarded-proto を用いて自身の baseUrl を構築
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const baseUrl = `${protocol}://${host}`;

  try {
    // 3. Supabaseにアクセスし、該当 id の証明書データを取得
    let cert = null;
    if (id && supabaseUrl && supabaseKey) {
      const { data } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', id)
        .single();
      cert = data;
    }

    // 4. fetch(baseUrl + '/') を実行し、生成済みの index.html を文字列として取得
    const response = await fetch(`${baseUrl}/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch base HTML, status: ${response.status}`);
    }
    let html = await response.text();

    // 5. 文字列の replace メソッドを用いて静的タグを書き換える
    if (cert) {
      const originalName = cert.original_filename || cert.file_name || 'Verified Artwork';
      const title = `ProofMark Certificate: ${originalName}`;
      const description = `This artwork has been verified on ProofMark. SHA-256: ${cert.sha256 || cert.file_hash}`;
      const ogImageUrl = `${baseUrl}/api/og?id=${id}`;

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

    // 6. 書き換えたHTML文字列を返却
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error: any) {
    console.error('BFF Error:', error.message || error);
    // Fallback safely
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(500).send('<html><body><h1>Internal Server Error</h1><p>BFF encountered an error while trying to fetch or process HTML.</p></body></html>');
  }
}
