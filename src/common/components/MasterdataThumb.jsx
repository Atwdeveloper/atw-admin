"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";

// Masterdata list endpoints always return imageUrl: null — only the single-item
// GET returns a (~15 min) signed URL. This thumbnail fetches it per row and
// caches it for 10 minutes so paging back and forth doesn't refetch.
const TTL_MS = 10 * 60 * 1000;
const cache = new Map(); // key -> { url, at } | Promise

const load = (key, fetcher) => {
  const hit = cache.get(key);
  if (hit instanceof Promise) return hit;
  if (hit && Date.now() - hit.at < TTL_MS) return Promise.resolve(hit.url);
  const p = fetcher()
    .then((item) => {
      const url = item?.imageUrl || null;
      cache.set(key, { url, at: Date.now() });
      return url;
    })
    .catch(() => {
      cache.delete(key);
      return null;
    });
  cache.set(key, p);
  return p;
};

// Call after an image is uploaded/removed so the list picks up the change.
export const invalidateMasterdataThumb = (kind, id) => cache.delete(`${kind}:${id}`);

const MasterdataThumb = ({ kind, id, fetcher, alt, url: givenUrl, version }) => {
  const [url, setUrl] = useState(givenUrl || null);

  useEffect(() => {
    if (givenUrl) {
      setUrl(givenUrl);
      return;
    }
    if (!id || !fetcher) return;
    let cancelled = false;
    load(`${kind}:${id}`, () => fetcher(id)).then((u) => !cancelled && setUrl(u));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, id, givenUrl, version]);

  return (
    <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200">
      {url ? (
        <img
          src={url}
          alt={alt || ""}
          className="w-full h-full object-cover"
          onError={() => {
            // Signed URL expired or broken — show the placeholder; the next mount refetches.
            cache.delete(`${kind}:${id}`);
            setUrl(null);
          }}
        />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default MasterdataThumb;
