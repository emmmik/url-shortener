"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { UrlTableProps } from "@/types";
import { UrlWithFavicon } from "./UrlWithFavicon";
import { cn } from "@/lib/utils";

/** Page numbers and gaps for shadcn-style pagination when there are many pages */
function paginationSlots(
  current: number,
  last: number,
): (number | "ellipsis")[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  const out: (number | "ellipsis")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(last - 1, current + 1);
  if (left > 2) out.push("ellipsis");
  for (let p = left; p <= right; p++) out.push(p);
  if (right < last - 1) out.push("ellipsis");
  out.push(last);
  return out;
}

export default function UrlTable({
  urls,
  loading,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: UrlTableProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min(page * pageSize, total);
  const slots = totalPages > 0 ? paginationSlots(page, totalPages) : [];

  return (
    <>
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
                  <UrlWithFavicon url={url.url} />
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
      {!loading && totalPages > 1 && (
        <Pagination className="border-t border-neutral-200">
          <PaginationContent className="flex w-full flex-wrap items-center justify-between gap-0.5 px-3 py-2.5">
            <PaginationItem className="mr-auto basis-full sm:basis-auto">
              <span className="inline-block px-1 text-sm text-neutral-700">
                {from}–{to} of {total}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                className={cn(
                  "rounded-none",
                  page <= 1 && "pointer-events-none opacity-40",
                )}
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) onPageChange(page - 1);
                }}
              />
            </PaginationItem>
            {slots.map((slot, i) =>
              slot === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={slot}>
                  <PaginationLink
                    href="#"
                    isActive={slot === page}
                    className="rounded-none"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(slot);
                    }}
                  >
                    {slot}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                className={cn(
                  "rounded-none",
                  page >= totalPages && "pointer-events-none opacity-40",
                )}
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) onPageChange(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
}
