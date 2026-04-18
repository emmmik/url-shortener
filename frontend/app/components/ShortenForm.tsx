"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface ShortenUrlResponse {
  id: number;
  short_code: string;
  access_count: number;
  custom_alias?: string;
  created_at: string;
  updated_at: string;
}

interface ShortenUrlRequest {
  url: string;
  custom_alias?: string;
}

export default function ShortenForm() {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(url, customAlias);

    const requestBody: ShortenUrlRequest = {
      url,
      custom_alias: customAlias || undefined,
    };
    try {
      const response = await fetch("http://localhost/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data: ShortenUrlResponse = await response.json();
      toast.success("URL shortened successfully", {
        position: "top-center",
        description: `Your short URL is: ${data.short_code}`,
        action: {
          label: "Copy",
          onClick: () => {
            navigator.clipboard.writeText(
              `http://localhost/${data.short_code}`,
            );
            toast.success("Short URL copied to clipboard", {
              position: "top-center",
            });
          },
        },
      });
      console.log(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  return (
    <Card className="w-full max-w-md mx-auto mt-20">
      <CardHeader>
        <CardTitle>Shorten your URL</CardTitle>
        <CardDescription>
          Create a short and easy to remember URL for your long links.
        </CardDescription>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL"
              className="mb-2"
              required
            />
            <Input
              type="text"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              className="mb-2"
              placeholder="Custom alias (optional)"
            />
            <Button type="submit">Shorten</Button>
          </form>
        </CardContent>
      </CardHeader>
    </Card>
  );
}
