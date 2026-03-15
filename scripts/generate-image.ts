/**
 * Generate images using fal.ai FLUX.2 Pro
 *
 * Usage:
 *   FAL_KEY=your-key npx tsx scripts/generate-image.ts --prompt "a woman standing" --out public/images/test.png
 *   FAL_KEY=your-key npx tsx scripts/generate-image.ts --prompt "..." --size square_hd --format png --out output.png
 *
 * Options:
 *   --prompt   Text prompt (required)
 *   --out      Output file path (required)
 *   --size     Image size: square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9 (default: square_hd)
 *   --format   Output format: png, jpeg (default: png)
 *   --seed     Seed for reproducibility (optional)
 *   --safety   Safety tolerance 1-5, 1=strictest (default: 2)
 */

import { fal } from "@fal-ai/client";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

// Parse args
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const prompt = getArg("prompt");
const out = getArg("out");
const size = getArg("size") || "square_hd";
const format = getArg("format") || "png";
const seed = getArg("seed") ? parseInt(getArg("seed")!) : undefined;
const safety = getArg("safety") || "2";

if (!prompt || !out) {
  console.error("Usage: FAL_KEY=... npx tsx scripts/generate-image.ts --prompt \"...\" --out path/to/image.png");
  process.exit(1);
}

if (!process.env.FAL_KEY) {
  console.error("Error: FAL_KEY environment variable is required.");
  console.error("Get your key at https://fal.ai/dashboard/keys");
  process.exit(1);
}

fal.config({ credentials: process.env.FAL_KEY });

async function generate() {
  console.log(`Generating image with FLUX.2 Pro...`);
  console.log(`  Prompt: ${prompt}`);
  console.log(`  Size: ${size}, Format: ${format}${seed !== undefined ? `, Seed: ${seed}` : ""}`);

  const result = await fal.subscribe("fal-ai/flux-2-pro", {
    input: {
      prompt,
      image_size: size as any,
      output_format: format,
      safety_tolerance: safety,
      enable_safety_checker: false,
      ...(seed !== undefined && { seed }),
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_QUEUE") {
        console.log(`  Queue position: ${update.queue_position}`);
      } else if (update.status === "IN_PROGRESS") {
        console.log(`  Generating...`);
      }
    },
  });

  const imageUrl = result.data.images?.[0]?.url;
  if (!imageUrl) {
    console.error("No image returned from API");
    process.exit(1);
  }

  console.log(`  Downloading from: ${imageUrl}`);

  const response = await fetch(imageUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  mkdirSync(dirname(out!), { recursive: true });
  writeFileSync(out!, buffer);

  console.log(`  Saved to: ${out} (${(buffer.length / 1024).toFixed(1)} KB)`);
  if (result.data.seed) {
    console.log(`  Seed: ${result.data.seed} (use --seed ${result.data.seed} to reproduce)`);
  }
}

generate().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
