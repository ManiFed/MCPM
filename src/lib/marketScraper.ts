import { supabase } from "@/integrations/supabase/client";

export interface MarketScrapeResult {
  probability: number;
  title: string;
  platform: string;
}

export async function scrapeMarketUrl(url: string): Promise<MarketScrapeResult> {
  const { data, error } = await supabase.functions.invoke("scrape-market", {
    body: { url },
  });

  if (error) {
    throw new Error(error.message || "Failed to scrape market URL");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (data?.probability == null) {
    throw new Error("Could not extract probability from that URL");
  }

  return data as MarketScrapeResult;
}
