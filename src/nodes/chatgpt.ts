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

    const prompt = `You are an Amazon listing optimization expert. Analyze the following product listings and image analysis data to provide actionable insights.

# Product Listings Data
${JSON.stringify(listingsData, null, 2)}

# Image Analysis Data
${JSON.stringify(imageAnalysisData, null, 2)}

Please provide a comprehensive analysis in the following format:

## Summary
Provide a 2-3 paragraph executive summary of the overall findings.

## Competitive Insights
List 5-7 key competitive insights based on comparing the listings. Include:
- Pricing strategies
- Title optimization patterns
- Bullet point effectiveness
- Review velocity and ratings comparison

## Recommendations
Provide 7-10 specific, actionable recommendations for improving the listings, including:
- Title optimization suggestions
- Bullet point improvements
- Pricing adjustments
- Image quality and content recommendations
- Description enhancements

## Image Quality Analysis
Analyze the image analysis data and provide insights on:
- Overall image quality and professionalism
- Text overlay usage and effectiveness
- Visual consistency across listings
- Opportunities for improvement
- Any concerning moderation flags

Keep your analysis practical, data-driven, and focused on improving conversion rates and sales.`;

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
