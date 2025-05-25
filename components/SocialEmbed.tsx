"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { isValidVideoUrl } from "@/lib/utils";

interface SocialEmbedProps {
  url: string;
}

export function SocialEmbed({ url }: SocialEmbedProps) {
  const [embedHtml, setEmbedHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !isValidVideoUrl(url)) {
      setError("Invalid URL");
      setLoading(false);
      return;
    }

    const fetchOembed = async () => {
      try {
        setLoading(true);
        setError(null);

        let oembedUrl: string;

        if (url.includes("tiktok.com")) {
          oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(
            url
          )}`;
        } else if (url.includes("instagram.com")) {
          oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(
            url
          )}`;
        } else {
          throw new Error("Unsupported URL");
        }

        const response = await fetch(oembedUrl);
        if (!response.ok) throw new Error("Failed to load embed");

        const data = await response.json();
        setEmbedHtml(data.html);
      } catch (error) {
        console.error("Error loading embed:", error);
        setError("Could not load content");
      } finally {
        setLoading(false);
      }
    };

    fetchOembed();
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-muted animate-pulse">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-muted">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <>
      {url.includes("tiktok.com") && (
        <Script src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />
      )}
      {url.includes("instagram.com") && (
        <Script
          src="https://www.instagram.com/embed.js"
          strategy="lazyOnload"
        />
      )}
      <div
        className="social-embed"
        dangerouslySetInnerHTML={{ __html: embedHtml }}
      />
    </>
  );
}
