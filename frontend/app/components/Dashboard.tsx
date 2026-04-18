"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export interface URLItem {
  id: number;
  url: string;
  short_code: string;
  access_count: number;
  custom_alias?: string;
  created_at: string;
  updated_at: string;
}

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
  }, []);

  return (
    <div className="w-full overflow-x-auto bg-white px-5 pt-5">
      <div className="overflow-hidden rounded-none border border-black/25 bg-white">
        <Table className="w-full table-fixed border-collapse border-0 shadow-none [&_table]:border-collapse">
          <TableHeader className="bg-neutral-50 [&_tr]:border-b [&_tr]:border-black">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-[35%] min-w-0 border-r border-black/80 p-3 text-left text-sm font-medium text-black">
                URL
              </TableHead>
              <TableHead className="w-[25%] min-w-0 border-r border-black/80 p-3 text-left text-sm font-medium text-black">
                Short code
              </TableHead>
              <TableHead className="w-[25%] min-w-0 border-r border-black/80 p-3 text-left text-sm font-medium text-black">
                Custom alias
              </TableHead>
              <TableHead className="w-[15%] min-w-0 p-3 text-right text-sm font-medium text-black">
                Access count
              </TableHead>
            </TableRow>
          </TableHeader>
          {loading ? (
            <TableBody>
              {Array.from({ length: 8 }, (_, i) => (
                <TableRow
                  key={i}
                  className="border-b border-neutral-200 last:border-b-0 hover:bg-neutral-50/80"
                >
                  <TableCell className="min-w-0 border-r border-neutral-200 p-3 text-sm text-black last:border-r-0">
                    <Skeleton className="h-4 w-full max-w-full rounded-none" />
                  </TableCell>
                  <TableCell className="min-w-0 border-r border-neutral-200 p-3 text-sm text-muted-foreground last:border-r-0">
                    <Skeleton className="h-4 w-full max-w-full rounded-none" />
                  </TableCell>
                  <TableCell className="min-w-0 border-r border-neutral-200 p-3 text-sm text-muted-foreground last:border-r-0">
                    <Skeleton className="h-4 w-full max-w-full rounded-none" />
                  </TableCell>
                  <TableCell className="min-w-0 p-3 text-right text-sm tabular-nums text-black">
                    <Skeleton className="ml-auto block h-4 w-8 max-w-full rounded-none" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : (
            <TableBody>
              {urls.map((url) => (
                <TableRow
                  key={url.id}
                  className="border-b border-neutral-200 last:border-b-0 hover:bg-neutral-50/80"
                >
                  <TableCell className="min-w-0 border-r border-neutral-200 p-3 text-sm text-black last:border-r-0">
                    <span className="block break-all">{url.url}</span>
                  </TableCell>
                  <TableCell className="min-w-0 border-r border-neutral-200 p-3 text-sm text-muted-foreground last:border-r-0">
                    {url.short_code}
                  </TableCell>
                  <TableCell className="min-w-0 border-r border-neutral-200 p-3 text-sm text-muted-foreground last:border-r-0">
                    {url.custom_alias ?? "—"}
                  </TableCell>
                  <TableCell className="min-w-0 p-3 text-right text-sm tabular-nums text-black">
                    {url.access_count}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>
    </div>
  );
}
