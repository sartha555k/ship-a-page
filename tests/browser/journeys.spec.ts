import { test, expect } from '@playwright/test';
test('global theme persists across homepage, experiment and refresh', async ({ page }) => {
 const errors: string[]=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' }); await page.goto('/');
 await expect(page.getByRole('heading',{name:'First, a place to put everything.'})).toHaveCount(0);
 const preview=page.getByAltText('Called It interface showing a prediction, its deadline, outcome criteria, and Back and Challenge actions.');
 await preview.scrollIntoViewIfNeeded();
 await expect.poll(()=>preview.evaluate((image: HTMLImageElement)=>image.naturalWidth)).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Switch to dark mode'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.screenshot({path:'test-results/home-dark.png',fullPage:true});
 await page.goto('/experiments/called-it'); await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.getByRole('button',{name:'Switch to light mode'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light'); expect(errors).toEqual([]);
});
test('feed, filters, detail and receipt download work', async ({ page }) => {
 const errors: string[]=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({colorScheme:'light', reducedMotion:'reduce'}); await page.goto('/experiments/called-it');
 await expect(page.getByText('Preview collection.')).toBeVisible();
 await expect(page.locator('.ci-card')).toHaveCount(3);
 await expect(page.getByRole('button',{name:'What’s your prediction?'})).toBeVisible();
 await page.screenshot({path:'test-results/called-it-light.png',fullPage:true});
 await page.getByRole('button',{name:'Resolved',exact:true}).click(); await expect(page.locator('.ci-card')).toHaveCount(1);
 await page.getByRole('button',{name:'All calls',exact:true}).click();
 await page.getByRole('searchbox').fill('1,000'); await expect(page.locator('.ci-card')).toHaveCount(1);
 await page.getByRole('link',{name:'Open receipt',exact:false}).click();
 await expect(page.getByRole('heading',{name:'This project will reach 1,000 GitHub stars before November ends.'})).toBeVisible();
 const download=page.waitForEvent('download'); await page.getByRole('button',{name:'Download receipt'}).click(); const file=await download; expect(file.suggestedFilename()).toMatch(/called-it.*png/);
 await file.saveAs('test-results/example-receipt.png');
 await expect(page.getByText('Example calls don’t accept responses.')).toBeVisible(); expect(errors).toEqual([]);
});
test('compose validates, reviews, edits and supports keyboard dismiss', async ({ page }) => {
 await page.goto('/experiments/called-it'); await page.getByRole('button',{name:'Make a call',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByLabel('Your prediction').fill('We will ship three public experiment pages.');
 const future=new Date(Date.now()+86400000*7); const local=new Date(future.getTime()-future.getTimezoneOffset()*60000).toISOString().slice(0,16);
 await page.getByLabel('Deadline',{exact:false}).fill(local);
 await page.getByLabel('What counts as getting it right?').fill('Count three working public pages at the stated deadline.');
 await page.getByLabel('Where can we check it?').fill('http://example.com');
 await page.getByLabel('Why do you think this will happen?').fill('The shared components and focused scope make this achievable.');
 await page.getByRole('button',{name:'Review my call'}).click(); await expect(page.getByRole('alert')).toContainText('https://');
 await page.getByLabel('Where can we check it?').fill('https://github.com/sartha555k/ship-a-page'); await page.getByRole('button',{name:'Review my call'}).click();
 await expect(page.getByRole('heading',{name:'Ready to stand by it?'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Accounts opening soon'})).toBeDisabled();
 await page.getByRole('button',{name:'Edit draft'}).click(); await expect(page.getByLabel('Your prediction')).toHaveValue('We will ship three public experiment pages.');
 await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible();
});
test('mobile layout has no overflow, works in both themes and follows system preference', async ({ page }) => {
 await page.setViewportSize({width:390,height:844}); await page.emulateMedia({colorScheme:'dark', reducedMotion:'reduce'}); await page.goto('/experiments/called-it');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/called-it-mobile-dark.png',fullPage:true});
 await page.getByRole('button',{name:'Make a call',exact:true}).click(); await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('button',{name:'Close prediction form'}).click();
 await page.goto('/'); expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Switch to light mode'}).click(); await page.screenshot({path:'test-results/home-mobile-light.png',fullPage:true});
});
test('unauthorized writes and OAuth redirects fail safely', async ({ request }) => {
 const badOrigin=await request.post('/api/called-it/predictions',{headers:{Origin:'https://evil.example'},data:{}}); expect(badOrigin.status()).toBe(403);
 const unconfigured=await request.post('/api/called-it/predictions',{headers:{Origin:'http://127.0.0.1:3001'},data:{}}); expect(unconfigured.status()).toBe(503);
 const callback=await request.get('/auth/callback?next=//evil.example',{maxRedirects:0}); expect(callback.status()).toBe(307); expect(callback.headers().location).toContain('/experiments/called-it?auth=failed');
});

test('timeline composer and response shortcuts are easy to find', async ({ page }) => {
 await page.goto('/experiments/called-it');
 await page.getByRole('button',{name:'What’s your prediction?'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('button',{name:'Close prediction form'}).click();
 const first=page.locator('.ci-card').first();
 expect((await first.boundingBox())!.width).toBeLessThanOrEqual(680);
 await first.getByRole('link',{name:'Challenge this call (0)'}).click();
 await expect(page).toHaveURL(/stance=challenge#discussion$/);
 await expect(page.locator('#discussion')).toBeInViewport();
 await expect(page.getByText('Example calls don’t accept responses.')).toBeVisible();
});
