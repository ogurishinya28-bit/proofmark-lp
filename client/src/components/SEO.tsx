import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PROOFMARK_COPY } from '../lib/proofmark-copy';

interface SEOProps {
  title: string;
  description?: string;
  type?: string;
  url?: string;
  image?: string;
  canonical?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const DEFAULT_IMAGE = 'https://proofmark.jp/ogp-image.png';
const SITE_URL = 'https://proofmark.jp';
const SITE_NAME = PROOFMARK_COPY.brandShort;

export default function SEO({
  title,
  description,
  type = 'website',
  url,
  image = DEFAULT_IMAGE,
  canonical,
  noIndex = false,
  jsonLd,
}: SEOProps) {
  const safeDescription = description || PROOFMARK_COPY.metaDescription;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const currentUrl =
    url ||
    (typeof window !== 'undefined' ? window.location.href : SITE_URL);
  const canonicalUrl = canonical || currentUrl;

  const jsonLdNodes = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <html lang="ja" />
      <title>{fullTitle}</title>
      <meta name="description" content={safeDescription} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex ? <meta name="robots" content="noindex,nofollow" /> : <meta name="robots" content="index,follow" />}

      {/* OGP */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="ja_JP" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@ProofMark_jp" />
      <meta name="twitter:creator" content="@ProofMark_jp" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={image} />

      {/* Brand */}
      <meta name="theme-color" content="#0D0B24" />

      {/* JSON-LD */}
      {jsonLdNodes.map((node, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(node)}
        </script>
      ))}
    </Helmet>
  );
}
