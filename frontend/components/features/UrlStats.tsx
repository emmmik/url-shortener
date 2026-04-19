"use client";

import { URLItem } from "@/types";
import { UrlWithFavicon } from "./UrlWithFavicon";

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-neutral-200 px-5 py-3.5 last:border-b-0 sm:grid-cols-[minmax(10rem,12rem)_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="break-all text-sm font-medium text-black">{value}</dd>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type UrlStatsProps = {
  item: URLItem;
};

export default function UrlStats({
  id,
  url,
  short_code,
  access_count,
  custom_alias,
  created_at,
  updated_at,
}: URLItem) {
  return (
    <div className="w-full">
      <header className="mb-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Destination
        </p>
        <UrlWithFavicon
          url={url}
          urlTextClassName="min-w-0 flex-1 break-words text-lg font-semibold leading-snug text-black"
        />
      </header>

      <article className="overflow-hidden border-2 border-black bg-white shadow-none">
        <div className="border-b-2 border-black bg-neutral-50 px-5 py-3">
          <h2 className="text-sm font-semibold tracking-tight text-black">
            Link details
          </h2>
          <p className="mt-0.5 text-xs text-neutral-600">ID {id}</p>
        </div>
        <dl>
          <StatRow label="Short code" value={short_code} />
          <StatRow
            label="Custom alias"
            value={custom_alias?.trim() ? custom_alias : "—"}
          />
          <StatRow label="Total clicks" value={String(access_count)} />
          <StatRow label="Created" value={formatDate(created_at)} />
          <StatRow label="Last updated" value={formatDate(updated_at)} />
        </dl>
      </article>
    </div>
  );
}
