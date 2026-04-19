"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { URLItem, URLItemCreate } from "@/types";

interface InjectNewUrlProps {
  injectNewUrl: (url: URLItem) => void;
}
export default function ShortenForm({ injectNewUrl }: InjectNewUrlProps) {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const closeForm = () => {
    setIsOpen(false);
    setUrl("");
    setCustomAlias("");
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(url, customAlias);

    const requestBody: URLItemCreate = {
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
      const data: URLItem = await response.json();
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
      injectNewUrl(data);
      closeForm();
    } catch (error) {
      console.error("Error:", error);
    }
  };
  return (
    <div className="flex w-full flex-col items-stretch gap-3">
      {!isOpen && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 w-full gap-2 rounded-none border-2 border-black bg-white px-4 text-sm font-medium text-black shadow-none hover:bg-neutral-50 hover:text-black sm:w-auto sm:self-start"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="size-4" aria-hidden />
          Add a new link
        </Button>
      )}
      {isOpen && (
        <Card className="w-full overflow-hidden rounded-none border border-black bg-white py-0 shadow-none ring-0">
          <CardHeader className="relative space-y-1 border-b border-black/20 bg-neutral-50 pb-3 pr-11 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 size-8 rounded-none text-neutral-600 hover:bg-white hover:text-black"
              onClick={closeForm}
              aria-label="Close form"
            >
              <X className="size-4" />
            </Button>
            <CardTitle className="text-base font-medium text-black">
              Shorten your URL
            </CardTitle>
            <CardDescription className="text-sm text-neutral-600">
              Create a short and easy to remember URL for your long links.
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-white">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="rounded-none border border-black/80 bg-white p-3 text-sm text-black placeholder:text-neutral-500 focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black"
                placeholder="https://example.com/very/long/path"
                required
              />
              <Input
                type="text"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                className="rounded-none border border-black/80 bg-white p-3 text-sm text-black placeholder:text-neutral-500 focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black"
                placeholder="Custom alias (optional)"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="submit"
                  className="rounded-none border-2 border-black bg-black px-4 text-sm font-medium text-white hover:bg-neutral-900 mb-4"
                >
                  Shorten
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none border border-black/80 bg-white text-sm font-medium text-black hover:bg-neutral-50"
                  onClick={closeForm}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
