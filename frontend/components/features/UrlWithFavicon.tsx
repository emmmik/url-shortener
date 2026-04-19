"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import Image from "next/image";

function getHostname(urlString: string): string | null {
  try {
    const normalized = /^https?:\/\//i.test(urlString)
      ? urlString
      : `https://${urlString}`;
    const u = new URL(normalized);
    return u.hostname || null;
  } catch {
    return null;
  }
}

const iconShell =
  "flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted/40 shadow-sm ring-1 ring-black/[0.06] dark:ring-white/10";

export function UrlWithFavicon({ url }: { url: string }) {
  const hostname = getHostname(url);
  const [iconFailed, setIconFailed] = useState(false);

  if (!hostname) {
    return (
      <span className="flex min-w-0 items-center gap-2.5" title={url}>
        <span className={iconShell}>
          <Globe className="size-3 text-muted-foreground" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate">{url}</span>
      </span>
    );
  }

  const faviconSrc = `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(hostname)}`;

  return (
    <span className="flex min-w-0 items-center gap-2.5" title={url}>
      {!iconFailed ? (
        <span className={iconShell}>
          <Image
            src={faviconSrc}
            alt=""
            width={16}
            height={16}
            className="size-4 object-cover"
            loading="lazy"
            onError={() => setIconFailed(true)}
          />
        </span>
      ) : (
        <span className={iconShell}>
          <Globe className="size-3 text-muted-foreground" aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{url}</span>
    </span>
  );
}
