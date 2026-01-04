/**
 * Visual UI Testing Script
 * Creates a test user, populates data, and takes screenshots of all UI components
 */

const puppeteer = require('puppeteer');
const path = require('path');

const APP_URL = 'https://todo-list-app-fdc25.web.app';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Generate unique test user
const TEST_USER = `testuser_${Date.now()}`;
const TEST_PASSWORD = 'testpass123';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
    const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`Screenshot saved: ${name}.png`);
    return filepath;
}

async function runVisualTests() {
    // Ensure screenshot directory exists
    const fs = require('fs');
    if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    try {
        // 1. Navigate to app
        console.log('Navigating to app...');
        await page.goto(APP_URL, { waitUntil: 'networkidle2' });
        await delay(1000);

        // Screenshot: Login page
        await takeScreenshot(page, '01-login-page');

        // 2. Switch to signup tab
        console.log('Switching to signup...');
        await page.click('.auth-tab:last-child');
        await delay(500);
        await takeScreenshot(page, '02-signup-page');

        // 3. Create test user
        console.log(`Creating test user: ${TEST_USER}`);
        await page.type('#signup-username', TEST_USER);
        await page.type('#signup-password', TEST_PASSWORD);
        await page.type('#signup-confirm', TEST_PASSWORD);
        await page.click('#signup-form button[type="submit"]');
        await delay(2000);

        // Screenshot: Main app (empty state)
        await takeScreenshot(page, '03-main-app-empty');

        // 4. Add a simple todo
        console.log('Adding simple todo...');
        await page.type('#todo-input', 'Simple task without extras');
        await page.click('#add-btn');
        await delay(1000);
        await takeScreenshot(page, '04-simple-todo');

        // 5. Add todo with tags
        console.log('Adding todo with tags...');
        await page.type('#todo-input', 'Task with multiple tags');
        // Open advanced options
        await page.click('#add-advanced-toggle');
        await delay(300);
        // Add tags
        const tagsInput = await page.$('#tags-input-container input');
        await tagsInput.type('work');
        await page.keyboard.press('Enter');
        await delay(200);
        await tagsInput.type('urgent');
        await page.keyboard.press('Enter');
        await delay(200);
        await tagsInput.type('project-alpha');
        await page.keyboard.press('Enter');
        await delay(200);
        await page.click('#add-btn');
        await delay(1000);
        await takeScreenshot(page, '05-todo-with-tags');

        // 6. Add high priority todo with due date
        console.log('Adding high priority todo with due date...');
        await page.type('#todo-input', 'Urgent deadline task');
        await page.evaluate(() => {
            document.getElementById('priority-select').value = '9';
        });
        await page.type('#due-time-input', 'tomorrow 3pm');
        await page.click('#add-btn');
        await delay(1000);
        await takeScreenshot(page, '06-high-priority-with-due');

        // 7. Add urgent (priority 10) todo
        console.log('Adding urgent todo...');
        await page.type('#todo-input', 'URGENT: Critical issue');
        await page.evaluate(() => {
            document.getElementById('priority-select').value = '10';
        });
        await page.click('#add-btn');
        await delay(1000);
        await takeScreenshot(page, '07-urgent-todo');

        // 8. Add todo with many tags to test wrapping
        console.log('Adding todo with many tags...');
        await page.type('#todo-input', 'Task with lots of tags');
        await page.click('#add-advanced-toggle');
        await delay(300);
        const tagsInput2 = await page.$('#tags-input-container input');
        for (const tag of ['frontend', 'backend', 'database', 'api', 'testing']) {
            await tagsInput2.type(tag);
            await page.keyboard.press('Enter');
            await delay(150);
        }
        await page.click('#add-btn');
        await delay(1000);
        await takeScreenshot(page, '08-many-tags');

        // 9. Open detail panel by clicking a todo
        console.log('Opening detail panel...');
        // Todo items are inside priority sections, so use a more specific selector
        const todoItem = await page.$('.todo-item');
        if (todoItem) {
            await todoItem.click();
            await delay(800);
            await takeScreenshot(page, '09-detail-panel');
        }

        // 10. Test recurring options in add form
        console.log('Testing recurring options...');
        // Open advanced options in add form
        const advancedToggle = await page.$('#add-advanced-toggle');
        if (advancedToggle) {
            await advancedToggle.click();
            await delay(300);
            // Select weekly recurrence
            const addRecurrenceSelect = await page.$('#add-recurrence-type');
            if (addRecurrenceSelect) {
                await addRecurrenceSelect.select('weekly');
                await delay(500);
                await takeScreenshot(page, '10-recurring-weekly');
            }
        }

        // 11. Close detail panel and scroll to see all priority sections
        console.log('Closing detail panel...');
        await page.click('.detail-close');
        await delay(500);
        await takeScreenshot(page, '11-all-sections');

        // 12. Test mobile viewport
        console.log('Testing mobile viewport...');
        await page.setViewport({ width: 375, height: 812 });
        await delay(500);
        await takeScreenshot(page, '12-mobile-view');

        // 13. Click on a todo to see mobile inline expansion
        console.log('Testing mobile inline expansion...');
        await page.click('.todo-item:first-child');
        await delay(500);
        await takeScreenshot(page, '13-mobile-expanded');

        // 14. Test tablet viewport
        console.log('Testing tablet viewport...');
        await page.setViewport({ width: 768, height: 1024 });
        await delay(500);
        await takeScreenshot(page, '14-tablet-view');

        // 15. Return to desktop and check completed state
        console.log('Testing completed state...');
        await page.setViewport({ width: 1400, height: 900 });
        await delay(300);
        await page.click('.todo-item:first-child .todo-checkbox');
        await delay(1000);
        await takeScreenshot(page, '15-completed-todo');

        // 16. Check deleted todos section
        console.log('Checking deleted section...');
        await page.click('.todo-item:nth-child(2) .delete-btn');
        await delay(1000);
        // Scroll down to see deleted section if visible
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await delay(500);
        await takeScreenshot(page, '16-deleted-section');

        // 17. Test search functionality
        console.log('Testing search...');
        await page.evaluate(() => window.scrollTo(0, 0));
        await delay(300);
        const searchInput = await page.$('#search-input');
        if (searchInput) {
            await searchInput.type('urgent');
            await delay(500);
            await takeScreenshot(page, '17-search-results');
            // Clear search
            await searchInput.click({ clickCount: 3 });
            await page.keyboard.press('Backspace');
            await delay(500);
        }

        // 18. Test tag filter
        console.log('Testing tag filter...');
        const tagFilterBtn = await page.$('#tag-filter-btn');
        if (tagFilterBtn) {
            await tagFilterBtn.click();
            await delay(300);
            await takeScreenshot(page, '18-tag-filter-dropdown');
        }

        console.log('\n=== Visual Testing Complete ===');
        console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
        console.log('Total screenshots: 18');

    } catch (error) {
        console.error('Error during visual testing:', error);
        await takeScreenshot(page, 'error-state');
    } finally {
        await browser.close();
    }
}

// Run the tests
runVisualTests().catch(console.error);
