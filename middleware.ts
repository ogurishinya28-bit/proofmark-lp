import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: '/cert/:path*',
};

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const certId = url.pathname.split('/').pop();

  if (!certId) {
    return NextResponse.next();
  }

  try {
    // 1. ベースとなるHTML（SPAのindex.html）を取得
    // originのリクエストはmatcherにより本ミドルウェアをスキップするため無限ループにはならない
    const response = await fetch(url.origin);
    let html = await response.text();

    // 2. 動的OGP画像APIのURLを生成
    const ogImageUrl = `${url.origin}/api/og?id=${certId}`;

    // 3. メタタグを構築
    const metaTags = `
<meta property="og:title" content="ProofMark | Certificate of Authenticity" />
<meta property="og:image" content="${ogImageUrl}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${ogImageUrl}" />
    `;

    // 4. </head> の直前にメタタグを注入
    html = html.replace('</head>', `${metaTags}</head>`);

    // 5. 書き換えたHTMLを返却
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    });
  } catch (error) {
    console.error('Middleware OGP Injection Error:', error);
    return NextResponse.next();
  }
}
