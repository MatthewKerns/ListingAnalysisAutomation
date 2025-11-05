/**
 * ChatGPT Analysis Node - Analyzes scraped data and image analysis results
 */

import { ChatOpenAI } from '@langchain/openai';
import { WorkflowState, AnalysisReport } from '../types/index.js';

export async function analyzeWithGPT(
  state: WorkflowState,
  openaiApiKey: string
): Promise<Partial<WorkflowState>> {
  console.log('🤖 Analyzing data with ChatGPT...');

  try {
    const llm = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.7,
      openAIApiKey: openaiApiKey,
    });

    // Prepare data for analysis
    const listingsData = Array.from(state.scrapedListings.values()).map(listing => ({
      asin: listing.asin,
      title: listing.title,
      price: listing.price,
      rating: listing.rating,
      reviewCount: listing.reviewCount,
      bullets: listing.bullets,
      description: listing.description,
      imageCount: listing.images.length,
    }));

    const imageAnalysisData = Array.from(state.imageAnalysis.values()).map(analysis => ({
      asin: analysis.asin,
      imageInsights: analysis.images.map(img => ({
        labels: img.labels.slice(0, 5).map(l => l.name),
        textFound: img.text?.slice(0, 3).map(t => t.detectedText) || [],
        hasFaces: (img.faces || 0) > 0,
        moderationFlags: img.moderationLabels?.map(l => l.name) || [],
      })),
    }));

    const prompt = `You are an Amazon listing optimization expert specializing in Rufus AI and COSMO optimization. Analyze the following product listings and AWS Rekognition image analysis data to determine:

1. **What Amazon AI Actually Sees** - Based on Rekognition's object/label detection and text recognition
2. **Target Audience Identification** - Who should buy this product based on ALL available signals
3. **Rufus Optimization Opportunities** - How to improve discoverability through Amazon's multimodal AI

# Product Listings Data
${JSON.stringify(listingsData, null, 2)}

# AWS Rekognition Image Analysis
${JSON.stringify(imageAnalysisData, null, 2)}

---

# ANALYSIS FRAMEWORK

## Summary
Provide a 2-3 paragraph executive summary that includes:
- What Amazon's AI (Rekognition + Rufus) actually detects in these listings
- The primary target audience based on visual + textual signals
- Overall optimization opportunities for semantic/intent-driven search

## What Amazon AI Sees in Your Listing
Based on AWS Rekognition analysis, describe:
- **Visual Labels Detected**: Top 5-10 objects/scenes Amazon AI identifies in product images
- **Text in Images**: What text overlays or labels Rekognition detected (critical for Rufus)
- **Visual Context**: Lifestyle/usage scenes vs. product-only shots
- **Multimodal Signals**: How visual content aligns (or conflicts) with text content
- **Missing Visual Signals**: What Amazon AI SHOULD see but doesn't (e.g., usage context, target demographic, key features)

## Target Audience Analysis
Based on ALL data (text + images + Rekognition analysis), identify:
- **Primary Target Demographic**: Age, lifestyle, use case
- **Buyer Intent Signals**: What problems they're solving, why they search for this
- **Visual Persona Match**: Whether images show/suggest the right target audience
- **Semantic Search Alignment**: Keywords + visual context that match how target audience shops
- **Purchase Motivation**: Functional vs. emotional drivers based on visual + textual content

## Competitive Insights
List 5-7 key competitive insights:
- Pricing strategies
- Title optimization for semantic search (not keyword stuffing)
- Bullet point effectiveness and benefit-driven content
- Review velocity and social proof
- Visual differentiation vs. competitors

## Recommendations (Rufus & COSMO Optimized)
Provide 7-10 specific, actionable recommendations:

### Visual Optimization (Rufus Multimodal AI)
- Text overlays to add to images (e.g., "Waterproof up to 50m", "BPA-Free")
- Lifestyle images showing target audience using product
- Missing visual context Amazon AI should detect

### Content Optimization (Semantic Search)
- Noun Phrase Optimization (NPO): Structured, benefit-driven descriptions
- Intent-driven bullet points (why people buy, not just features)
- Q&A opportunities to answer Rufus queries

### Backend Attribute Enrichment
- Structured attributes for facet search visibility
- Unstructured enrichment for semantic matching
- Recommended attribute fields to complete

## Image Quality Analysis
Deep dive on visual content:
- **Text Overlays**: Current usage and recommendations for Visual Label Tagging (VLT)
- **Rekognition Confidence Scores**: Image clarity and object recognition quality
- **Visual Consistency**: Across main, secondary, and A+ content images
- **Moderation Flags**: Any concerning labels detected
- **Optimization Priority**: Which images to replace/enhance first

---

Keep your analysis practical, data-driven, and focused on:
1. **What Amazon AI actually sees** (based on Rekognition data)
2. **Who should buy this** (target audience from all signals)
3. **How to optimize for Rufus** (multimodal semantic search)

Remember: Rufus uses text + images + metadata. Your recommendations should leverage all three signals.`;

    console.log('  Sending analysis request to GPT-4...');
    const response = await llm.invoke(prompt);

    const analysisText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    // Parse the response into structured sections
    const sections = {
      summary: extractSection(analysisText, 'Summary'),
      competitiveInsights: extractListItems(analysisText, 'Competitive Insights'),
      recommendations: extractListItems(analysisText, 'Recommendations'),
      imageQualityAnalysis: extractSection(analysisText, 'Image Quality Analysis'),
    };

    const report: AnalysisReport = {
      summary: sections.summary || analysisText.substring(0, 500),
      competitiveInsights: sections.competitiveInsights,
      recommendations: sections.recommendations,
      imageQualityAnalysis: sections.imageQualityAnalysis || 'No image analysis available',
      generatedAt: new Date().toISOString(),
    };

    console.log('✅ Analysis completed');
    console.log(`  - ${report.competitiveInsights.length} competitive insights`);
    console.log(`  - ${report.recommendations.length} recommendations`);

    return {
      gptAnalysis: report,
    };

  } catch (error) {
    console.error('❌ ChatGPT analysis failed:', error);
    return {
      errors: [
        ...state.errors,
        {
          step: 'chatgpt',
          message: error instanceof Error ? error.message : String(error)
        }
      ]
    };
  }
}

function extractSection(text: string, sectionName: string): string {
  const regex = new RegExp(`##\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function extractListItems(text: string, sectionName: string): string[] {
  const section = extractSection(text, sectionName);
  if (!section) return [];

  const items = section
    .split('\n')
    .filter(line => line.trim().match(/^[-*\d.]/))
    .map(line => line.replace(/^[-*\d.]\s*/, '').trim())
    .filter(line => line.length > 10);

  return items;
}
