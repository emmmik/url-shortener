"use client";

import { useState, useEffect } from "react";

import UrlTable from "./UrlTable";
import ShortenForm from "./ShortenForm";
import { URLItem } from "@/types";

export default function Dashboard() {
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const response = await fetch("http://localhost/get-all-urls");
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        const data: URLItem[] = await response.json();
        setUrls(data);
      } catch (error) {
        console.error("Error fetching URLs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUrls();
  }, [urls.length]);

  const injectNewUrl = (url: URLItem) => {
    setUrls([...urls, url]);
  };

  return (
    <div className="w-full overflow-x-auto bg-white px-5 pt-5">
      <div className="overflow-hidden rounded-none border border-black/25 bg-white">
        <UrlTable urls={urls} loading={loading} />
      </div>
      <div className="bg-white pb-5 pt-3">
        <ShortenForm injectNewUrl={injectNewUrl} />
      </div>
    </div>
  );
}
