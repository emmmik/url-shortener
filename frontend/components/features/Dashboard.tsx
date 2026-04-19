"use client";

import { useState, useEffect, useMemo } from "react";

import UrlTable from "./UrlTable";
import ShortenForm from "./ShortenForm";
import { URLItem } from "@/types";

const PAGE_SIZE = 12;

export default function Dashboard() {
  const [allUrls, setAllUrls] = useState<URLItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/get-all-urls`,
        );
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        const data: URLItem[] = await response.json();
        const sorted = [...data].sort((a, b) => b.id - a.id);
        setAllUrls(sorted);
      } catch (error) {
        console.error("Error fetching URLs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUrls();
  }, []);

  const total = allUrls.length;
  const totalPages =
    total === 0 ? 0 : Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pagedUrls = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return allUrls.slice(start, start + PAGE_SIZE);
  }, [allUrls, page]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const injectNewUrl = (url: URLItem) => {
    setAllUrls((prev) => [url, ...prev]);
    setPage(1);
  };

  return (
    <div className="w-full overflow-x-auto bg-white px-5 pt-5">
      <div className="overflow-hidden rounded-none border border-black/25 bg-white">
        <UrlTable
          urls={pagedUrls}
          loading={loading}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
      <div className="bg-white pb-5 pt-3">
        <ShortenForm injectNewUrl={injectNewUrl} />
      </div>
    </div>
  );
}
