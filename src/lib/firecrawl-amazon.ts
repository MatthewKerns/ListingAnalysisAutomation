/**
 * Firecrawl Amazon Scraper - Shared Utility
 *
 * Reusable module for scraping and parsing Amazon product listings.
 * NO external dependencies - pure data transformation.
 *
 * Usage:
 *   import { scrapeAmazonListing, parseAmazonListing } from './lib/firecrawl-amazon';
 *
 *   const scraped = await scrapeAmazonListing('B0CJBQ7F5C', apiKey);
 *   const parsed = await parseAmazonListing(scraped.markdown, scraped.html, 'B0CJBQ7F5C');
 */

export interface ScrapedAmazonListing {
  asin: string;
  markdown: string;
  html: string;
  screenshotUrl?: string;
  creditsUsed: number;
  scrapedAt: string;
}

export interface ParsedAmazonProduct {
  asin: string;
  title: string;
  price: number;
  rating: number;
  reviewCount: number;
  bullets: string[];
  description: string;
  images: Array<{
    url: string;
    type: 'main' | 'secondary';
    position: number;
  }>;
  parsedAt: string;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedAmazonProduct;
  error?: string;
}

/**
 * Scrape Amazon listing using Firecrawl API
 */
export async function scrapeAmazonListing(
  asin: string,
  firecrawlApiKey: string
): Promise<ScrapedAmazonListing | null> {
  const amazonUrl = `https://www.amazon.com/dp/${asin}`;

  try {
    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: amazonUrl,
        formats: ["markdown", "html"],
        actions: [
          { type: "wait", milliseconds: 3000 },
          { type: "screenshot", fullPage: true }
        ],
        onlyMainContent: false,
        timeout: 30000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Firecrawl API error (${response.status}):`, errorText);
      return null;
    }

    const data: any = await response.json();
    const responseData = data.data;

    if (!responseData?.markdown || !responseData?.html) {
      console.error("Missing markdown or HTML in Firecrawl response");
      return null;
    }

    return {
      asin,
      markdown: responseData.markdown,
      html: responseData.html,
      screenshotUrl: responseData.actions?.screenshots?.[0],
      creditsUsed: data.creditsUsed || 1,
      scrapedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error("Firecrawl scrape error:", error);
    return null;
  }
}

/**
 * Parse Amazon listing HTML/Markdown into structured product data
 */
export async function parseAmazonListing(
  markdown: string,
  html: string,
  asin: string
): Promise<ParseResult> {
  try {
    // ====================================================================
    // Extract Title
    // ====================================================================
    let title = "";

    // PRIORITY 1: HTML productTitle (most reliable)
    const htmlTitleMatch = html.match(/<span[^>]*id="productTitle"[^>]*>([^<]+)<\/span>/i);
    if (htmlTitleMatch) {
      title = htmlTitleMatch[1].trim();
    }

    // PRIORITY 2: Markdown heading (skip accessibility)
    if (!title) {
      const markdownHeadings = markdown.match(/^#\s+(.+)$/gm);
      if (markdownHeadings) {
        const accessibilityKeywords = [
          "Product summary", "Keyboard shortcut", "Skip to main content",
          "Navigation", "Menu",
        ];

        for (const heading of markdownHeadings) {
          const headingText = heading.replace(/^#\s+/, "").trim();
          const isAccessibility = accessibilityKeywords.some(k => headingText.includes(k));

          if (!isAccessibility && headingText.length > 50) {
            title = headingText;
            break;
          }
        }
      }
    }

    // PRIORITY 3: First long line
    if (!title) {
      const lines = markdown.split("\n").filter(line => line.trim().length > 50);
      title = lines[0]?.trim() || "Unknown Title";
    }

    // ====================================================================
    // Extract Price
    // ====================================================================
    let price = 0;
    const pricePatterns = [
      /\$(\d+\.\d{2})/,
      /Price:\s*\$(\d+\.\d{2})/i,
      /(\d+\.\d{2})\s*USD/i,
    ];

    for (const pattern of pricePatterns) {
      const priceMatch = markdown.match(pattern);
      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
        break;
      }
    }

    // ====================================================================
    // Extract Rating
    // ====================================================================
    let rating = 0;
    const ratingPatterns = [
      /(\d+\.\d+)\s*out\s*of\s*5\s*stars/i,
      /(\d+\.\d+)\s*★/,
      /(\d+\.\d+)\s*stars/i,
    ];

    for (const pattern of ratingPatterns) {
      const ratingMatch = markdown.match(pattern);
      if (ratingMatch) {
        rating = parseFloat(ratingMatch[1]);
        break;
      }
    }

    // ====================================================================
    // Extract Review Count
    // ====================================================================
    let reviewCount = 0;
    const reviewPatterns = [
      /(\d{1,3}(?:,\d{3})*)\s*ratings/i,
      /(\d{1,3}(?:,\d{3})*)\s*reviews/i,
      /(\d+)\s*customer\s*reviews/i,
    ];

    for (const pattern of reviewPatterns) {
      const reviewMatch = markdown.match(pattern);
      if (reviewMatch) {
        reviewCount = parseInt(reviewMatch[1].replace(/,/g, ""));
        break;
      }
    }

    // ====================================================================
    // Extract Bullet Points
    // ====================================================================
    const bullets: string[] = [];

    // PRIORITY 1: HTML feature-bullets
    const featureBulletsMatch = html.match(
      /<div[^>]*id="feature-bullets"[^>]*>([\s\S]*?)<\/div>/i
    );

    if (featureBulletsMatch) {
      const bulletsSection = featureBulletsMatch[1];
      const htmlBullets = bulletsSection.match(/<span[^>]*class="a-list-item"[^>]*>([\s\S]*?)<\/span>/gi);

      if (htmlBullets) {
        htmlBullets.forEach(bullet => {
          const cleaned = bullet
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim();

          if (cleaned.length > 20 && cleaned.length < 500) {
            bullets.push(cleaned);
          }
        });
      }
    }

    // PRIORITY 2: Markdown bullets with filtering
    if (bullets.length === 0) {
      const markdownBullets = markdown.match(/^[\*\-]\s+(.+)$/gm);
      if (markdownBullets) {
        const excludePatterns = [
          /^Customer Questions/i,
          /^Product Details/i,
          /^Technical Details/i,
          /^Additional Information/i,
          /^See more product details/i,
          /^\d+\.\d+\s*out of/i,
          /^Reviewed in/i,
          /^Read more$/i,
          /^Show more$/i,
        ];

        markdownBullets.forEach(bullet => {
          const cleaned = bullet.replace(/^[\*\-]\s+/, "").trim();
          const shouldExclude = excludePatterns.some(pattern => pattern.test(cleaned));

          if (!shouldExclude && cleaned.length > 20 && cleaned.length < 500) {
            bullets.push(cleaned);
          }
        });
      }
    }

    // ====================================================================
    // Extract Description
    // ====================================================================
    let description = "";
    const descriptionMatch = markdown.match(/(?:Product Description|Description|About this item)[:\s]*\n+((?:.+\n?)+)/i);
    if (descriptionMatch) {
      description = descriptionMatch[1].trim().substring(0, 2000);
    }

    // ====================================================================
    // Extract Images
    // ====================================================================
    const images: Array<{ url: string; type: 'main' | 'secondary'; position: number }> = [];
    const imageBaseIds = new Map<string, string>();

    // PRIORITY 1: imageBlock section
    const imageBlockMatch = html.match(
      /<div[^>]*id="imageBlock"[^>]*>([\s\S]*?)<\/div>/i
    );

    if (imageBlockMatch) {
      const imageSection = imageBlockMatch[1];
      const imagePattern = /https:\/\/m\.media-amazon\.com\/images\/I\/([A-Za-z0-9\+_-]+)\./g;
      const matches = imageSection.matchAll(imagePattern);

      for (const match of matches) {
        const fullUrl = match[0];
        const baseId = match[1];

        if (!imageBaseIds.has(baseId)) {
          imageBaseIds.set(baseId, fullUrl);
        }
      }
    }

    // PRIORITY 2: Fallback to all images
    if (imageBaseIds.size === 0) {
      const imagePattern = /https:\/\/m\.media-amazon\.com\/images\/I\/([A-Za-z0-9\+_-]+)\./g;
      const markdownMatches = markdown.matchAll(imagePattern);
      const htmlMatches = html.matchAll(imagePattern);

      for (const match of markdownMatches) {
        const fullUrl = match[0];
        const baseId = match[1];
        if (!imageBaseIds.has(baseId)) {
          imageBaseIds.set(baseId, fullUrl);
        }
      }

      for (const match of htmlMatches) {
        const fullUrl = match[0];
        const baseId = match[1];
        if (!imageBaseIds.has(baseId)) {
          imageBaseIds.set(baseId, fullUrl);
        }
      }
    }

    // Convert to high-res URLs (limit to 15)
    const imageUrls = Array.from(imageBaseIds.values()).slice(0, 15);
    imageUrls.forEach((url, index) => {
      const highResUrl = url.replace(/\._[A-Z0-9_]+\./, "._AC_SL1500_.");
      images.push({
        url: highResUrl,
        type: index === 0 ? "main" : "secondary",
        position: index + 1,
      });
    });

    // ====================================================================
    // Return Parsed Data
    // ====================================================================
    return {
      success: true,
      data: {
        asin,
        title,
        price,
        rating,
        reviewCount,
        bullets: bullets.slice(0, 10),
        description,
        images,
        parsedAt: new Date().toISOString(),
      },
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Scrape and parse in one call (convenience method)
 */
export async function scrapeAndParseAmazon(
  asin: string,
  firecrawlApiKey: string
): Promise<ParseResult> {
  const scraped = await scrapeAmazonListing(asin, firecrawlApiKey);

  if (!scraped) {
    return {
      success: false,
      error: "Failed to scrape Amazon listing",
    };
  }

  return parseAmazonListing(scraped.markdown, scraped.html, asin);
}
