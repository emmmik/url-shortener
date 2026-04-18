"use client";

import { useState } from "react";

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
  const [result, setResult] = useState<ShortenUrlResponse | null>(null);

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
        throw new Error("Failed to shorten URL");
      }
      const data: ShortenUrlResponse = await response.json();
      setResult(data);
      console.log(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL"
        required
      />
      <input
        type="text"
        value={customAlias}
        onChange={(e) => setCustomAlias(e.target.value)}
        placeholder="Custom alias (optional)"
      />
      <button type="submit">Shorten</button>
    </form>
  );
}
