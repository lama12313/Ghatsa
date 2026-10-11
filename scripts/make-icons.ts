/** يولّد أيقونات PNG من public/icon.svg باستخدام Chromium (يشتغل مرة وحدة) */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './content-lib';

const svg = readFileSync(join(ROOT, 'public', 'icon.svg'), 'utf8');
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<style>*{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`,
  );
  await page.screenshot({ path: join(ROOT, 'public', `icon-${size}.png`), omitBackground: true });
}
await browser.close();
console.log('🎨 الأيقونات جاهزة');
