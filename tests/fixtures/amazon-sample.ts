/**
 * Sample Amazon listing data for testing
 */

export const sampleAmazonHTML = `
<html>
  <body>
    <div id="dp">
      <span id="productTitle">Ultimate Guard Katana Sleeves Standard Size Black (100)</span>
      <div id="feature-bullets">
        <ul class="a-unordered-list">
          <li><span class="a-list-item">Premium quality card sleeves designed for standard size trading cards</span></li>
          <li><span class="a-list-item">Made from acid-free, archival-safe polypropylene material</span></li>
          <li><span class="a-list-item">Crystal clear transparency for perfect card visibility</span></li>
          <li><span class="a-list-item">Secure closure prevents dust and damage</span></li>
          <li><span class="a-list-item">Pack contains 100 sleeves</span></li>
        </ul>
      </div>
      <div id="imageBlock">
        <img src="https://m.media-amazon.com/images/I/71CZ9vJUGxL._AC_UL320_.jpg">
        <img src="https://m.media-amazon.com/images/I/71rR0WKZUSL._AC_UL320_.jpg">
        <img src="https://m.media-amazon.com/images/I/71W8kGsZvfL._AC_UL320_.jpg">
      </div>
    </div>
  </body>
</html>
`;

export const sampleAmazonMarkdown = `
# Ultimate Guard Katana Sleeves Standard Size Black (100)

4.7 out of 5 stars
2,347 ratings

$6.49

* Premium quality card sleeves designed for standard size trading cards
* Made from acid-free, archival-safe polypropylene material
* Crystal clear transparency for perfect card visibility
* Secure closure prevents dust and damage
* Pack contains 100 sleeves

## Product Description

Protect your valuable trading cards with Ultimate Guard Katana Sleeves.
These premium quality sleeves are specifically designed for standard size cards.

![Image](https://m.media-amazon.com/images/I/71CZ9vJUGxL._AC_UL320_.jpg)
![Image](https://m.media-amazon.com/images/I/71rR0WKZUSL._AC_UL320_.jpg)
`;

export const expectedParsedProduct = {
  asin: 'B0TESTSKU',
  title: 'Ultimate Guard Katana Sleeves Standard Size Black (100)',
  price: 6.49,
  rating: 4.7,
  reviewCount: 2347,
  bullets: [
    'Premium quality card sleeves designed for standard size trading cards',
    'Made from acid-free, archival-safe polypropylene material',
    'Crystal clear transparency for perfect card visibility',
    'Secure closure prevents dust and damage',
    'Pack contains 100 sleeves',
  ],
  description: expect.stringContaining('Protect your valuable trading cards'),
  images: [
    {
      url: expect.stringContaining('71CZ9vJUGxL'),
      type: 'main',
      position: 1,
    },
    {
      url: expect.stringContaining('71rR0WKZUSL'),
      type: 'secondary',
      position: 2,
    },
    {
      url: expect.stringContaining('71W8kGsZvfL'),
      type: 'secondary',
      position: 3,
    },
  ],
  parsedAt: expect.any(String),
};

export const sampleFirecrawlResponse = {
  success: true,
  data: {
    markdown: sampleAmazonMarkdown,
    html: sampleAmazonHTML,
    actions: {
      screenshots: ['https://example.com/screenshot.png'],
    },
  },
  creditsUsed: 1,
};

export const sampleScrapedListing = {
  asin: 'B0TESTSKU',
  markdown: sampleAmazonMarkdown,
  html: sampleAmazonHTML,
  screenshotUrl: 'https://example.com/screenshot.png',
  creditsUsed: 1,
  scrapedAt: '2024-01-01T00:00:00.000Z',
};

export const sampleWorkflowState = {
  asins: ['B0TESTSKU', 'B0TEST2'],
  scrapedListings: new Map(),
  imageAnalysis: new Map(),
  errors: [],
};
