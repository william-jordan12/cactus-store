import { useEffect } from "react";

interface SeoOpts {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
}

const BASE = "https://peyoteseedsvault.com";

export function useSeo({ title, description, canonical, ogImage }: SeoOpts) {
  useEffect(() => {
    const fullTitle = `${title} | Peyote Seeds Farm`;
    document.title = fullTitle;

    setMeta("description", description);
    setMeta("og:title", fullTitle);
    setMeta("og:description", description);
    setMeta("og:url", canonical ? `${BASE}${canonical}` : BASE);
    if (ogImage) setMeta("og:image", ogImage);

    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    if (ogImage) setMeta("twitter:image", ogImage);

    const canonicalUrl = canonical ? `${BASE}${canonical}` : BASE;
    let linkEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!linkEl) {
      linkEl = document.createElement("link");
      linkEl.rel = "canonical";
      document.head.appendChild(linkEl);
    }
    linkEl.href = canonicalUrl;
  }, [title, description, canonical, ogImage]);
}

function setMeta(name: string, content: string) {
  const isOg = name.startsWith("og:");
  const attr = isOg ? "property" : "name";
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

/**
 * Inject (or replace) a JSON-LD structured-data block into <head>.
 * Each key manages a single script tag, so navigation between pages
 * swaps schemas cleanly. Pass null to remove the block.
 */
export function useJsonLd(key: string, schema: object | null) {
  useEffect(() => {
    const id = `jsonld-${key}`;
    document.getElementById(id)?.remove();
    if (!schema) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, [key, schema]);
}
