#!/usr/bin/env tsx
/**
 * Script to download AI model for dream interpretation
 * 
 * Usage: npm run download-model
 * or: tsx scripts/downloadModel.ts
 * 
 * This downloads a free, public model - NO ACCOUNT NEEDED
 */

import { createModelDownloader } from "node-llama-cpp";
import { fileURLToPath } from "url";
import path from "path";
import { existsSync, mkdirSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDir = path.join(__dirname, '../models');
const modelPath = path.join(modelsDir, 'llama-3.1-8b-q4.gguf');

async function downloadModel() {
  console.log('========================================');
  console.log('AI Model Downloader');
  console.log('========================================');
  console.log('This will download a FREE, PUBLIC model');
  console.log('NO ACCOUNT OR PAYMENT REQUIRED');
  console.log('========================================\n');

  // Ensure models directory exists
  if (!existsSync(modelsDir)) {
    mkdirSync(modelsDir, { recursive: true });
    console.log(`Created directory: ${modelsDir}`);
  }

  if (existsSync(modelPath)) {
    console.log('✓ Model already exists!');
    console.log(`Location: ${modelPath}`);
    console.log('\nTo re-download, delete the file first.');
    return;
  }

  console.log('Downloading Llama 3.1 8B Instruct (Q4_K_M)...');
  console.log('This is a HIGH-QUALITY model for accurate dream interpretations');
  console.log('Size: ~5GB | Download time: 10-30 minutes\n');

  try {
    // Repository: bartowski/Meta-Llama-3.1-8B-Instruct-GGUF
    // File: Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf (4.92GB, recommended)
    const downloader = await createModelDownloader({
      modelUri: 'https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf',
      dirPath: modelsDir,
      fileName: 'llama-3.1-8b-q4.gguf',
      showCliProgress: true,
      onProgress: (status) => {
        const percent = ((status.downloadedSize / status.totalSize) * 100).toFixed(1);
        const downloadedMB = (status.downloadedSize / 1024 / 1024).toFixed(1);
        const totalMB = (status.totalSize / 1024 / 1024).toFixed(1);
        process.stdout.write(`\rDownloading: ${percent}% (${downloadedMB}MB / ${totalMB}MB)`);
      }
    });

    console.log('Starting download...\n');
    const downloadedPath = await downloader.download();
    
    console.log('\n========================================');
    console.log('✓ DOWNLOAD COMPLETE!');
    console.log(`Model saved to: ${downloadedPath}`);
    console.log('========================================');
    console.log('\nYou can now restart your server and the AI will work!');
    console.log('Using Llama 3.1 8B - High quality model for accurate interpretations!');
    
  } catch (error) {
    console.error('\n✗ Download failed:', error);
    console.error('\nManual download instructions:');
    console.error('1. Visit: https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF');
    console.error('2. Click "Files and versions" tab');
    console.error('3. Download: Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf (4.92GB)');
    console.error(`4. Rename to: llama-3.1-8b-q4.gguf`);
    console.error(`5. Place in: ${modelsDir}/`);
    process.exit(1);
  }
}

downloadModel();

