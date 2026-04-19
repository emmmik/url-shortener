"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { URLItem } from "@/types";
import { UrlWithFavicon } from "./UrlWithFavicon";
import { toast } from "sonner";

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

function CustomAliasRow({
  short_code,
  custom_alias,
}: Pick<URLItem, "short_code" | "custom_alias"> & {
  onSaveCustomAlias?: (customAlias: string) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [optimisticCustomAlias, setOptimisticCustomAlias] =
    useState(custom_alias);
  const router = useRouter();
  useEffect(() => {
    setOptimisticCustomAlias(custom_alias);
  }, [custom_alias]);

  const display =
    optimisticCustomAlias &&
    optimisticCustomAlias.trim() &&
    optimisticCustomAlias.trim().length > 0
      ? optimisticCustomAlias.trim()
      : "—";

  const cancel = () => {
    setEditing(false);
  };

  const save = async () => {
    if (draft.trim() === custom_alias?.trim()) {
      cancel();
      return;
    }
    if (draft.trim().length < 5 || draft.trim().length > 20) {
      toast.error("Custom alias must be between 5 and 20 characters long", {
        position: "top-center",
      });
      return;
    }
    const previousCustomAlias = optimisticCustomAlias;
    setOptimisticCustomAlias(draft.trim());
    setEditing(false);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/change-custom-alias/${short_code}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ custom_alias: draft.trim() }),
      },
    );
    if (!response.ok) {
      setOptimisticCustomAlias(previousCustomAlias);
      toast.error("Failed to change custom alias", { position: "top-center" });
      return;
    }
    toast.success("Custom alias changed successfully", {
      position: "top-center",
    });
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 gap-1 border-b border-neutral-200 px-5 py-3.5 last:border-b-0 sm:grid-cols-[minmax(10rem,12rem)_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        Custom alias
      </dt>
      <dd className="min-w-0 text-sm font-medium text-black">
        {editing ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancel();
              }}
              aria-label="Custom alias"
              autoComplete="off"
              spellCheck={false}
              className="h-9 max-w-md text-sm"
            />
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none"
                onClick={cancel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-none"
                onClick={() => void save()}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center">
            <span className="min-w-0 break-all mr-2">{display}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="shrink-0 rounded-none text-neutral-600 hover:text-black"
              aria-label="Edit custom alias"
              onClick={() => {
                setDraft((custom_alias ?? "").trim());
                setEditing(true);
              }}
            >
              <Pencil className="size-3.5 stroke-[2.25]" aria-hidden />
            </Button>
          </div>
        )}
      </dd>
    </div>
  );
}

export default function UrlStats({
  id,
  url,
  short_code,
  access_count,
  custom_alias,
  created_at,
  updated_at,
}: URLItem) {
  const router = useRouter();
  return (
    <div className="w-full">
      <header className="mb-4">
        <Button
          type="button"
          variant="ghost"
          aria-label="Go back to previous page"
          className="-ml-2 mb-4 h-auto gap-2 rounded-none px-2 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-black"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4 shrink-0 stroke-[2.25]" aria-hidden />
          Go back
        </Button>
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
          <CustomAliasRow short_code={short_code} custom_alias={custom_alias} />
          <StatRow label="Total clicks" value={String(access_count)} />
          <StatRow label="Created" value={formatDate(created_at)} />
          <StatRow label="Last updated" value={formatDate(updated_at)} />
        </dl>
      </article>
    </div>
  );
}
