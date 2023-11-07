import { Browser, BrowserContext, chromium, Page } from "@playwright/test";
import { expect as PLexpect } from '@playwright/test';
import { describe, expect, test, beforeAll, afterAll, it } from 'vitest'
import * as fs from 'fs';

describe.concurrent('Playwright', () => {
    test('is awesome', () => {
        expect(true).toBe(true)
    })
    let page: Page;
    let browser: Browser;
    let context: BrowserContext;
    beforeAll(async () => {
        browser = await chromium.launch({});
        let context = await browser.newContext();
        page = await context.newPage();
    });

    afterAll(async () => {
        await browser.close();
    });
    it('index.html', () => {
        test('has #container element with contents', async () => {
            await page.goto("https://allegro.pl");
            await page.screenshot({ path: 'screenshot.png' });
            const $container = await page.evaluate(() => {
                return document.querySelector('body').innerHTML;
            })

            expect($container).to.not.be.null;

            // Expect a title "to contain" a substring.
            // await PLexpect(page).toHaveTitle(/Playwright/);



        });
    })
    const person = {
        isActive: true,
        age: 32,
    }
    it('person', () => {
        test('person is defined', () => {
            expect(person).toBeDefined()
        })
    });
});
