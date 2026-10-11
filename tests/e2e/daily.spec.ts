import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentQuestion } from '../../src/types';

const dir = join(import.meta.dirname, '..', '..', 'content');
const questions: ContentQuestion[] = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as ContentQuestion[]);
const byPrompt = new Map(questions.map((q) => [q.prompt, q]));

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
});

test('جولة يومية كاملة على الجوال', async ({ page }) => {
  await page.goto('./#daily');
  await page.getByRole('button', { name: /ابدأ الغطسة/ }).click();

  for (let i = 0; i < 7; i++) {
    const prompt = (await page.locator('#q-prompt').textContent())!.trim();
    const q = byPrompt.get(prompt);
    expect(q, `السؤال «${prompt}» موجود في المحتوى`).toBeTruthy();
    const input = page.getByRole('textbox', { name: 'جوابك' });
    await expect(input).toBeEnabled();
    await expect(input).toBeFocused();

    if (i === 0) {
      // جواب غلط: رسالة ويقدر يجرب مرة ثانية
      await input.fill('كلمة مالها علاقة');
      await input.press('Enter');
      await expect(page.locator('#answer-msg')).toContainText('كلمة مالها علاقة');
    }

    if (i === 1) {
      // يطلع من اللعبة ويرجع: نفس السؤال ويكمل الوقت
      await page.reload();
      await expect(page.locator('#q-prompt')).toHaveText(prompt);
    }

    if (i === 6) {
      await page.getByRole('button', { name: 'تخطّي' }).click();
      await expect(page.getByText('تخطّيت السؤال')).toBeVisible();
    } else {
      const answer = i === 2 ? q!.secret : q!.answers[0].text;
      await page.getByRole('textbox', { name: 'جوابك' }).fill(answer);
      await page.keyboard.press('Enter');
      if (i === 2) await expect(page.getByText('لقيت الجواب السري')).toBeVisible();
    }
    await page.getByRole('button', { name: i === 6 ? 'شوف نتيجتك' : /السؤال/ }).click();
  }

  await expect(page.getByText('أجوبتك')).toBeVisible();
  await expect(page.getByText('الجواب السري:').first()).toBeVisible();
  await expect(page.getByLabel('ملخص المستويات')).toContainText('💎');
  await expect(page.getByLabel('ملخص المستويات')).toContainText('⚫');

  // الرجوع لنفس اليوم يعرض النتيجة مباشرة
  await page.goto('./');
  await expect(page.getByRole('link', { name: /نتيجتك اليوم/ })).toBeVisible();
});

test('الوقت يخلص ويعطي صفر', async ({ page }) => {
  await page.clock.install();
  await page.goto('./#daily');
  await page.getByRole('button', { name: /ابدأ الغطسة/ }).click();
  await expect(page.locator('#q-prompt')).toBeVisible();
  await page.clock.fastForward(26_000);
  await expect(page.getByText('خلص الوقت')).toBeVisible();
});
