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

      // Title
      if (html.match(/<title>.*?<\/title>/i)) {
        html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
      } else {
        html = html.replace('</head>', `  <title>${title}</title>\n</head>`);
      }
      
      // OG Title
      if (html.match(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i)) {
        html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i, `<meta property="og:title" content="${title}" />`);
      } else {
        html = html.replace('</head>', `  <meta property="og:title" content="${title}" />\n</head>`);
      }

      // OG Description
      if (html.match(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i)) {
        html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, `<meta property="og:description" content="${description}" />`);
      } else {
        html = html.replace('</head>', `  <meta property="og:description" content="${description}" />\n</head>`);
      }
      
      // OG Image
      if (html.match(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/i)) {
        html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/i, `<meta property="og:image" content="${ogImageUrl}" />`);
      } else {
        html = html.replace('</head>', `  <meta property="og:image" content="${ogImageUrl}" />\n</head>`);
      }

      // Twitter Card tags
      if (html.match(/<meta\s+name="twitter:card"\s+content=".*?"\s*\/?>/i)) {
        html = html.replace(/<meta\s+name="twitter:card"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:card" content="summary_large_image" />`);
      } else {
        html = html.replace('</head>', `  <meta name="twitter:card" content="summary_large_image" />\n</head>`);
      }

      if (html.match(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i)) {
        html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${title}" />`);
      } else {
        html = html.replace('</head>', `  <meta name="twitter:title" content="${title}" />\n</head>`);
      }

      if (html.match(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i)) {
        html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${description}" />`);
      } else {
        html = html.replace('</head>', `  <meta name="twitter:description" content="${description}" />\n</head>`);
      }

      if (html.match(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i)) {
        html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:image" content="${ogImageUrl}" />`);
      } else {
        html = html.replace('</head>', `  <meta name="twitter:image" content="${ogImageUrl}" />\n</head>`);
      }
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
