import { notFound } from "next/navigation";
import UrlStats from "@/components/features/UrlStats";
import type { URLItem, URLStatsProps } from "@/types";

export default async function LinkStatsPage({ params }: URLStatsProps) {
  const { id } = await params;
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/${id}/stats`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    return notFound();
  }

  const data = (await response.json()) as URLItem;

  return (
    <div className="mx-auto my-12 w-full max-w-3xl px-4">
      <UrlStats
        id={data.id}
        url={data.url}
        short_code={data.short_code}
        access_count={data.access_count}
        custom_alias={data.custom_alias}
        created_at={data.created_at}
        updated_at={data.updated_at}
      />
    </div>
  );
}
