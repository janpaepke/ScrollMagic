/**
 * Converts HTML animation files to GIF using Playwright + gifenc + pngjs.
 *
 * Usage:
 *   npm run export-diagrams                        # export all diagrams
 *   node scripts/export-diagrams.mjs intersect    # export only intersect.gif
 *   node scripts/export-diagrams.mjs contain      # export only contain.gif
 *
 * Options (env vars):
 *   FPS=15        frames per second (default: 15)
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import pkg from 'pngjs';
const { PNG } = pkg;
import gifenc from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifenc;

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, '..', 'docs', 'diagrams');
const outDir = resolve(__dirname, '..', 'docs', 'dist', 'gfx');

const diagrams = {
	intersect: resolve(srcDir, 'intersect.html'),
	contain: resolve(srcDir, 'contain.html'),
};

const fps = parseInt(process.env.FPS || '15', 10);

async function exportDiagram(name, htmlPath) {
	console.log(`\n--- Exporting ${name} ---`);
	console.log(`  Source: ${htmlPath}`);

	const browser = await chromium.launch();
	const page = await browser.newPage();

	// Set viewport large enough to contain the stage (170+260+80=510 wide, 120+174+120=414 tall)
	await page.setViewportSize({ width: 540, height: 450 });

	await page.goto(`file://${htmlPath}`, { waitUntil: 'domcontentloaded' });

	// Wait for animations to start
	await page.waitForFunction(() => document.getAnimations().length > 0);

	// Get animation duration and detect all animations
	const animInfo = await page.evaluate(() => {
		const animations = document.getAnimations();
		const durations = animations.map(a => {
			const timing = a.effect.getComputedTiming();
			return timing.duration + timing.delay;
		});
		return {
			count: animations.length,
			duration: Math.max(...durations),
		};
	});

	console.log(`  Animations: ${animInfo.count}, duration: ${animInfo.duration}ms`);
	console.log(`  FPS: ${fps}`);

	const duration = animInfo.duration;
	const frameCount = Math.ceil((duration / 1000) * fps);
	const frameDelay = Math.round(1000 / fps); // ms per frame for GIF

	console.log(`  Frames: ${frameCount}, delay: ${frameDelay}ms`);

	// Pause all animations at time 0 and kill the rAF-based text loop
	await page.evaluate(() => {
		document.getAnimations().forEach(a => {
			a.pause();
			a.currentTime = 0;
		});
		// Override rAF so the HTML's live-preview loop can't overwrite text
		window.requestAnimationFrame = () => 0;
	});

	// Determine tight bounding box of the .stage element
	const stageBox = await page.evaluate(() => {
		const stage = document.querySelector('.stage');
		const rect = stage.getBoundingClientRect();
		return {
			x: Math.round(rect.x),
			y: Math.round(rect.y),
			width: Math.round(rect.width),
			height: Math.round(rect.height),
		};
	});

	console.log(`  Stage bounds: ${stageBox.width}x${stageBox.height} at (${stageBox.x}, ${stageBox.y})`);

	const gif = GIFEncoder();
	let width, height;

	for (let i = 0; i < frameCount; i++) {
		const time = (i / frameCount) * duration;

		// Seek all animations to this time
		await page.evaluate(t => {
			document.getAnimations().forEach(a => {
				a.currentTime = t;
			});
		}, time);

		// Update the JS-driven progress counter via the page's own getProgress()
		await page.evaluate(
			({ t, dur }) => {
				const el = document.querySelector('.progress-counter');
				if (el && typeof window.getProgress === 'function') {
					el.textContent = window.getProgress(t / dur) + '%';
				}
			},
			{ t: time, dur: duration }
		);

		// Take screenshot of just the stage area
		const pngBuffer = await page.screenshot({
			clip: stageBox,
			type: 'png',
		});

		const png = PNG.sync.read(pngBuffer);
		if (i === 0) {
			width = png.width;
			height = png.height;
		}

		const palette = quantize(png.data, 256);
		const index = applyPalette(png.data, palette);
		gif.writeFrame(index, width, height, {
			palette,
			delay: frameDelay,
			repeat: 0,
		});

		if ((i + 1) % 10 === 0 || i === frameCount - 1) {
			process.stdout.write(`\r  Frame ${i + 1}/${frameCount} (${Math.round(time)}ms)`);
		}
	}

	gif.finish();
	const gifBytes = gif.bytes();

	// Ensure output directory
	if (!existsSync(outDir)) {
		mkdirSync(outDir, { recursive: true });
	}

	const outPath = resolve(outDir, `${name}.gif`);
	writeFileSync(outPath, gifBytes);

	const sizeKB = (gifBytes.length / 1024).toFixed(1);
	console.log(`\n  Output: ${outPath} (${sizeKB} KB)`);

	await browser.close();
}

// Main
const requested = process.argv[2];
const names = requested ? [requested] : Object.keys(diagrams);

for (const name of names) {
	if (!diagrams[name]) {
		console.error(`Unknown diagram: ${name}`);
		console.error(`Available: ${Object.keys(diagrams).join(', ')}`);
		process.exit(1);
	}
}

console.log(`Exporting diagrams: ${names.join(', ')}`);

for (const name of names) {
	await exportDiagram(name, diagrams[name]);
}

console.log('\nDone!');
