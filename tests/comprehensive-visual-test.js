/**
 * Comprehensive Visual UI Testing Script
 * Tests ALL features and captures screenshots of EVERY UI state
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const APP_URL = 'https://todo-list-app-fdc25.web.app';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Generate unique test user
const TEST_USER = `visualtest_${Date.now()}`;
const TEST_PASSWORD = 'TestPass123!';

// Track screenshot count
let screenshotCount = 0;

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name, description = '') {
    screenshotCount++;
    const paddedNum = String(screenshotCount).padStart(3, '0');
    const filename = `${paddedNum}-${name}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`[${paddedNum}] ${name}${description ? ': ' + description : ''}`);
    return filepath;
}

async function clearInput(page, selector) {
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
}

async function runVisualTests() {
    // Ensure screenshot directory exists and is clean
    if (fs.existsSync(SCREENSHOT_DIR)) {
        const files = fs.readdirSync(SCREENSHOT_DIR);
        for (const file of files) {
            if (file.endsWith('.png')) {
                fs.unlinkSync(path.join(SCREENSHOT_DIR, file));
            }
        }
    } else {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    console.log('='.repeat(60));
    console.log('COMPREHENSIVE VISUAL UI TESTING');
    console.log('='.repeat(60));
    console.log(`Test User: ${TEST_USER}`);
    console.log(`App URL: ${APP_URL}`);
    console.log('='.repeat(60));

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    try {
        // ============================================
        // SECTION 1: AUTHENTICATION SCREENS
        // ============================================
        console.log('\n--- SECTION 1: AUTHENTICATION SCREENS ---');

        await page.goto(APP_URL, { waitUntil: 'networkidle2' });
        await delay(1500);
        await takeScreenshot(page, 'login-page-initial', 'Initial login page');

        // Focus on username field
        await page.focus('#login-username');
        await delay(300);
        await takeScreenshot(page, 'login-username-focused', 'Username field focused');

        // Test login error state
        await page.type('#login-username', 'nonexistent_user');
        await page.type('#login-password', 'wrongpass');
        await takeScreenshot(page, 'login-filled', 'Login form filled');

        await page.click('#login-form button[type="submit"]');
        await delay(2000);
        await takeScreenshot(page, 'login-error', 'Login error state');

        // Clear and switch to signup
        await page.click('.auth-tab:last-child');
        await delay(500);
        await takeScreenshot(page, 'signup-page', 'Signup page');

        // Test signup validation - password mismatch
        await page.type('#signup-username', 'testuser');
        await page.type('#signup-password', 'password123');
        await page.type('#signup-confirm', 'differentpass');
        await takeScreenshot(page, 'signup-password-mismatch', 'Password fields filled with mismatch');

        await page.click('#signup-form button[type="submit"]');
        await delay(1000);
        await takeScreenshot(page, 'signup-mismatch-error', 'Password mismatch error');

        // Clear and create actual test user
        await clearInput(page, '#signup-username');
        await clearInput(page, '#signup-password');
        await clearInput(page, '#signup-confirm');

        await page.type('#signup-username', TEST_USER);
        await page.type('#signup-password', TEST_PASSWORD);
        await page.type('#signup-confirm', TEST_PASSWORD);
        await takeScreenshot(page, 'signup-valid', 'Valid signup form');

        await page.click('#signup-form button[type="submit"]');
        await delay(3000);
        await takeScreenshot(page, 'main-app-empty', 'Main app - empty state');

        // ============================================
        // SECTION 2: TOP BAR AND SETTINGS
        // ============================================
        console.log('\n--- SECTION 2: TOP BAR AND SETTINGS ---');

        await takeScreenshot(page, 'top-bar-desktop', 'Top bar at desktop width');

        // Test timezone selector
        await page.click('#timezone-select');
        await delay(300);
        await takeScreenshot(page, 'timezone-dropdown', 'Timezone dropdown open');
        await page.keyboard.press('Escape');

        // Test SMS Settings Modal
        await page.click('#phone-settings-btn');
        await delay(500);
        await takeScreenshot(page, 'sms-settings-modal-empty', 'SMS settings modal - empty');

        // Add a phone number
        await page.type('#new-phone-input', '+15551234567');
        await takeScreenshot(page, 'sms-phone-input', 'Phone number input filled');

        await page.click('#add-phone-btn');
        await delay(1000);
        await takeScreenshot(page, 'sms-phone-added', 'Phone number added');

        // Close modal
        await page.click('#phone-modal-close');
        await delay(500);

        // ============================================
        // SECTION 3: ADD TODO FORM STATES
        // ============================================
        console.log('\n--- SECTION 3: ADD TODO FORM STATES ---');

        // Focus on main input
        await page.focus('#todo-input');
        await delay(300);
        await takeScreenshot(page, 'add-form-focused', 'Add form with input focused');

        // Test priority input
        await page.type('#todo-input', 'Test task for priority');
        await page.focus('#priority-select');
        await takeScreenshot(page, 'add-form-priority-focused', 'Priority input focused');

        // Test due date natural language input
        await clearInput(page, '#todo-input');
        await page.type('#todo-input', 'Task with due date');
        await page.type('#due-time-input', 'tomorrow 3pm');
        await takeScreenshot(page, 'add-form-due-natural', 'Due date natural language input');

        // Test datetime picker
        await page.focus('#due-time-datetime');
        await delay(300);
        await takeScreenshot(page, 'add-form-datetime-picker', 'Datetime picker focused');

        // Test info tooltip
        await page.click('#add-due-info-icon');
        await delay(300);
        await takeScreenshot(page, 'add-form-due-tooltip', 'Due date info tooltip');
        await page.click('#add-due-info-icon');
        await delay(300);

        // Test tags input
        await page.focus('#tags-input');
        await delay(300);
        await takeScreenshot(page, 'add-form-tags-focused', 'Tags input focused');

        // Add multiple tags
        await page.type('#tags-input', 'work');
        await page.keyboard.press('Enter');
        await delay(200);
        await page.type('#tags-input', 'urgent');
        await page.keyboard.press('Enter');
        await delay(200);
        await page.type('#tags-input', 'project-alpha');
        await page.keyboard.press('Enter');
        await delay(200);
        await takeScreenshot(page, 'add-form-multiple-tags', 'Multiple tags added');

        // Test notes input
        await page.type('#notes-input', 'This is a sample note for the task.\nIt can have multiple lines.');
        await takeScreenshot(page, 'add-form-notes-filled', 'Notes input filled');

        // ============================================
        // SECTION 4: ADVANCED OPTIONS
        // ============================================
        console.log('\n--- SECTION 4: ADVANCED OPTIONS ---');

        // Open advanced options
        await page.click('#add-advanced-toggle');
        await delay(500);
        await takeScreenshot(page, 'advanced-options-open', 'Advanced options expanded');

        // Test recurrence - Daily
        await page.select('#add-recurrence-type', 'daily');
        await delay(300);
        await takeScreenshot(page, 'recurrence-daily', 'Daily recurrence selected');

        // Test recurrence - Weekly with day selector
        await page.select('#add-recurrence-type', 'weekly');
        await delay(500);
        await takeScreenshot(page, 'recurrence-weekly-initial', 'Weekly recurrence - initial');

        // Select specific days (Mon, Wed, Fri)
        const weekdayBtns = await page.$$('#add-weekly-options .weekday-btn');
        if (weekdayBtns.length >= 6) {
            await weekdayBtns[1].click(); // Monday
            await delay(100);
            await weekdayBtns[3].click(); // Wednesday
            await delay(100);
            await weekdayBtns[5].click(); // Friday
            await delay(300);
        }
        await takeScreenshot(page, 'recurrence-weekly-days-selected', 'Weekly with Mon/Wed/Fri selected');

        // Test recurrence - Monthly (day of month)
        await page.select('#add-recurrence-type', 'monthly');
        await delay(500);
        await takeScreenshot(page, 'recurrence-monthly-day-of-month', 'Monthly - day of month mode');

        // Change monthly day
        await clearInput(page, '#add-monthly-day');
        await page.type('#add-monthly-day', '15');
        await takeScreenshot(page, 'recurrence-monthly-day-15', 'Monthly on day 15');

        // Switch to day of week mode
        await page.select('#add-monthly-mode', 'dayOfWeek');
        await delay(500);
        await takeScreenshot(page, 'recurrence-monthly-day-of-week', 'Monthly - day of week mode');

        // Select "Second Tuesday"
        await page.select('#add-monthly-week', '2');
        await page.select('#add-monthly-weekday', '2');
        await takeScreenshot(page, 'recurrence-monthly-second-tuesday', 'Monthly - second Tuesday');

        // Test recurrence - Yearly
        await page.select('#add-recurrence-type', 'yearly');
        await delay(300);
        await takeScreenshot(page, 'recurrence-yearly', 'Yearly recurrence');

        // Test recurrence - Custom
        await page.select('#add-recurrence-type', 'custom');
        await delay(500);
        await takeScreenshot(page, 'recurrence-custom-initial', 'Custom recurrence - initial');

        await clearInput(page, '#add-custom-interval');
        await page.type('#add-custom-interval', '3');
        await page.select('#add-custom-unit', 'weeks');
        await takeScreenshot(page, 'recurrence-custom-3-weeks', 'Custom - every 3 weeks');

        // Test end options - On date
        await page.select('#add-end-type', 'onDate');
        await delay(300);
        await takeScreenshot(page, 'recurrence-end-on-date', 'Recurrence ends on date');

        // Test end options - After count
        await page.select('#add-end-type', 'afterCount');
        await delay(300);
        await takeScreenshot(page, 'recurrence-end-after-count', 'Recurrence ends after count');

        await clearInput(page, '#add-end-count');
        await page.type('#add-end-count', '5');
        await takeScreenshot(page, 'recurrence-end-after-5', 'Recurrence ends after 5 occurrences');

        // Test scheduled priority changes
        await page.type('#add-scheduled-time-text', 'tomorrow 9am');
        await page.type('#add-scheduled-priority', '8');
        await page.click('#add-scheduled-btn');
        await delay(500);
        await takeScreenshot(page, 'scheduled-priority-added', 'Scheduled priority change added');

        // Add another scheduled change
        await page.type('#add-scheduled-time-text', 'next week');
        await page.type('#add-scheduled-priority', '10');
        await page.click('#add-scheduled-btn');
        await delay(500);
        await takeScreenshot(page, 'scheduled-priority-multiple', 'Multiple scheduled changes');

        // Test SMS notification scheduling
        await page.type('#add-sms-time-text', 'in 2 hours');
        await page.type('#add-sms-message', 'Reminder: Check on this task!');
        await page.click('#add-sms-btn');
        await delay(500);
        await takeScreenshot(page, 'scheduled-sms-added', 'Scheduled SMS notification added');

        // Scroll to see full advanced options
        await page.evaluate(() => {
            const advancedContent = document.getElementById('add-advanced-content');
            if (advancedContent) advancedContent.scrollIntoView({ block: 'start' });
        });
        await delay(300);
        await takeScreenshot(page, 'advanced-options-full', 'Full advanced options view');

        // ============================================
        // SECTION 5: ADD TODOS WITH VARIOUS PRIORITIES
        // ============================================
        console.log('\n--- SECTION 5: ADD TODOS WITH PRIORITIES ---');

        // Reset form by reloading (simpler than clearing all fields)
        await page.reload({ waitUntil: 'networkidle2' });
        await delay(1500);

        // Add priority 0 (lowest)
        await page.type('#todo-input', 'Low priority task (0)');
        await clearInput(page, '#priority-select');
        await page.type('#priority-select', '0');
        await page.click('#add-btn');
        await delay(1000);
        await takeScreenshot(page, 'todo-priority-0', 'Todo with priority 0');

        // Add priority 3
        await page.type('#todo-input', 'Below medium priority (3)');
        await clearInput(page, '#priority-select');
        await page.type('#priority-select', '3');
        await page.click('#add-btn');
        await delay(1000);

        // Add priority 5 (default/medium)
        await page.type('#todo-input', 'Medium priority task (5)');
        await clearInput(page, '#priority-select');
        await page.type('#priority-select', '5');
        await page.click('#add-btn');
        await delay(1000);
        await takeScreenshot(page, 'todo-priority-5', 'Todo with priority 5');

        // Add priority 7
        await page.type('#todo-input', 'Above medium priority (7)');
        await clearInput(page, '#priority-select');
        await page.type('#priority-select', '7');
        await page.click('#add-btn');
        await delay(1000);

        // Add priority 9 (high)
        await page.type('#todo-input', 'High priority task (9)');
        await clearInput(page, '#priority-select');
        await page.type('#priority-select', '9');
        await page.click('#add-btn');
        await delay(1000);
        await takeScreenshot(page, 'todo-priority-9', 'Todo with priority 9');

        // Add priority 10 (urgent)
        await page.type('#todo-input', 'URGENT: Critical task (10)');
        await clearInput(page, '#priority-select');
        await page.type('#priority-select', '10');
        await page.click('#add-btn');
        await delay(1000);
        await takeScreenshot(page, 'todo-priority-10-urgent', 'Todo with priority 10 (urgent)');

        // Add fractional priority
        await page.type('#todo-input', 'Fractional priority (7.5)');
        await clearInput(page, '#priority-select');
        await page.type('#priority-select', '7.5');
        await page.click('#add-btn');
        await delay(1000);

        await takeScreenshot(page, 'all-priority-sections', 'All priority sections visible');

        // ============================================
        // SECTION 6: TAGS TESTING
        // ============================================
        console.log('\n--- SECTION 6: TAGS TESTING ---');

        // Single tag
        await page.type('#todo-input', 'Task with single tag');
        await page.focus('#tags-input');
        await page.type('#tags-input', 'single');
        await page.keyboard.press('Enter');
        await delay(200);
        await page.click('#add-btn');
        await delay(1000);
        await takeScreenshot(page, 'todo-single-tag', 'Todo with single tag');

        // Multiple tags
        await page.type('#todo-input', 'Task with multiple tags');
        await page.type('#tags-input', 'tag1');
        await page.keyboard.press('Enter');
        await delay(100);
        await page.type('#tags-input', 'tag2');
        await page.keyboard.press('Enter');
        await delay(100);
        await page.type('#tags-input', 'tag3');
        await page.keyboard.press('Enter');
        await delay(100);
        await page.type('#tags-input', 'tag4');
        await page.keyboard.press('Enter');
        await delay(100);
        await page.type('#tags-input', 'tag5');
        await page.keyboard.press('Enter');
        await delay(200);
        await page.click('#add-btn');
        await delay(1000);
        await takeScreenshot(page, 'todo-multiple-tags', 'Todo with 5 tags');

        // Long tag names
        await page.type('#todo-input', 'Task with long tag names');
        await page.type('#tags-input', 'very-long-tag-name-that-might-overflow');
        await page.keyboard.press('Enter');
        await delay(100);
        await page.type('#tags-input', 'another-extremely-long-tag-name');
        await page.keyboard.press('Enter');
        await delay(200);
        await page.click('#add-btn');
        await delay(1000);
        await takeScreenshot(page, 'todo-long-tags', 'Todo with long tag names');

        // ============================================
        // SECTION 7: DUE DATES
        // ============================================
        console.log('\n--- SECTION 7: DUE DATES ---');

        // Natural language - today
        await page.type('#todo-input', 'Due today');
        await page.type('#due-time-input', 'today');
        await page.click('#add-btn');
        await delay(1000);

        // Natural language - tomorrow
        await page.type('#todo-input', 'Due tomorrow at 3pm');
        await page.type('#due-time-input', 'tomorrow 3pm');
        await page.click('#add-btn');
        await delay(1000);

        // Natural language - next week
        await page.type('#todo-input', 'Due next week');
        await page.type('#due-time-input', 'next week');
        await page.click('#add-btn');
        await delay(1000);

        // Natural language - specific day
        await page.type('#todo-input', 'Due next Friday');
        await page.type('#due-time-input', 'next Friday');
        await page.click('#add-btn');
        await delay(1000);

        // Natural language - in X time
        await page.type('#todo-input', 'Due in 2 hours');
        await page.type('#due-time-input', 'in 2 hours');
        await page.click('#add-btn');
        await delay(1000);
        await takeScreenshot(page, 'todos-with-due-dates', 'Todos with various due dates');

        // ============================================
        // SECTION 8: NOTES
        // ============================================
        console.log('\n--- SECTION 8: NOTES ---');

        await page.type('#todo-input', 'Task with detailed notes');
        await page.type('#notes-input', 'This task has detailed notes:\n- Point 1\n- Point 2\n- Point 3\n\nDon\'t forget to check the appendix!');
        await page.click('#add-btn');
        await delay(1000);
        await takeScreenshot(page, 'todo-with-notes', 'Todo with notes indicator');

        // ============================================
        // SECTION 9: RECURRING TODOS
        // ============================================
        console.log('\n--- SECTION 9: RECURRING TODOS ---');

        // Daily recurring
        await page.type('#todo-input', 'Daily standup meeting');
        await page.click('#add-advanced-toggle');
        await delay(300);
        await page.select('#add-recurrence-type', 'daily');
        await delay(300);
        await page.click('#add-btn');
        await delay(1000);

        // Close advanced options for cleaner form
        await page.click('#add-advanced-toggle');
        await delay(300);

        // Weekly recurring
        await page.type('#todo-input', 'Weekly team review');
        await page.click('#add-advanced-toggle');
        await delay(300);
        await page.select('#add-recurrence-type', 'weekly');
        await delay(300);
        await page.click('#add-btn');
        await delay(1000);
        await page.click('#add-advanced-toggle');
        await delay(300);

        await takeScreenshot(page, 'recurring-todos', 'Recurring todos with indicators');

        // ============================================
        // SECTION 10: DETAIL PANEL
        // ============================================
        console.log('\n--- SECTION 10: DETAIL PANEL ---');

        // Click on a todo to open detail panel
        const todoItems = await page.$$('.todo-item');
        if (todoItems.length > 0) {
            await todoItems[0].click();
            await delay(800);
            await takeScreenshot(page, 'detail-panel-open', 'Detail panel open');

            // Test due date input in detail panel
            await page.focus('#detail-due-input');
            await takeScreenshot(page, 'detail-due-focused', 'Detail panel - due input focused');

            // Test priority input
            await page.focus('#detail-priority-input');
            await takeScreenshot(page, 'detail-priority-focused', 'Detail panel - priority focused');

            // Test tags in detail panel
            await page.focus('#detail-tags');
            await takeScreenshot(page, 'detail-tags-focused', 'Detail panel - tags focused');

            // Test notes textarea
            await page.focus('#detail-notes');
            await takeScreenshot(page, 'detail-notes-focused', 'Detail panel - notes focused');

            // Open advanced options in detail panel
            const advToggle = await page.$('#advanced-toggle');
            if (advToggle) {
                await page.evaluate(() => document.getElementById('advanced-toggle').click());
                await delay(500);
                await takeScreenshot(page, 'detail-advanced-open', 'Detail panel - advanced options');

                // Test recurrence in detail panel
                const recurrenceSelect = await page.$('#detail-recurrence-type');
                if (recurrenceSelect) {
                    await page.select('#detail-recurrence-type', 'weekly');
                    await delay(500);
                    await takeScreenshot(page, 'detail-recurrence-weekly', 'Detail panel - weekly recurrence');

                    // Test monthly in detail
                    await page.select('#detail-recurrence-type', 'monthly');
                    await delay(500);
                    await takeScreenshot(page, 'detail-recurrence-monthly', 'Detail panel - monthly recurrence');
                }

                // Test scheduled changes in detail panel
                const schedTime = await page.$('#scheduled-time-text');
                if (schedTime) {
                    await page.type('#scheduled-time-text', 'in 1 hour');
                    await page.type('#scheduled-priority', '9');
                    await takeScreenshot(page, 'detail-scheduled-input', 'Detail panel - scheduled input');
                }
            }

            // Close detail panel
            await page.evaluate(() => {
                const closeBtn = document.getElementById('detail-close');
                if (closeBtn) closeBtn.click();
            });
            await delay(500);
        }

        // ============================================
        // SECTION 11: TODO ITEM INTERACTIONS
        // ============================================
        console.log('\n--- SECTION 11: TODO INTERACTIONS ---');

        // Hover state
        const firstTodo = await page.$('.todo-item');
        if (firstTodo) {
            await firstTodo.hover();
            await delay(300);
            await takeScreenshot(page, 'todo-hover-state', 'Todo item hover state');
        }

        // Complete a todo
        const checkbox = await page.$('.todo-item .todo-checkbox');
        if (checkbox) {
            await checkbox.click();
            await delay(1000);
            await takeScreenshot(page, 'todo-completed', 'Todo marked as completed');
        }

        // Test due date button click
        const dueBtn = await page.$('.due-time-btn');
        if (dueBtn) {
            await dueBtn.click();
            await delay(500);
            await takeScreenshot(page, 'due-time-picker-inline', 'Inline due time picker');
            await page.keyboard.press('Escape');
            await delay(300);
        }

        // Test priority badge click
        const priorityBadge = await page.$('.priority-badge');
        if (priorityBadge) {
            await priorityBadge.click();
            await delay(500);
            await takeScreenshot(page, 'priority-input-inline', 'Inline priority input');
            await page.keyboard.press('Escape');
            await delay(300);
        }

        // ============================================
        // SECTION 12: SEARCH FUNCTIONALITY
        // ============================================
        console.log('\n--- SECTION 12: SEARCH FUNCTIONALITY ---');

        await page.focus('#search-input');
        await takeScreenshot(page, 'search-focused', 'Search input focused');

        await page.type('#search-input', 'urgent');
        await delay(500);
        await takeScreenshot(page, 'search-results-urgent', 'Search results for "urgent"');

        await clearInput(page, '#search-input');
        await page.type('#search-input', 'priority');
        await delay(500);
        await takeScreenshot(page, 'search-results-priority', 'Search results for "priority"');

        await clearInput(page, '#search-input');
        await page.type('#search-input', 'nonexistent task xyz');
        await delay(500);
        await takeScreenshot(page, 'search-no-results', 'Search with no results');

        await clearInput(page, '#search-input');
        await delay(300);

        // ============================================
        // SECTION 13: TAG FILTERING
        // ============================================
        console.log('\n--- SECTION 13: TAG FILTERING ---');

        await page.click('#tag-filter-btn');
        await delay(500);
        await takeScreenshot(page, 'tag-filter-dropdown', 'Tag filter dropdown open');

        // Click on a tag to filter
        const tagFilterItem = await page.$('.tag-filter-dropdown .tag-filter-item');
        if (tagFilterItem) {
            await tagFilterItem.click();
            await delay(500);
            await takeScreenshot(page, 'tag-filter-applied', 'Tag filter applied');
        }

        // Click filter button again and clear
        await page.evaluate(() => document.getElementById('tag-filter-btn').click());
        await delay(300);
        await page.evaluate(() => {
            const clearBtn = document.querySelector('.tag-filter-dropdown .clear-filter button');
            if (clearBtn) clearBtn.click();
        });
        await delay(500);
        await page.keyboard.press('Escape');
        await delay(300);

        // ============================================
        // SECTION 14: DELETE TODOS
        // ============================================
        console.log('\n--- SECTION 14: DELETE FUNCTIONALITY ---');

        // Delete a todo
        const deleteBtn = await page.$('.todo-item .delete-btn');
        if (deleteBtn) {
            await deleteBtn.hover();
            await delay(300);
            await takeScreenshot(page, 'delete-button-hover', 'Delete button hover state');

            await deleteBtn.click();
            await delay(1000);
            await takeScreenshot(page, 'todo-deleted', 'Todo deleted');
        }

        // Scroll to deleted section
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await delay(500);
        await takeScreenshot(page, 'deleted-section-collapsed', 'Deleted section collapsed');

        // Expand deleted section
        await page.click('#deleted-header');
        await delay(500);
        await takeScreenshot(page, 'deleted-section-expanded', 'Deleted section expanded');

        // Test restore button hover
        const restoreBtn = await page.$('.restore-btn');
        if (restoreBtn) {
            await restoreBtn.hover();
            await delay(300);
            await takeScreenshot(page, 'restore-button-hover', 'Restore button hover');
        }

        // ============================================
        // SECTION 15: EXPORT/IMPORT
        // ============================================
        console.log('\n--- SECTION 15: EXPORT/IMPORT ---');

        await page.evaluate(() => window.scrollTo(0, 0));
        await delay(300);

        await page.hover('#export-btn');
        await delay(300);
        await takeScreenshot(page, 'export-button-hover', 'Export button hover');

        // ============================================
        // SECTION 16: MOBILE VIEWPORT (375px)
        // ============================================
        console.log('\n--- SECTION 16: MOBILE VIEWPORT ---');

        await page.setViewport({ width: 375, height: 812 });
        await delay(500);
        await takeScreenshot(page, 'mobile-main-view', 'Mobile main view');

        // Mobile top bar
        await page.evaluate(() => window.scrollTo(0, 0));
        await takeScreenshot(page, 'mobile-top-bar', 'Mobile top bar');

        // Mobile add form
        await page.focus('#todo-input');
        await delay(300);
        await takeScreenshot(page, 'mobile-add-form-focused', 'Mobile add form focused');

        // Mobile inline expansion
        const mobileTodo = await page.$('.todo-item');
        if (mobileTodo) {
            await mobileTodo.click();
            await delay(500);
            await takeScreenshot(page, 'mobile-inline-expanded', 'Mobile inline detail expanded');
        }

        // Mobile search
        await page.focus('#search-input');
        await takeScreenshot(page, 'mobile-search', 'Mobile search');

        // Mobile tag filter
        await page.click('#tag-filter-btn');
        await delay(500);
        await takeScreenshot(page, 'mobile-tag-filter', 'Mobile tag filter dropdown');
        await page.keyboard.press('Escape');
        await delay(300);

        // Mobile scroll to see more content
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await delay(300);
        await takeScreenshot(page, 'mobile-scrolled', 'Mobile view scrolled');

        // Mobile deleted section
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await delay(300);
        await takeScreenshot(page, 'mobile-deleted-section', 'Mobile deleted section');

        // ============================================
        // SECTION 17: TABLET VIEWPORT (768px)
        // ============================================
        console.log('\n--- SECTION 17: TABLET VIEWPORT ---');

        await page.setViewport({ width: 768, height: 1024 });
        await delay(500);
        await page.evaluate(() => window.scrollTo(0, 0));
        await takeScreenshot(page, 'tablet-main-view', 'Tablet main view');

        // Tablet with todo expanded
        const tabletTodo = await page.$('.todo-item');
        if (tabletTodo) {
            await tabletTodo.click();
            await delay(500);
            await takeScreenshot(page, 'tablet-inline-expanded', 'Tablet inline detail expanded');
        }

        // ============================================
        // SECTION 18: SMALL MOBILE VIEWPORT (320px)
        // ============================================
        console.log('\n--- SECTION 18: SMALL MOBILE VIEWPORT ---');

        await page.setViewport({ width: 320, height: 568 });
        await delay(500);
        await page.evaluate(() => window.scrollTo(0, 0));
        await takeScreenshot(page, 'small-mobile-view', 'Small mobile (320px) view');

        // Small mobile add form
        await page.focus('#todo-input');
        await delay(300);
        await takeScreenshot(page, 'small-mobile-add-form', 'Small mobile add form');

        // ============================================
        // SECTION 19: WIDE DESKTOP VIEWPORT
        // ============================================
        console.log('\n--- SECTION 19: WIDE DESKTOP VIEWPORT ---');

        await page.setViewport({ width: 1920, height: 1080 });
        await delay(500);
        await page.evaluate(() => window.scrollTo(0, 0));
        await takeScreenshot(page, 'wide-desktop-view', 'Wide desktop (1920px) view');

        // Open detail panel on wide desktop
        const wideTodo = await page.$('.todo-item');
        if (wideTodo) {
            await wideTodo.click();
            await delay(500);
            await takeScreenshot(page, 'wide-desktop-detail-panel', 'Wide desktop with detail panel');
        }

        // ============================================
        // SECTION 20: DRAG AND DROP VISUAL STATES
        // ============================================
        console.log('\n--- SECTION 20: DRAG AND DROP STATES ---');

        await page.setViewport({ width: 1400, height: 900 });
        await delay(500);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.evaluate(() => {
            const closeBtn = document.getElementById('detail-close');
            if (closeBtn) closeBtn.click();
        });
        await delay(300);

        // Hover on drag handle
        const dragHandle = await page.$('.drag-handle');
        if (dragHandle) {
            await dragHandle.hover();
            await delay(300);
            await takeScreenshot(page, 'drag-handle-hover', 'Drag handle hover state');
        }

        // ============================================
        // SECTION 21: URGENT ITEM ANIMATION
        // ============================================
        console.log('\n--- SECTION 21: URGENT ITEM STATES ---');

        // Find urgent items (priority 10)
        const urgentItem = await page.$('.todo-item.urgent');
        if (urgentItem) {
            await takeScreenshot(page, 'urgent-item-pulse-1', 'Urgent item pulse state 1');
            await delay(400);
            await takeScreenshot(page, 'urgent-item-pulse-2', 'Urgent item pulse state 2');
            await delay(400);
            await takeScreenshot(page, 'urgent-item-pulse-3', 'Urgent item pulse state 3');
        }

        // ============================================
        // SECTION 22: SNOOZE BUTTON
        // ============================================
        console.log('\n--- SECTION 22: SNOOZE BUTTON ---');

        const snoozeBtn = await page.$('.snooze-btn');
        if (snoozeBtn) {
            await snoozeBtn.hover();
            await delay(300);
            await takeScreenshot(page, 'snooze-button-hover', 'Snooze button hover state');
        }

        // ============================================
        // SECTION 23: LOGOUT AND AUTH FINAL STATE
        // ============================================
        console.log('\n--- SECTION 23: LOGOUT ---');

        await page.hover('#logout-btn');
        await delay(300);
        await takeScreenshot(page, 'logout-button-hover', 'Logout button hover');

        await page.click('#logout-btn');
        await delay(2000);
        await takeScreenshot(page, 'logged-out-final', 'Logged out - back to login');

        // ============================================
        // FINAL SUMMARY
        // ============================================
        console.log('\n' + '='.repeat(60));
        console.log('VISUAL TESTING COMPLETE');
        console.log('='.repeat(60));
        console.log(`Total screenshots: ${screenshotCount}`);
        console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n[ERROR] Test failed:', error.message);
        await takeScreenshot(page, 'error-state', 'Error occurred');
        console.error(error.stack);
    } finally {
        await browser.close();
    }
}

// Run the tests
runVisualTests().catch(console.error);
