/**
 * AWS Rekognition Node - Analyzes product images
 */

import {
  RekognitionClient,
  DetectLabelsCommand,
  DetectTextCommand,
  DetectFacesCommand,
  DetectModerationLabelsCommand,
} from '@aws-sdk/client-rekognition';
import { WorkflowState, RekognitionAnalysis } from '../types/index.js';

async function fetchImageAsBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function analyzeImages(
  state: WorkflowState,
  awsConfig: {
    region: string;
    profile?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  }
): Promise<Partial<WorkflowState>> {
  console.log('🖼️  Analyzing images with AWS Rekognition...');

  // Use profile if available, otherwise use keys
  const clientConfig: any = { region: awsConfig.region };

  if (awsConfig.profile) {
    // When using profile, AWS SDK will automatically load credentials from ~/.aws/credentials
    process.env.AWS_PROFILE = awsConfig.profile;
    console.log(`  Using AWS profile: ${awsConfig.profile}`);
  } else if (awsConfig.accessKeyId && awsConfig.secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
    };
    console.log('  Using AWS access keys');
  }

  const client = new RekognitionClient(clientConfig);

  const imageAnalysis = new Map(state.imageAnalysis);
  const errors = [...state.errors];

  let totalImages = 0;
  for (const listing of state.scrapedListings.values()) {
    totalImages += listing.images.length;
  }

  console.log(`  Analyzing ${totalImages} images from ${state.scrapedListings.size} listings...`);

  let processedImages = 0;

  for (const [asin, listing] of state.scrapedListings.entries()) {
    console.log(`  📦 ${asin}: ${listing.images.length} images`);

    const analysis: RekognitionAnalysis = {
      asin,
      images: [],
    };

    // Analyze up to 5 images per listing (to save on AWS costs)
    const imagesToAnalyze = listing.images.slice(0, 5);

    for (const image of imagesToAnalyze) {
      processedImages++;
      console.log(`    [${processedImages}/${totalImages}] Analyzing ${image.url.substring(0, 60)}...`);

      try {
        const imageBuffer = await fetchImageAsBuffer(image.url);

        // Detect labels
        const labelsCommand = new DetectLabelsCommand({
          Image: { Bytes: imageBuffer },
          MaxLabels: 10,
          MinConfidence: 70,
        });
        const labelsResponse = await client.send(labelsCommand);

        // Detect text
        const textCommand = new DetectTextCommand({
          Image: { Bytes: imageBuffer },
        });
        const textResponse = await client.send(textCommand);

        // Detect faces
        const facesCommand = new DetectFacesCommand({
          Image: { Bytes: imageBuffer },
        });
        const facesResponse = await client.send(facesCommand);

        // Detect moderation labels (inappropriate content)
        const moderationCommand = new DetectModerationLabelsCommand({
          Image: { Bytes: imageBuffer },
          MinConfidence: 60,
        });
        const moderationResponse = await client.send(moderationCommand);

        analysis.images.push({
          url: image.url,
          labels: (labelsResponse.Labels || []).map(label => ({
            name: label.Name || '',
            confidence: label.Confidence || 0,
          })),
          text: (textResponse.TextDetections || [])
            .filter(text => text.Type === 'LINE')
            .map(text => ({
              detectedText: text.DetectedText || '',
              confidence: text.Confidence || 0,
            })),
          faces: facesResponse.FaceDetails?.length || 0,
          moderationLabels: (moderationResponse.ModerationLabels || []).map(label => ({
            name: label.Name || '',
            confidence: label.Confidence || 0,
          })),
        });

        console.log(`      ✅ Found ${labelsResponse.Labels?.length || 0} labels, ${textResponse.TextDetections?.length || 0} text items`);

        // Rate limiting to avoid AWS throttling
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.log(`      ❌ Error: ${error}`);
        errors.push({
          step: 'rekognition',
          asin,
          message: `Image analysis failed: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }

    imageAnalysis.set(asin, analysis);
  }

  console.log(`✅ Analyzed ${processedImages} images for ${imageAnalysis.size} listings`);

  return {
    imageAnalysis,
    errors,
  };
}
