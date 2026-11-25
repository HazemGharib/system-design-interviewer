import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const artifactsDir = '/opt/cursor/artifacts';

mkdirSync(artifactsDir, { recursive: true });

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  
  // Mobile viewport (iPhone 14 Pro)
  const mobileContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://127.0.0.1:41789', { waitUntil: 'networkidle' });
  
  // Wait for fonts to load
  await mobilePage.waitForTimeout(1500);
  
  // Take mobile screenshot
  await mobilePage.screenshot({
    path: join(artifactsDir, 'app-mobile-hero.png'),
    fullPage: false,
  });
  console.log('Saved mobile screenshot: app-mobile-hero.png');
  
  // Scroll down to show a stage
  await mobilePage.evaluate(() => {
    const cards = document.querySelectorAll('div[dir="rtl"]');
    if (cards[2]) cards[2].scrollIntoView({ behavior: 'instant' });
  });
  await mobilePage.waitForTimeout(500);
  
  await mobilePage.screenshot({
    path: join(artifactsDir, 'app-mobile-stage.png'),
    fullPage: false,
  });
  console.log('Saved mobile stage screenshot: app-mobile-stage.png');
  
  // Full page screenshot
  await mobilePage.evaluate(() => window.scrollTo(0, 0));
  await mobilePage.waitForTimeout(300);
  await mobilePage.screenshot({
    path: join(artifactsDir, 'app-mobile-full.png'),
    fullPage: true,
  });
  console.log('Saved mobile full page screenshot: app-mobile-full.png');
  
  await mobileContext.close();
  
  // Desktop viewport for comparison
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://127.0.0.1:41789', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1500);
  
  await desktopPage.screenshot({
    path: join(artifactsDir, 'app-desktop.png'),
    fullPage: false,
  });
  console.log('Saved desktop screenshot: app-desktop.png');
  
  await desktopContext.close();
  await browser.close();
  
  console.log('All screenshots saved to', artifactsDir);
}

takeScreenshots().catch(console.error);
