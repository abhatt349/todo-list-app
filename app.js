// Auth elements
const authContainer = document.getElementById('auth-container');
const appWrapper = document.getElementById('app-wrapper');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const signupUsername = document.getElementById('signup-username');
const signupPassword = document.getElementById('signup-password');
const signupConfirm = document.getElementById('signup-confirm');
const signupError = document.getElementById('signup-error');
const authTabs = document.querySelectorAll('.auth-tab');
const userEmailDisplay = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// Phone settings modal elements
const phoneSettingsBtn = document.getElementById('phone-settings-btn');
const phoneModalBackdrop = document.getElementById('phone-modal-backdrop');
const phoneSettingsModal = document.getElementById('phone-settings-modal');
const phoneModalClose = document.getElementById('phone-modal-close');
const phoneList = document.getElementById('phone-list');
const newPhoneInput = document.getElementById('new-phone-input');
const addPhoneBtn = document.getElementById('add-phone-btn');
const phoneError = document.getElementById('phone-error');
const phoneSuccess = document.getElementById('phone-success');

// App elements
const todoInput = document.getElementById('todo-input');
const prioritySelect = document.getElementById('priority-select');
const dueTimeInput = document.getElementById('due-time-input');
const dueTimeDatetime = document.getElementById('due-time-datetime');
const tagsInput = document.getElementById('tags-input');
const tagsInputContainer = document.getElementById('tags-input-container');
const detailTagsContainer = document.getElementById('detail-tags-container');
const notesInput = document.getElementById('notes-input');
const addAdvancedOptions = document.getElementById('add-advanced-options');
const addAdvancedToggle = document.getElementById('add-advanced-toggle');
const addScheduledTimeText = document.getElementById('add-scheduled-time-text');
const addScheduledTimeDatetime = document.getElementById('add-scheduled-time-datetime');
const addScheduledPriority = document.getElementById('add-scheduled-priority');
const addScheduledBtn = document.getElementById('add-scheduled-btn');
const addScheduledList = document.getElementById('add-scheduled-list');
const detailScheduledList = document.getElementById('detail-scheduled-list');
const addDetailScheduledBtn = document.getElementById('add-detail-scheduled-btn');
const addBtn = document.getElementById('add-btn');

// SMS notification scheduling elements (add form)
const addSmsList = document.getElementById('add-sms-list');
const addSmsTimeText = document.getElementById('add-sms-time-text');
const addSmsTimeDatetime = document.getElementById('add-sms-time-datetime');
const addSmsMessage = document.getElementById('add-sms-message');
const addSmsBtn = document.getElementById('add-sms-btn');

// SMS notification scheduling elements (detail panel)
const detailSmsList = document.getElementById('detail-sms-list');
const detailSmsTimeText = document.getElementById('detail-sms-time-text');
const detailSmsTimeDatetime = document.getElementById('detail-sms-time-datetime');
const detailSmsMessage = document.getElementById('detail-sms-message');
const addDetailSmsBtn = document.getElementById('add-detail-sms-btn');

// Track scheduled changes for add form
let addFormScheduledChanges = [];
let addFormScheduledSms = [];
const todoList = document.getElementById('todo-list');
const searchInput = document.getElementById('search-input');
const timezoneSelect = document.getElementById('timezone-select');
const tagFilterBtn = document.getElementById('tag-filter-btn');
const tagFilterDropdown = document.getElementById('tag-filter-dropdown');
const exportBtn = document.getElementById('export-btn');
const importInput = document.getElementById('import-input');
const detailPanel = document.getElementById('detail-panel');
const detailTitle = document.getElementById('detail-title');
const detailDueInput = document.getElementById('detail-due-input');
const detailDueDatetime = document.getElementById('detail-due-datetime');
const detailPriorityInput = document.getElementById('detail-priority-input');
const detailNotes = document.getElementById('detail-notes');
const detailTags = document.getElementById('detail-tags');
const detailClose = document.getElementById('detail-close');
const detailBackdrop = document.getElementById('detail-backdrop');
const dueInfoIcon = document.getElementById('due-info-icon');
const dueInfoTooltip = document.getElementById('due-info-tooltip');
const addDueInfoIcon = document.getElementById('add-due-info-icon');
const addDueInfoTooltip = document.getElementById('add-due-info-tooltip');
const advancedToggle = document.getElementById('advanced-toggle');
const detailAdvancedOptions = document.getElementById('detail-advanced-options');
const scheduledTimeText = document.getElementById('scheduled-time-text');
const scheduledTimeDatetime = document.getElementById('scheduled-time-datetime');
const scheduledPriority = document.getElementById('scheduled-priority');
const deletedPanel = document.getElementById('deleted-panel');
const deletedHeader = document.getElementById('deleted-header');
const deletedList = document.getElementById('deleted-list');
const deletedCount = document.getElementById('deleted-count');

let db;
let todosRef;
let usersRef;
let currentUser = null; // { id, username }
let unsubscribeTodos = null;
let currentDocs = [];
let deletedDocs = [];
let notifiedIds = new Set(); // Track which todos have already triggered notifications
let selectedTodoId = null; // Currently selected todo for detail panel
let searchQuery = ''; // Current search query
let selectedFilterTags = []; // Tags selected for filtering
let selectedTimezone = localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;

// Recurrence types
const RECURRENCE_TYPES = {
    NONE: 'none',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    CUSTOM: 'custom'
};

// Monthly recurrence modes
const MONTHLY_MODES = {
    DAY_OF_MONTH: 'dayOfMonth',      // e.g., "on the 15th"
    DAY_OF_WEEK: 'dayOfWeek'          // e.g., "on the 2nd Tuesday"
};

// Recurrence end types
const RECURRENCE_END_TYPES = {
    NEVER: 'never',
    ON_DATE: 'onDate',
    AFTER_COUNT: 'afterCount'
};

// Day names for weekly recurrence
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Get the week number of a day in its month (1st, 2nd, 3rd, 4th, or last)
function getWeekOfMonth(date) {
    const dayOfMonth = date.getDate();
    return Math.ceil(dayOfMonth / 7);
}

// Check if a date is in the last week of its month
function isLastWeekOfMonth(date) {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return date.getDate() > lastDay - 7;
}

// Format recurrence rule as human-readable string
function formatRecurrenceRule(recurrence) {
    if (!recurrence || recurrence.type === RECURRENCE_TYPES.NONE) {
        return 'Does not repeat';
    }

    let text = '';
    const interval = recurrence.interval || 1;

    switch (recurrence.type) {
        case RECURRENCE_TYPES.DAILY:
            text = interval === 1 ? 'Daily' : `Every ${interval} days`;
            break;

        case RECURRENCE_TYPES.WEEKLY:
            if (interval === 1) {
                if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
                    const days = recurrence.daysOfWeek.map(d => DAY_NAMES[d]).join(', ');
                    text = `Weekly on ${days}`;
                } else {
                    text = 'Weekly';
                }
            } else {
                if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
                    const days = recurrence.daysOfWeek.map(d => DAY_NAMES[d]).join(', ');
                    text = `Every ${interval} weeks on ${days}`;
                } else {
                    text = `Every ${interval} weeks`;
                }
            }
            break;

        case RECURRENCE_TYPES.MONTHLY:
            if (recurrence.monthlyMode === MONTHLY_MODES.DAY_OF_WEEK) {
                const weekNum = recurrence.weekOfMonth === 'last' ? 'last' : getOrdinalSuffix(recurrence.weekOfMonth);
                const dayName = FULL_DAY_NAMES[recurrence.dayOfWeek];
                text = interval === 1
                    ? `Monthly on the ${weekNum} ${dayName}`
                    : `Every ${interval} months on the ${weekNum} ${dayName}`;
            } else {
                const dayNum = getOrdinalSuffix(recurrence.dayOfMonth || 1);
                text = interval === 1
                    ? `Monthly on the ${dayNum}`
                    : `Every ${interval} months on the ${dayNum}`;
            }
            break;

        case RECURRENCE_TYPES.YEARLY:
            text = interval === 1 ? 'Yearly' : `Every ${interval} years`;
            break;

        case RECURRENCE_TYPES.CUSTOM:
            const unit = recurrence.customUnit || 'days';
            const customInterval = recurrence.customInterval || 1;
            text = `Every ${customInterval} ${unit}`;
            break;
    }

    // Add end condition
    if (recurrence.endType === RECURRENCE_END_TYPES.ON_DATE && recurrence.endDate) {
        const endDate = new Date(recurrence.endDate);
        text += `, until ${endDate.toLocaleDateString()}`;
    } else if (recurrence.endType === RECURRENCE_END_TYPES.AFTER_COUNT && recurrence.endCount) {
        text += `, ${recurrence.endCount} times`;
    }

    return text;
}

// Calculate the next occurrence date based on recurrence rule
function calculateNextOccurrence(currentDueDate, recurrence) {
    if (!recurrence || recurrence.type === RECURRENCE_TYPES.NONE) {
        return null;
    }

    const current = currentDueDate ? new Date(currentDueDate) : new Date();
    let next = new Date(current);
    const interval = recurrence.interval || 1;

    switch (recurrence.type) {
        case RECURRENCE_TYPES.DAILY:
            next.setDate(next.getDate() + interval);
            break;

        case RECURRENCE_TYPES.WEEKLY:
            if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
                // Find the next day in the list
                const currentDay = next.getDay();
                const sortedDays = [...recurrence.daysOfWeek].sort((a, b) => a - b);

                // Find next day in current week
                let nextDay = sortedDays.find(d => d > currentDay);

                if (nextDay !== undefined) {
                    // Found a day later this week
                    next.setDate(next.getDate() + (nextDay - currentDay));
                } else {
                    // Go to first day of next week cycle
                    const daysUntilNextCycle = 7 * interval - currentDay + sortedDays[0];
                    next.setDate(next.getDate() + daysUntilNextCycle);
                }
            } else {
                next.setDate(next.getDate() + (7 * interval));
            }
            break;

        case RECURRENCE_TYPES.MONTHLY:
            if (recurrence.monthlyMode === MONTHLY_MODES.DAY_OF_WEEK) {
                // e.g., "2nd Tuesday of the month"
                const targetWeek = recurrence.weekOfMonth;
                const targetDay = recurrence.dayOfWeek;

                // Move to next month
                next.setMonth(next.getMonth() + interval);
                next.setDate(1);

                if (targetWeek === 'last') {
                    // Go to last day of month
                    next.setMonth(next.getMonth() + 1);
                    next.setDate(0);
                    // Find the last occurrence of the target day
                    while (next.getDay() !== targetDay) {
                        next.setDate(next.getDate() - 1);
                    }
                } else {
                    // Find the nth occurrence of the target day
                    const firstDayOfMonth = next.getDay();
                    let daysToAdd = targetDay - firstDayOfMonth;
                    if (daysToAdd < 0) daysToAdd += 7;
                    daysToAdd += (targetWeek - 1) * 7;
                    next.setDate(1 + daysToAdd);
                }
            } else {
                // Day of month mode
                const targetDay = recurrence.dayOfMonth || current.getDate();
                next.setMonth(next.getMonth() + interval);

                // Handle end-of-month edge cases
                const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
                next.setDate(Math.min(targetDay, daysInMonth));
            }
            break;

        case RECURRENCE_TYPES.YEARLY:
            next.setFullYear(next.getFullYear() + interval);
            // Handle Feb 29 on non-leap years
            if (next.getMonth() === 1 && current.getDate() === 29) {
                const daysInFeb = new Date(next.getFullYear(), 2, 0).getDate();
                next.setDate(Math.min(29, daysInFeb));
            }
            break;

        case RECURRENCE_TYPES.CUSTOM:
            const customInterval = recurrence.customInterval || 1;
            const unit = recurrence.customUnit || 'days';

            switch (unit) {
                case 'days':
                    next.setDate(next.getDate() + customInterval);
                    break;
                case 'weeks':
                    next.setDate(next.getDate() + (customInterval * 7));
                    break;
                case 'months':
                    next.setMonth(next.getMonth() + customInterval);
                    break;
            }
            break;
    }

    // Check if we've exceeded the end condition
    if (recurrence.endType === RECURRENCE_END_TYPES.ON_DATE && recurrence.endDate) {
        if (next > new Date(recurrence.endDate)) {
            return null;
        }
    }

    // Note: endCount is handled in the completion logic, not here

    return next.getTime();
}

// Check if recurrence has remaining occurrences
function hasRemainingOccurrences(recurrence) {
    if (!recurrence || recurrence.type === RECURRENCE_TYPES.NONE) {
        return false;
    }

    if (recurrence.endType === RECURRENCE_END_TYPES.NEVER) {
        return true;
    }

    if (recurrence.endType === RECURRENCE_END_TYPES.ON_DATE && recurrence.endDate) {
        return new Date() < new Date(recurrence.endDate);
    }

    if (recurrence.endType === RECURRENCE_END_TYPES.AFTER_COUNT && recurrence.endCount) {
        const completedCount = recurrence.completedCount || 0;
        return completedCount < recurrence.endCount;
    }

    return true;
}

// Create default recurrence object
function createDefaultRecurrence() {
    return {
        type: RECURRENCE_TYPES.NONE,
        interval: 1,
        daysOfWeek: [],
        monthlyMode: MONTHLY_MODES.DAY_OF_MONTH,
        dayOfMonth: null,
        dayOfWeek: null,
        weekOfMonth: null,
        customInterval: 1,
        customUnit: 'days',
        endType: RECURRENCE_END_TYPES.NEVER,
        endDate: null,
        endCount: null,
        completedCount: 0
    };
}

// Common timezones grouped by region
const timezones = [
    { value: 'Pacific/Honolulu', label: 'Hawaii' },
    { value: 'America/Anchorage', label: 'Alaska' },
    { value: 'America/Los_Angeles', label: 'Pacific' },
    { value: 'America/Denver', label: 'Mountain' },
    { value: 'America/Chicago', label: 'Central' },
    { value: 'America/New_York', label: 'Eastern' },
    { value: 'America/Sao_Paulo', label: 'São Paulo' },
    { value: 'Atlantic/Reykjavik', label: 'Iceland' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Europe/Berlin', label: 'Berlin' },
    { value: 'Europe/Moscow', label: 'Moscow' },
    { value: 'Asia/Dubai', label: 'Dubai' },
    { value: 'Asia/Kolkata', label: 'India' },
    { value: 'Asia/Bangkok', label: 'Bangkok' },
    { value: 'Asia/Singapore', label: 'Singapore' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Australia/Sydney', label: 'Sydney' },
    { value: 'Pacific/Auckland', label: 'Auckland' },
];

// Get UTC offset string for a timezone (e.g., "+5:30", "-8")
function getTimezoneOffset(timezone) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'shortOffset'
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    if (offsetPart) {
        // Convert "GMT-8" or "GMT+5:30" to "-8" or "+5:30"
        return offsetPart.value.replace('GMT', '');
    }
    return '';
}

// Initialize timezone selector
function initTimezoneSelector() {
    // Add user's local timezone if not in list
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hasLocalTz = timezones.some(tz => tz.value === localTz);

    if (!hasLocalTz) {
        timezones.unshift({ value: localTz, label: localTz.split('/').pop().replace(/_/g, ' ') });
    }

    // Populate dropdown with UTC offsets
    timezones.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz.value;
        const offset = getTimezoneOffset(tz.value);
        option.textContent = `(UTC${offset}) ${tz.label}`;
        if (tz.value === selectedTimezone) {
            option.selected = true;
        }
        timezoneSelect.appendChild(option);
    });
}

// Request notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Send notification for overdue todo
function sendOverdueNotification(todo, id) {
    if (notifiedIds.has(id)) return;
    notifiedIds.add(id);

    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Todo Overdue!', {
            body: todo.text,
            icon: '/icon-192.png',
            tag: id // Prevents duplicate notifications
        });
    }
}

// Check if a todo is overdue
function isOverdue(todo) {
    if (!todo.dueTime || todo.completed) return false;
    return new Date(todo.dueTime) <= new Date();
}

// Parse natural language date input
function parseNaturalDate(input) {
    if (!input || !input.trim()) return null;

    const text = input.toLowerCase().trim();
    const now = new Date();
    let result = new Date(now);

    // Word to number mapping
    const wordToNum = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'eleven': 11, 'twelve': 12, 'fifteen': 15, 'twenty': 20,
        'thirty': 30, 'forty': 40, 'forty-five': 45, 'sixty': 60,
        'a': 1, 'an': 1
    };

    // Check for "in X minutes/hours/days/weeks/months" pattern
    const inMatch = text.match(/in\s+(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|forty-five|sixty)\s+(minute|hour|day|week|month)s?/i);
    if (inMatch) {
        let amount = wordToNum[inMatch[1]] || parseInt(inMatch[1]);
        const unit = inMatch[2].toLowerCase();

        if (unit === 'minute') {
            result.setMinutes(result.getMinutes() + amount);
        } else if (unit === 'hour') {
            result.setHours(result.getHours() + amount);
        } else if (unit === 'day') {
            result.setDate(result.getDate() + amount);
        } else if (unit === 'week') {
            result.setDate(result.getDate() + (amount * 7));
        } else if (unit === 'month') {
            result.setMonth(result.getMonth() + amount);
        }
        return result.toISOString();
    }

    // Default time to 9am if no time specified
    let timeSpecified = false;
    let hours = 9, minutes = 0;

    // Extract time if present (e.g., "3pm", "3:30pm", "15:00")
    const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
        timeSpecified = true;
        hours = parseInt(timeMatch[1]);
        minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const meridiem = timeMatch[3];
        if (meridiem) {
            if (meridiem.toLowerCase() === 'pm' && hours !== 12) hours += 12;
            if (meridiem.toLowerCase() === 'am' && hours === 12) hours = 0;
        }
    }

    // Parse relative dates
    if (text.includes('today')) {
        // result is already today
    } else if (text.includes('tomorrow')) {
        result.setDate(result.getDate() + 1);
    } else if (text.includes('yesterday')) {
        result.setDate(result.getDate() - 1);
    } else if (text.match(/next\s+week/)) {
        result.setDate(result.getDate() + 7);
    } else if (text.match(/next\s+month/)) {
        result.setMonth(result.getMonth() + 1);
    } else if (text.match(/beginning\s+of\s+next\s+month/)) {
        result.setMonth(result.getMonth() + 1);
        result.setDate(1);
    } else if (text.match(/end\s+of\s+(this\s+)?month/)) {
        result.setMonth(result.getMonth() + 1);
        result.setDate(0);
    } else if (text.match(/next\s+(sun|mon|tue|wed|thu|fri|sat)/i)) {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayMatch = text.match(/next\s+(sun|mon|tue|wed|thu|fri|sat)/i);
        const targetDay = days.findIndex(d => dayMatch[1].toLowerCase().startsWith(d));
        const currentDay = result.getDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil <= 0) daysUntil += 7;
        result.setDate(result.getDate() + daysUntil);
    } else {
        // Try to parse month/day formats like "Jan 5", "January 5", "1/5"
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthMatch = text.match(/([a-z]+)\s+(\d{1,2})/i);
        const slashMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);

        if (monthMatch) {
            const monthIdx = monthNames.findIndex(m => monthMatch[1].toLowerCase().startsWith(m));
            if (monthIdx !== -1) {
                result.setMonth(monthIdx);
                result.setDate(parseInt(monthMatch[2]));
                if (result < now) result.setFullYear(result.getFullYear() + 1);
            }
        } else if (slashMatch) {
            result.setMonth(parseInt(slashMatch[1]) - 1);
            result.setDate(parseInt(slashMatch[2]));
            if (slashMatch[3]) {
                let year = parseInt(slashMatch[3]);
                if (year < 100) year += 2000;
                result.setFullYear(year);
            } else if (result < now) {
                result.setFullYear(result.getFullYear() + 1);
            }
        } else if (!timeSpecified) {
            // Couldn't parse, try native Date parser as fallback
            const parsed = new Date(input);
            if (!isNaN(parsed.getTime())) {
                return parsed.toISOString();
            }
            return null;
        }
    }

    result.setHours(hours, minutes, 0, 0);
    return result.toISOString();
}

// Initialize Firebase and load todos
// Simple hash function for passwords
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Show the app after login
function showApp() {
    userEmailDisplay.textContent = currentUser.username;
    authContainer.style.display = 'none';
    appWrapper.style.display = 'flex';
    startTodosListener();
}

// Show the login screen
function showLogin() {
    currentUser = null;
    localStorage.removeItem('todoUser');
    if (unsubscribeTodos) {
        unsubscribeTodos();
        unsubscribeTodos = null;
    }
    currentDocs = [];
    deletedDocs = [];
    authContainer.style.display = 'flex';
    appWrapper.style.display = 'none';
}

function initApp() {
    db = firebase.firestore();
    todosRef = db.collection('todos');
    usersRef = db.collection('users');

    // Check for saved session
    const savedUser = localStorage.getItem('todoUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
    } else {
        showLogin();
    }
}

// Start listening for todos for the current user
function startTodosListener() {
    if (unsubscribeTodos) {
        unsubscribeTodos();
    }

    // Listen for real-time updates on user's todos
    unsubscribeTodos = todosRef.where('userId', '==', currentUser.id).onSnapshot((snapshot) => {
        // Separate active and deleted todos
        const activeDocs = [];
        const deleted = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.deleted === true) {
                deleted.push(doc);
            } else {
                activeDocs.push(doc);
                // Boost overdue items to max priority and send notifications
                if (isOverdue(data)) {
                    if (data.priority < 10) {
                        todosRef.doc(doc.id).update({ priority: 10 });
                    }
                    sendOverdueNotification(data, doc.id);
                }
            }
        });

        // Sort active: overdue first, then uncompleted (by priority desc), then completed
        currentDocs = activeDocs.sort((a, b) => {
            const aData = a.data();
            const bData = b.data();
            const aOverdue = isOverdue(aData);
            const bOverdue = isOverdue(bData);

            // Overdue items go to top (among uncompleted)
            if (aOverdue !== bOverdue) {
                return aOverdue ? -1 : 1;
            }

            // Completed items go to bottom
            if (aData.completed !== bData.completed) {
                return aData.completed ? 1 : -1;
            }

            // Within same status, sort by priority descending
            return (bData.priority || 0) - (aData.priority || 0);
        });

        deletedDocs = deleted;
        renderTodos(currentDocs);
        renderDeletedTodos();
    });

    // Re-check for overdue items and scheduled changes every minute
    setInterval(() => {
        if (currentDocs.length > 0) {
            const now = Date.now();
            currentDocs.forEach(doc => {
                const data = doc.data();

                // Check for newly overdue items and send notifications
                if (isOverdue(data)) {
                    if (data.priority < 10) {
                        todosRef.doc(doc.id).update({ priority: 10 });
                    }
                    sendOverdueNotification(data, doc.id);
                }

                // Check for scheduled priority changes (supports both array and single object for backwards compat)
                let scheduledChanges = data.scheduledPriorityChanges || [];
                // Handle legacy single scheduledPriorityChange
                if (data.scheduledPriorityChange && data.scheduledPriorityChange.time) {
                    scheduledChanges = [data.scheduledPriorityChange];
                }

                if (scheduledChanges.length > 0) {
                    const pendingChanges = [];
                    let latestPriority = null;

                    scheduledChanges.forEach(change => {
                        if (change && change.time && change.time <= now) {
                            // This change should be applied
                            latestPriority = change.newPriority;
                        } else if (change && change.time) {
                            // Keep this change for later
                            pendingChanges.push(change);
                        }
                    });

                    // Apply the most recent triggered priority change
                    if (latestPriority !== null) {
                        todosRef.doc(doc.id).update({
                            priority: latestPriority,
                            scheduledPriorityChanges: pendingChanges,
                            scheduledPriorityChange: null // Clear legacy field
                        });
                    }
                }
            });
            renderTodos(currentDocs);
        }
    }, 60000);
}

// Get color based on priority value (10 = dark red, 0 = white)
function getPriorityColor(priority) {
    const p = Math.max(0, Math.min(10, priority || 0));
    const ratio = p / 10; // 0 at priority 0, 1 at priority 10

    // White (255, 255, 255) to Dark Red (200, 100, 100)
    const r = Math.round(255 - (55 * ratio));
    const g = Math.round(255 - (155 * ratio));
    const b = Math.round(255 - (155 * ratio));

    // Text: gray to dark red
    const textR = Math.round(100 + (80 * ratio));
    const textG = Math.round(100 - (60 * ratio));
    const textB = Math.round(100 - (60 * ratio));

    return {
        bg: `rgb(${r}, ${g}, ${b})`,
        text: `rgb(${textR}, ${textG}, ${textB})`
    };
}

// Format due time for display
function formatDueTime(dueTime) {
    if (!dueTime) return '';
    const date = new Date(dueTime);
    const now = new Date();

    // Format date parts in selected timezone
    const dateOptions = { timeZone: selectedTimezone, year: 'numeric', month: 'numeric', day: 'numeric' };
    const timeOptions = { timeZone: selectedTimezone, hour: '2-digit', minute: '2-digit' };

    const dateInTz = date.toLocaleDateString('en-US', dateOptions);
    const nowInTz = now.toLocaleDateString('en-US', dateOptions);

    // Calculate tomorrow in the selected timezone
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowInTz = tomorrowDate.toLocaleDateString('en-US', dateOptions);

    const timeStr = date.toLocaleTimeString([], timeOptions);

    if (dateInTz === nowInTz) return `Today ${timeStr}`;
    if (dateInTz === tomorrowInTz) return `Tomorrow ${timeStr}`;
    return date.toLocaleDateString([], { timeZone: selectedTimezone, month: 'short', day: 'numeric' }) + ` ${timeStr}`;
}

// Render scheduled changes list
function renderScheduledChangesList(container, changes, onRemove) {
    if (!changes || changes.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Sort by time
    const sorted = [...changes].sort((a, b) => a.time - b.time);

    container.innerHTML = sorted.map((change, index) => `
        <div class="scheduled-change-item" data-index="${index}">
            <div class="scheduled-change-info">
                <span>${formatDueTime(change.time)}</span>
                <span>→ Priority ${change.newPriority}</span>
            </div>
            <button type="button" class="scheduled-change-remove" data-index="${index}">×</button>
        </div>
    `).join('');

    // Add remove handlers
    container.querySelectorAll('.scheduled-change-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index);
            onRemove(idx);
        });
    });
}

// Render scheduled SMS list
function renderScheduledSmsList(container, smsList, onRemove) {
    if (!smsList || smsList.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Sort by time
    const sorted = [...smsList].sort((a, b) => a.time - b.time);

    container.innerHTML = sorted.map((sms, index) => `
        <div class="scheduled-sms-item" data-index="${index}">
            <div class="scheduled-sms-header">
                <span class="scheduled-sms-time">${formatDueTime(sms.time)}</span>
                <button type="button" class="scheduled-sms-remove" data-index="${index}">x</button>
            </div>
            ${sms.message ? `<div class="scheduled-sms-message">"${escapeHtml(sms.message)}"</div>` : ''}
        </div>
    `).join('');

    // Add remove handlers
    container.querySelectorAll('.scheduled-sms-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index);
            onRemove(idx);
        });
    });
}

// Get priority section for a priority value
function getPrioritySection(priority) {
    const p = priority || 0;
    if (p >= 10) return 'urgent';
    if (p >= 7) return 'high';
    if (p >= 4) return 'medium';
    return 'low';
}

// Render a single todo item
function renderTodoItem(doc) {
    const todo = doc.data();
    const colors = getPriorityColor(todo.priority);
    const overdue = isOverdue(todo);
    const dueTimeDisplay = todo.dueTime ? formatDueTime(todo.dueTime) : '';
    const hasNotes = todo.notes && todo.notes.trim().length > 0;
    const hasTags = todo.tags && todo.tags.length > 0;
    const hasRecurrence = todo.recurrence && todo.recurrence.type && todo.recurrence.type !== RECURRENCE_TYPES.NONE;
    const isUrgent = (todo.priority || 0) >= 10;
    const classes = ['todo-item'];
    if (todo.completed) classes.push('completed');
    if (isUrgent && !todo.completed) classes.push('urgent');
    if (overdue) classes.push('overdue');

    const showSnooze = isUrgent && !todo.completed;
    const dueTimeDatetime = todo.dueTime ? new Date(todo.dueTime).toISOString().slice(0, 16) : '';

    // Hide due time and priority for completed tasks
    const showDueTime = !todo.completed;
    const showPriority = !todo.completed;

    // Recurrence indicator
    const recurrenceIndicator = hasRecurrence
        ? `<span class="recurrence-indicator" title="${escapeHtml(formatRecurrenceRule(todo.recurrence))}">&#x1F501;</span>`
        : '';

    return `
        <li class="${classes.join(' ')}"
            data-id="${doc.id}"
            data-duetime="${todo.dueTime || ''}"
            draggable="true"
            style="background-color: ${todo.completed ? '' : (overdue ? '#ffcdd2' : colors.bg)}">
            <div class="todo-main-row">
                <span class="drag-handle">&#8942;&#8942;</span>
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                ${recurrenceIndicator}
                ${hasTags ? renderTagBadges(todo.tags) : ''}
                ${hasNotes ? '<span class="notes-indicator" title="Has notes">📝</span>' : ''}
                ${showSnooze ? '<button class="snooze-btn" title="Snooze 1 hour">😴</button>' : ''}
                ${showDueTime ? `<button class="due-time-btn" title="Set due time">${dueTimeDisplay || '⏰'}</button>` : ''}
                ${showPriority ? `<span class="priority-badge" style="background-color: ${colors.bg}; color: ${colors.text}">${formatPriority(todo.priority)}</span>` : ''}
                <button class="delete-btn">&times;</button>
            </div>
            <div class="todo-inline-detail">
                <div class="inline-detail-field">
                    <label>Due</label>
                    <input type="text" class="inline-due-text" placeholder="e.g. tomorrow 3pm" value="${dueTimeDisplay}">
                    <input type="datetime-local" class="inline-due-datetime" value="${dueTimeDatetime}">
                </div>
                <div class="inline-detail-field">
                    <label>Priority</label>
                    <input type="number" class="inline-priority" min="0" max="10" step="0.1" value="${todo.priority || 5}">
                </div>
                <div class="inline-detail-field">
                    <label>Tags</label>
                    <input type="text" class="inline-tags" placeholder="Tags (comma separated)" value="${formatTags(todo.tags)}">
                </div>
                <div class="inline-detail-field">
                    <label>Notes</label>
                    <textarea class="inline-notes" placeholder="Add notes...">${escapeHtml(todo.notes || '')}</textarea>
                </div>
            </div>
        </li>
    `;
}

// Check if a todo matches the search query and tag filters
function matchesSearch(doc) {
    const data = doc.data();

    // Check tag filter first
    if (selectedFilterTags.length > 0) {
        const todoTags = data.tags || [];
        const hasMatchingTag = selectedFilterTags.some(tag => todoTags.includes(tag));
        if (!hasMatchingTag) return false;
    }

    // Then check search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const text = (data.text || '').toLowerCase();
    const notes = (data.notes || '').toLowerCase();
    const tags = (data.tags || []).join(' ').toLowerCase();
    return text.includes(query) || notes.includes(query) || tags.includes(query);
}

// Get all unique tags from current todos
function getAllTags() {
    const tagSet = new Set();
    currentDocs.forEach(doc => {
        const tags = doc.data().tags || [];
        tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
}

// Render the tag filter dropdown
function renderTagFilterDropdown() {
    const allTags = getAllTags();

    if (allTags.length === 0) {
        tagFilterDropdown.innerHTML = '<div class="no-tags">No tags yet</div>';
        return;
    }

    let html = allTags.map(tag => {
        const colors = getTagColor(tag);
        const isChecked = selectedFilterTags.includes(tag);
        return `
            <label class="tag-filter-item">
                <input type="checkbox" value="${escapeHtml(tag)}" ${isChecked ? 'checked' : ''}>
                <span class="tag-badge" style="background-color: ${colors.bg}; color: ${colors.text}">${escapeHtml(tag)}</span>
            </label>
        `;
    }).join('');

    if (selectedFilterTags.length > 0) {
        html += `
            <div class="clear-filter">
                <button type="button" id="clear-tag-filter">Clear filter</button>
            </div>
        `;
    }

    tagFilterDropdown.innerHTML = html;
}

// Update tag filter button state
function updateTagFilterButton() {
    if (selectedFilterTags.length > 0) {
        tagFilterBtn.classList.add('active');
        tagFilterBtn.textContent = `Tags (${selectedFilterTags.length}) ▾`;
    } else {
        tagFilterBtn.classList.remove('active');
        tagFilterBtn.textContent = 'Filter by tags ▾';
    }
}

// Render todos to the DOM
function renderTodos(docs) {
    // Filter by search query
    const filteredDocs = docs.filter(matchesSearch);

    // Show message if searching with no results
    if (filteredDocs.length === 0 && searchQuery) {
        todoList.innerHTML = '<li class="empty-state">No matching tasks found.</li>';
        return;
    }

    // Separate completed and uncompleted
    const uncompleted = filteredDocs.filter(d => !d.data().completed);
    const completed = filteredDocs.filter(d => d.data().completed);

    // Group uncompleted by priority section
    const sections = {
        urgent: uncompleted.filter(d => getPrioritySection(d.data().priority) === 'urgent'),
        high: uncompleted.filter(d => getPrioritySection(d.data().priority) === 'high'),
        medium: uncompleted.filter(d => getPrioritySection(d.data().priority) === 'medium'),
        low: uncompleted.filter(d => getPrioritySection(d.data().priority) === 'low')
    };

    let html = '';

    // Always render all sections (so items can be dragged into them)
    html += `<li class="section-header section-urgent" data-section="urgent" data-priority="10">Urgent (10)</li>`;
    html += sections.urgent.map(renderTodoItem).join('');

    html += `<li class="section-header section-high" data-section="high" data-priority="8">High (7-9)</li>`;
    html += sections.high.map(renderTodoItem).join('');

    html += `<li class="section-header section-medium" data-section="medium" data-priority="5">Medium (4-6)</li>`;
    html += sections.medium.map(renderTodoItem).join('');

    html += `<li class="section-header section-low" data-section="low" data-priority="2">Low (1-3)</li>`;
    html += sections.low.map(renderTodoItem).join('');

    // Render completed section only if there are completed items
    if (completed.length > 0) {
        html += `<li class="section-header section-completed">Completed</li>`;
        html += completed.map(renderTodoItem).join('');
    }

    todoList.innerHTML = html;
    setupDragAndDrop();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Generate a consistent color for a tag based on its name
function getTagColor(tag) {
    // Hash the tag name to get a consistent hue
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return {
        bg: `hsl(${hue}, 70%, 90%)`,
        text: `hsl(${hue}, 70%, 30%)`
    };
}

// Parse tags from comma-separated string
function parseTags(tagString) {
    if (!tagString) return [];
    return tagString.split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);
}

// Format tags array to comma-separated string
function formatTags(tags) {
    if (!tags || !Array.isArray(tags)) return '';
    return tags.join(', ');
}

// Render tags as badges
function renderTagBadges(tags) {
    if (!tags || tags.length === 0) return '';
    return `<span class="todo-tags">${tags.map(tag => {
        const colors = getTagColor(tag);
        return `<span class="tag-badge" style="background-color: ${colors.bg}; color: ${colors.text}">${escapeHtml(tag)}</span>`;
    }).join('')}</span>`;
}

// Tag bubble input management
class TagBubbleInput {
    constructor(container, input, onChange = null) {
        this.container = container;
        this.input = input;
        this.tags = [];
        this.onChange = onChange;
        this.selectedSuggestionIndex = -1;
        this.createAutocomplete();
        this.setupListeners();
    }

    createAutocomplete() {
        this.autocomplete = document.createElement('div');
        this.autocomplete.className = 'tag-autocomplete';
        this.container.appendChild(this.autocomplete);
    }

    setupListeners() {
        // Focus input when clicking container
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.input.focus();
            }
        });

        // Handle input keydown
        this.input.addEventListener('keydown', (e) => {
            const suggestions = this.autocomplete.querySelectorAll('.tag-suggestion');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, suggestions.length - 1);
                this.updateSuggestionSelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
                this.updateSuggestionSelection();
            } else if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                if (this.selectedSuggestionIndex >= 0 && suggestions[this.selectedSuggestionIndex]) {
                    this.addTag(suggestions[this.selectedSuggestionIndex].dataset.tag);
                    this.input.value = '';
                    this.hideAutocomplete();
                } else {
                    this.addTagFromInput();
                }
            } else if (e.key === 'Escape') {
                this.hideAutocomplete();
            } else if (e.key === 'Backspace' && this.input.value === '' && this.tags.length > 0) {
                this.removeTag(this.tags.length - 1);
            }
        });

        // Handle input for autocomplete
        this.input.addEventListener('input', () => {
            this.showSuggestions();
        });

        // Handle blur - add any pending tag
        this.input.addEventListener('blur', (e) => {
            // Delay to allow clicking on suggestions
            setTimeout(() => {
                this.addTagFromInput();
                this.hideAutocomplete();
            }, 150);
        });

        // Handle focus - show suggestions if there's text
        this.input.addEventListener('focus', () => {
            if (this.input.value.trim()) {
                this.showSuggestions();
            }
        });

        // Handle remove button clicks
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-remove')) {
                const index = parseInt(e.target.dataset.index);
                this.removeTag(index);
            }
        });

        // Handle suggestion clicks
        this.autocomplete.addEventListener('mousedown', (e) => {
            const suggestion = e.target.closest('.tag-suggestion');
            if (suggestion) {
                e.preventDefault();
                this.addTag(suggestion.dataset.tag);
                this.input.value = '';
                this.hideAutocomplete();
                this.input.focus();
            }
        });
    }

    showSuggestions() {
        const query = this.input.value.trim().toLowerCase();
        if (!query) {
            this.hideAutocomplete();
            return;
        }

        // Get all existing tags and filter by prefix
        const allTags = getAllTags();
        const suggestions = allTags.filter(tag =>
            tag.startsWith(query) && !this.tags.includes(tag)
        );

        if (suggestions.length === 0) {
            this.hideAutocomplete();
            return;
        }

        this.selectedSuggestionIndex = -1;
        this.autocomplete.innerHTML = suggestions.map(tag => {
            const colors = getTagColor(tag);
            return `<div class="tag-suggestion" data-tag="${escapeHtml(tag)}">
                <span class="tag-badge" style="background-color: ${colors.bg}; color: ${colors.text}">${escapeHtml(tag)}</span>
            </div>`;
        }).join('');
        this.autocomplete.classList.add('open');
    }

    hideAutocomplete() {
        this.autocomplete.classList.remove('open');
        this.selectedSuggestionIndex = -1;
    }

    updateSuggestionSelection() {
        const suggestions = this.autocomplete.querySelectorAll('.tag-suggestion');
        suggestions.forEach((el, i) => {
            el.classList.toggle('selected', i === this.selectedSuggestionIndex);
        });
    }

    addTagFromInput() {
        const value = this.input.value.trim().toLowerCase().replace(/,/g, '');
        if (value && !this.tags.includes(value)) {
            this.tags.push(value);
            this.render();
            if (this.onChange) this.onChange(this.tags);
        }
        this.input.value = '';
        this.hideAutocomplete();
    }

    addTag(tag) {
        const value = tag.trim().toLowerCase();
        if (value && !this.tags.includes(value)) {
            this.tags.push(value);
            this.render();
            if (this.onChange) this.onChange(this.tags);
        }
    }

    removeTag(index) {
        this.tags.splice(index, 1);
        this.render();
        if (this.onChange) this.onChange(this.tags);
    }

    setTags(tags) {
        this.tags = Array.isArray(tags) ? [...tags] : [];
        this.render();
    }

    getTags() {
        return [...this.tags];
    }

    clear() {
        this.tags = [];
        this.input.value = '';
        this.render();
        this.hideAutocomplete();
    }

    render() {
        // Remove existing bubbles
        const existingBubbles = this.container.querySelectorAll('.tag-bubble');
        existingBubbles.forEach(b => b.remove());

        // Add new bubbles before the input
        this.tags.forEach((tag, index) => {
            const colors = getTagColor(tag);
            const bubble = document.createElement('span');
            bubble.className = 'tag-bubble';
            bubble.style.backgroundColor = colors.bg;
            bubble.style.color = colors.text;
            bubble.innerHTML = `${escapeHtml(tag)}<button type="button" class="tag-remove" data-index="${index}">×</button>`;
            this.container.insertBefore(bubble, this.input);
        });
    }
}

// Initialize tag inputs
let addFormTagInput;
let detailTagInput;

// Format priority for display (remove trailing zeros)
function formatPriority(priority) {
    const num = Number(priority);
    if (Number.isInteger(num)) return num.toString();
    return num.toFixed(1).replace(/\.0$/, '');
}

// Add a new todo
async function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    let priority = parseFloat(prioritySelect.value);
    if (isNaN(priority) || priority < 0) priority = 0;
    if (priority > 10) priority = 10;

    // Use datetime picker if set, otherwise parse text input
    let dueTime = null;
    if (dueTimeDatetime.value) {
        dueTime = new Date(dueTimeDatetime.value).toISOString();
    } else if (dueTimeInput.value.trim()) {
        dueTime = parseNaturalDate(dueTimeInput.value);
    }

    const tags = addFormTagInput ? addFormTagInput.getTags() : [];
    const notes = notesInput.value.trim();

    // Get recurrence settings from add form
    const recurrence = getRecurrenceFromForm('add');

    await todosRef.add({
        userId: currentUser.id,
        text: text,
        priority: priority,
        completed: false,
        deleted: false,
        dueTime: dueTime,
        tags: tags,
        notes: notes || '',
        recurrence: recurrence && recurrence.type !== RECURRENCE_TYPES.NONE ? recurrence : null,
        scheduledPriorityChanges: addFormScheduledChanges.length > 0 ? [...addFormScheduledChanges] : null,
        scheduledSms: addFormScheduledSms.length > 0 ? [...addFormScheduledSms] : null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    todoInput.value = '';
    prioritySelect.value = '5';
    dueTimeInput.value = '';
    dueTimeDatetime.value = '';
    if (addFormTagInput) addFormTagInput.clear();
    notesInput.value = '';
    addScheduledTimeText.value = '';
    addScheduledTimeDatetime.value = '';
    addScheduledPriority.value = '';
    addFormScheduledChanges = [];
    renderScheduledChangesList(addScheduledList, addFormScheduledChanges, () => {});
    // Clear SMS scheduling inputs
    if (addSmsTimeText) addSmsTimeText.value = '';
    if (addSmsTimeDatetime) addSmsTimeDatetime.value = '';
    if (addSmsMessage) addSmsMessage.value = '';
    addFormScheduledSms = [];
    renderScheduledSmsList(addSmsList, addFormScheduledSms, () => {});
    // Reset recurrence form
    resetRecurrenceForm('add');
    addAdvancedOptions.classList.remove('expanded');
    todoInput.focus();
}

// Toggle todo completion
async function toggleTodo(id, completed) {
    // If completing a recurring todo, create the next occurrence
    if (!completed) {
        const doc = currentDocs.find(d => d.id === id);
        if (doc) {
            const todo = doc.data();
            const recurrence = todo.recurrence;

            if (recurrence && recurrence.type !== RECURRENCE_TYPES.NONE) {
                // Check if we should create another occurrence
                const shouldCreateNext = hasRemainingOccurrences(recurrence);

                if (shouldCreateNext) {
                    // Calculate next due date
                    const nextDueDate = calculateNextOccurrence(todo.dueTime, recurrence);

                    if (nextDueDate) {
                        // Update completed count for afterCount end type
                        const updatedRecurrence = { ...recurrence };
                        updatedRecurrence.completedCount = (recurrence.completedCount || 0) + 1;

                        // Check if this was the last occurrence
                        const isLastOccurrence = recurrence.endType === RECURRENCE_END_TYPES.AFTER_COUNT &&
                            updatedRecurrence.completedCount >= recurrence.endCount;

                        if (!isLastOccurrence) {
                            // Create a new todo with the next due date
                            await todosRef.add({
                                userId: currentUser.id,
                                text: todo.text,
                                priority: todo.priority,
                                completed: false,
                                deleted: false,
                                dueTime: nextDueDate,
                                tags: todo.tags || [],
                                notes: todo.notes || '',
                                recurrence: updatedRecurrence,
                                scheduledPriorityChanges: null,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        }
                    }
                }

                // Remove recurrence from the completed todo (so it doesn't show the indicator)
                await todosRef.doc(id).update({
                    completed: true,
                    recurrence: null
                });
                return;
            }
        }
    }

    await todosRef.doc(id).update({ completed: !completed });
}

// Soft delete a todo (move to deleted section)
async function deleteTodo(id) {
    await todosRef.doc(id).update({ deleted: true, deletedAt: Date.now() });
    // Close detail panel if this todo was selected
    if (selectedTodoId === id) {
        closeDetailPanel();
    }
}

// Restore a deleted todo
async function restoreTodo(id) {
    await todosRef.doc(id).update({ deleted: false, deletedAt: null });
}

// Permanently delete a todo
async function permanentlyDeleteTodo(id) {
    await todosRef.doc(id).delete();
}

// Render deleted todos
function renderDeletedTodos() {
    deletedCount.textContent = deletedDocs.length;

    if (deletedDocs.length === 0) {
        deletedList.innerHTML = '<li class="deleted-empty">No deleted tasks</li>';
        return;
    }

    // Sort by deletedAt descending (most recent first)
    const sorted = deletedDocs.slice().sort((a, b) => {
        return (b.data().deletedAt || 0) - (a.data().deletedAt || 0);
    });

    deletedList.innerHTML = sorted.map(doc => {
        const todo = doc.data();
        return `
            <li class="deleted-item" data-id="${doc.id}">
                <span class="deleted-item-text">${escapeHtml(todo.text)}</span>
                <div class="deleted-item-actions">
                    <button class="restore-btn" title="Restore">↩</button>
                    <button class="perm-delete-btn" title="Delete permanently">×</button>
                </div>
            </li>
        `;
    }).join('');
}

// Update priority for a todo
async function updatePriority(id, newPriority) {
    await todosRef.doc(id).update({ priority: newPriority });
}

// Update due time for a todo
async function updateDueTime(id, newDueTime) {
    await todosRef.doc(id).update({ dueTime: newDueTime || null });
}

// Snooze a todo for 1 hour (sets due time to 1 hour from now and lowers priority)
async function snoozeTodo(id) {
    const oneHourFromNow = Date.now() + (60 * 60 * 1000);
    await todosRef.doc(id).update({
        dueTime: oneHourFromNow,
        priority: 8 // Move to High section
    });
}

// Update notes for a todo
async function updateNotes(id, notes) {
    await todosRef.doc(id).update({ notes: notes || '' });
}

// Open detail panel for a todo
function openDetailPanel(id) {
    const doc = currentDocs.find(d => d.id === id);
    if (!doc) return;

    const todo = doc.data();
    selectedTodoId = id;

    // Get the color based on priority (or red if overdue)
    const overdue = isOverdue(todo);
    const colors = getPriorityColor(todo.priority);
    detailPanel.style.backgroundColor = overdue ? '#ffcdd2' : colors.bg;

    detailTitle.textContent = todo.text;
    detailDueInput.value = todo.dueTime ? formatDueTime(todo.dueTime) : '';
    if (todo.dueTime) {
        const date = new Date(todo.dueTime);
        detailDueDatetime.value = date.toISOString().slice(0, 16);
    } else {
        detailDueDatetime.value = '';
    }
    detailPriorityInput.value = todo.priority || 5;
    if (detailTagInput) detailTagInput.setTags(todo.tags || []);
    detailNotes.value = todo.notes || '';

    // Populate scheduled priority changes list
    let scheduledChanges = todo.scheduledPriorityChanges || [];
    // Handle legacy single scheduledPriorityChange
    if (todo.scheduledPriorityChange && todo.scheduledPriorityChange.time) {
        scheduledChanges = [todo.scheduledPriorityChange];
    }

    renderScheduledChangesList(detailScheduledList, scheduledChanges, async (index) => {
        // Remove the change at index
        const updated = scheduledChanges.filter((_, i) => i !== index);
        await todosRef.doc(selectedTodoId).update({
            scheduledPriorityChanges: updated.length > 0 ? updated : null,
            scheduledPriorityChange: null
        });
    });

    // Clear input fields for adding new
    scheduledTimeText.value = '';
    scheduledTimeDatetime.value = '';
    scheduledPriority.value = '';

    // Populate scheduled SMS list
    const scheduledSms = todo.scheduledSms || [];
    renderScheduledSmsList(detailSmsList, scheduledSms, async (index) => {
        // Remove the SMS at index
        const updated = scheduledSms.filter((_, i) => i !== index);
        await todosRef.doc(selectedTodoId).update({
            scheduledSms: updated.length > 0 ? updated : null
        });
    });

    // Clear SMS input fields
    if (detailSmsTimeText) detailSmsTimeText.value = '';
    if (detailSmsTimeDatetime) detailSmsTimeDatetime.value = '';
    if (detailSmsMessage) detailSmsMessage.value = '';

    // Populate recurrence settings
    setRecurrenceForm('detail', todo.recurrence || null);

    // Update recurrence display text
    const els = getRecurrenceElements('detail');
    if (els.recurrenceDisplay) {
        els.recurrenceDisplay.textContent = formatRecurrenceRule(todo.recurrence);
    }

    // Collapse advanced options by default
    detailAdvancedOptions.classList.remove('expanded');

    detailPanel.classList.add('open');
    detailBackdrop.classList.add('open');

    // Highlight selected item
    document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('selected');
        if (item.dataset.id === id) {
            item.classList.add('selected');
        }
    });
}

// Close detail panel
function closeDetailPanel() {
    detailPanel.classList.remove('open');
    detailBackdrop.classList.remove('open');
    dueInfoTooltip.classList.remove('open');
    selectedTodoId = null;
    document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('selected');
    });
}

// Show date input for a todo item (natural language)
function showDueTimePicker(item) {
    const id = item.dataset.id;
    const btn = item.querySelector('.due-time-btn');
    const currentDueTime = item.dataset.duetime;

    // Create container for both inputs
    const container = document.createElement('span');
    container.className = 'due-time-picker-container';

    // Create inline text input for natural language
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'due-time-input-inline';
    textInput.placeholder = 'tomorrow 3pm';

    // Create datetime-local input
    const dateInput = document.createElement('input');
    dateInput.type = 'datetime-local';
    dateInput.className = 'due-time-datetime-inline';
    if (currentDueTime) {
        const date = new Date(parseInt(currentDueTime));
        dateInput.value = date.toISOString().slice(0, 16);
    }

    container.appendChild(textInput);
    container.appendChild(dateInput);

    // Replace button with container
    btn.style.display = 'none';
    btn.insertAdjacentElement('afterend', container);
    textInput.focus();

    // Cleanup function
    const cleanup = () => {
        container.remove();
        btn.style.display = '';
    };

    // Handle save from text input
    const saveText = async () => {
        if (textInput.value.trim()) {
            const parsed = parseNaturalDate(textInput.value);
            if (parsed) {
                await updateDueTime(id, new Date(parsed).getTime());
            }
        }
        cleanup();
    };

    // Handle save from datetime input
    const saveDate = async () => {
        if (dateInput.value) {
            const timestamp = new Date(dateInput.value).getTime();
            await updateDueTime(id, timestamp);
        }
        cleanup();
    };

    textInput.addEventListener('blur', (e) => {
        // Don't save if clicking on date input
        if (e.relatedTarget === dateInput) return;
        saveText();
    });

    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveText();
        }
        if (e.key === 'Escape') {
            cleanup();
        }
    });

    dateInput.addEventListener('change', saveDate);

    dateInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cleanup();
        }
    });
}

// Show priority editor for a todo item
function showPriorityEditor(item) {
    const id = item.dataset.id;
    const badge = item.querySelector('.priority-badge');
    const currentPriority = badge.textContent;

    // Create inline number input
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'priority-input-inline';
    input.min = '0';
    input.max = '10';
    input.step = '0.1';
    input.value = currentPriority;

    // Replace badge with input
    badge.style.display = 'none';
    badge.insertAdjacentElement('afterend', input);
    input.focus();
    input.select();

    // Handle save
    const save = async () => {
        let newPriority = parseFloat(input.value);
        if (isNaN(newPriority) || newPriority < 0) newPriority = 0;
        if (newPriority > 10) newPriority = 10;
        await updatePriority(id, newPriority);
        input.remove();
        badge.style.display = '';
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
        }
        if (e.key === 'Escape') {
            input.remove();
            badge.style.display = '';
        }
    });
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const items = todoList.querySelectorAll('.todo-item');
    const sectionHeaders = todoList.querySelectorAll('.section-header[data-section]');

    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
    });

    // Allow dropping on section headers
    sectionHeaders.forEach(header => {
        header.addEventListener('dragover', handleSectionDragOver);
        header.addEventListener('dragleave', handleSectionDragLeave);
        header.addEventListener('drop', handleSectionDrop);
    });
}

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
    });
    document.querySelectorAll('.section-header').forEach(header => {
        header.classList.remove('drag-over');
    });
    draggedItem = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (this !== draggedItem) {
        // Determine if cursor is in top or bottom half
        const rect = this.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const isTopHalf = e.clientY < midpoint;

        // Remove both classes first
        this.classList.remove('drag-over-top', 'drag-over-bottom');

        // Add appropriate class
        if (isTopHalf) {
            this.classList.add('drag-over-top');
        } else {
            this.classList.add('drag-over-bottom');
        }
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over-top', 'drag-over-bottom');
}

// Section header drag handlers
function handleSectionDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

function handleSectionDragLeave(e) {
    this.classList.remove('drag-over');
}

async function handleSectionDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (!draggedItem) return;

    const draggedId = draggedItem.dataset.id;
    const draggedDoc = currentDocs.find(d => d.id === draggedId);
    if (!draggedDoc) return;

    const draggedData = draggedDoc.data();

    // Get the target priority from the section header
    const newPriority = parseFloat(this.dataset.priority);

    // Clear due time if dragging an overdue item to a lower section
    let clearDueTime = false;
    if (isOverdue(draggedData) && newPriority < 10) {
        clearDueTime = true;
    }

    const updates = { priority: newPriority };
    if (clearDueTime) {
        updates.dueTime = null;
    }
    await todosRef.doc(draggedId).update(updates);
}

// Get section bounds for a priority
function getSectionBounds(priority) {
    const p = priority || 0;
    if (p >= 10) return { min: 10, max: 10 };
    if (p >= 7) return { min: 7, max: 9.9 };
    if (p >= 4) return { min: 4, max: 6.9 };
    return { min: 0, max: 3.9 };
}

async function handleDrop(e) {
    e.preventDefault();

    // Determine if dropping above or below target
    const rect = this.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const dropAbove = e.clientY < midpoint;

    this.classList.remove('drag-over-top', 'drag-over-bottom');

    if (!draggedItem || this === draggedItem) return;

    const draggedId = draggedItem.dataset.id;
    const targetId = this.dataset.id;

    // Find the docs
    const draggedDoc = currentDocs.find(d => d.id === draggedId);
    const targetDoc = currentDocs.find(d => d.id === targetId);

    if (!draggedDoc || !targetDoc) return;

    const draggedData = draggedDoc.data();
    const targetData = targetDoc.data();
    const targetPriority = targetData.priority;
    const draggedIndex = currentDocs.findIndex(d => d.id === draggedId);
    const targetIndex = currentDocs.findIndex(d => d.id === targetId);

    // Check if dropping in the same position (no actual move)
    const droppingToSameSpot =
        (dropAbove && targetIndex === draggedIndex + 1) ||  // Dropping above the item right below
        (!dropAbove && targetIndex === draggedIndex - 1) || // Dropping below the item right above
        (dropAbove && targetIndex === draggedIndex) ||      // Dropping above itself
        (!dropAbove && targetIndex === draggedIndex);       // Dropping below itself

    if (droppingToSameSpot) return;

    // Get the target's section bounds
    const sectionBounds = getSectionBounds(targetPriority);

    let newPriority;
    let clearDueTime = false;

    // If dragging an overdue item to a lower position, clear its due time
    if (isOverdue(draggedData) && !dropAbove) {
        clearDueTime = true;
    }

    if (dropAbove) {
        // Dropping above target - set priority slightly higher than target
        const aboveDoc = targetIndex > 0 ? currentDocs[targetIndex - 1] : null;
        const abovePriority = aboveDoc ? aboveDoc.data().priority : sectionBounds.max + 0.1;
        newPriority = Math.round((targetPriority + abovePriority) / 2 * 10) / 10;
        if (newPriority <= targetPriority) newPriority = targetPriority + 0.1;
    } else {
        // Dropping below target - set priority slightly lower than target
        const belowDoc = targetIndex < currentDocs.length - 1 ? currentDocs[targetIndex + 1] : null;
        const belowPriority = belowDoc ? belowDoc.data().priority : sectionBounds.min - 0.1;
        newPriority = Math.round((targetPriority + belowPriority) / 2 * 10) / 10;
        if (newPriority >= targetPriority) newPriority = targetPriority - 0.1;
    }

    // Clamp to section bounds
    newPriority = Math.max(sectionBounds.min, Math.min(sectionBounds.max, newPriority));
    // Also clamp to overall bounds
    newPriority = Math.max(0, Math.min(10, newPriority));
    // Round to 1 decimal
    newPriority = Math.round(newPriority * 10) / 10;

    // Update priority and optionally clear due time
    const updates = { priority: newPriority };
    if (clearDueTime) {
        updates.dueTime = null;
    }
    await todosRef.doc(draggedId).update(updates);
}

// Export all todos to a JSON file
async function exportBackup() {
    try {
        const snapshot = await todosRef.get();
        const todos = [];
        snapshot.forEach(doc => {
            todos.push({
                id: doc.id,
                ...doc.data()
            });
        });

        const backup = {
            version: 1,
            exportedAt: new Date().toISOString(),
            timezone: selectedTimezone,
            todos: todos
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export backup. Please try again.');
    }
}

// Import todos from a JSON backup file
async function importBackup(file) {
    try {
        if (!currentUser) {
            alert('Please log in to import todos.');
            return;
        }

        const text = await file.text();
        const backup = JSON.parse(text);

        if (!backup.todos || !Array.isArray(backup.todos)) {
            throw new Error('Invalid backup file format');
        }

        const confirmMsg = `This will import ${backup.todos.length} todos as new items. Continue?`;
        if (!confirm(confirmMsg)) return;

        let imported = 0;
        for (const todo of backup.todos) {
            // Always create new documents with new IDs to avoid conflicts
            // eslint-disable-next-line no-unused-vars
            const { id, userId, createdAt, ...data } = todo;

            // Create new todo assigned to current user
            await todosRef.add({
                ...data,
                userId: currentUser.id,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            imported++;
        }

        alert(`Successfully imported ${imported} todos.`);
    } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import backup. Please check the file format and try again.');
    }
}

// Event listeners
addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

// Sync datetime picker with text input
dueTimeDatetime.addEventListener('change', () => {
    if (dueTimeDatetime.value) {
        dueTimeInput.value = formatDueTime(new Date(dueTimeDatetime.value).getTime());
    }
});

// Add form advanced options toggle
addAdvancedToggle.addEventListener('click', () => {
    addAdvancedOptions.classList.toggle('expanded');
});

// Sync add form scheduled datetime with text input
addScheduledTimeDatetime.addEventListener('change', () => {
    if (addScheduledTimeDatetime.value) {
        addScheduledTimeText.value = formatDueTime(new Date(addScheduledTimeDatetime.value).getTime());
    }
});

// Parse natural language for add form scheduled time
addScheduledTimeText.addEventListener('blur', () => {
    const value = addScheduledTimeText.value.trim();
    if (value) {
        const parsed = parseNaturalDate(value);
        if (parsed) {
            const timestamp = new Date(parsed).getTime();
            addScheduledTimeDatetime.value = new Date(timestamp).toISOString().slice(0, 16);
        }
    }
});

// Backup/restore
exportBtn.addEventListener('click', exportBackup);
importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        importBackup(file);
        e.target.value = ''; // Reset so same file can be selected again
    }
});

// Search functionality
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderTodos(currentDocs);
});

// Tag filter functionality
tagFilterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    renderTagFilterDropdown();
    tagFilterDropdown.classList.toggle('open');
});

tagFilterDropdown.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
        const tag = e.target.value;
        if (e.target.checked) {
            if (!selectedFilterTags.includes(tag)) {
                selectedFilterTags.push(tag);
            }
        } else {
            selectedFilterTags = selectedFilterTags.filter(t => t !== tag);
        }
        updateTagFilterButton();
        renderTodos(currentDocs);
        renderTagFilterDropdown();
    }
});

tagFilterDropdown.addEventListener('click', (e) => {
    if (e.target.id === 'clear-tag-filter') {
        selectedFilterTags = [];
        updateTagFilterButton();
        renderTodos(currentDocs);
        renderTagFilterDropdown();
    }
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!tagFilterBtn.contains(e.target) && !tagFilterDropdown.contains(e.target)) {
        tagFilterDropdown.classList.remove('open');
    }
});

todoList.addEventListener('click', (e) => {
    const item = e.target.closest('.todo-item');
    if (!item) return;

    const id = item.dataset.id;

    if (e.target.classList.contains('todo-checkbox')) {
        const isCompleted = item.classList.contains('completed');
        toggleTodo(id, isCompleted);
    }

    if (e.target.classList.contains('delete-btn')) {
        deleteTodo(id);
    }

    if (e.target.classList.contains('due-time-btn')) {
        showDueTimePicker(item);
    }

    if (e.target.classList.contains('snooze-btn')) {
        snoozeTodo(id);
    }

    if (e.target.classList.contains('priority-badge')) {
        showPriorityEditor(item);
        return;
    }

    // Click anywhere else on the item opens detail panel (desktop) or expands inline (mobile)
    // (but not on interactive elements like checkbox, buttons, inputs, etc.)
    if (!e.target.classList.contains('todo-checkbox') &&
        !e.target.classList.contains('delete-btn') &&
        !e.target.classList.contains('due-time-btn') &&
        !e.target.classList.contains('snooze-btn') &&
        !e.target.classList.contains('priority-badge') &&
        !e.target.closest('.due-time-input-inline') &&
        !e.target.closest('.priority-input-inline') &&
        !e.target.closest('.todo-inline-detail')) {

        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            // Toggle inline expansion on mobile
            const wasExpanded = item.classList.contains('expanded');
            // Collapse all other items
            document.querySelectorAll('.todo-item.expanded').forEach(el => {
                el.classList.remove('expanded');
            });
            // Toggle this item
            if (!wasExpanded) {
                item.classList.add('expanded');
            }
        } else {
            // Open detail panel on desktop
            openDetailPanel(id);
        }
    }
});

// Inline detail input handlers (for mobile)
todoList.addEventListener('change', async (e) => {
    const item = e.target.closest('.todo-item');
    if (!item) return;
    const id = item.dataset.id;

    // Inline priority change
    if (e.target.classList.contains('inline-priority')) {
        const priority = parseFloat(e.target.value) || 5;
        const clampedPriority = Math.max(0, Math.min(10, priority));
        await todosRef.doc(id).update({ priority: clampedPriority });
    }

    // Inline datetime change
    if (e.target.classList.contains('inline-due-datetime')) {
        if (e.target.value) {
            const timestamp = new Date(e.target.value).getTime();
            await todosRef.doc(id).update({ dueTime: timestamp });
        } else {
            await todosRef.doc(id).update({ dueTime: null });
        }
    }
});

todoList.addEventListener('blur', async (e) => {
    const item = e.target.closest('.todo-item');
    if (!item) return;
    const id = item.dataset.id;

    // Inline due text (natural language)
    if (e.target.classList.contains('inline-due-text')) {
        const value = e.target.value.trim();
        if (value === '') {
            await todosRef.doc(id).update({ dueTime: null });
        } else {
            const parsed = parseNaturalDate(value);
            if (parsed) {
                const timestamp = new Date(parsed).getTime();
                await todosRef.doc(id).update({ dueTime: timestamp });
            }
        }
    }

    // Inline tags
    if (e.target.classList.contains('inline-tags')) {
        const tags = parseTags(e.target.value);
        await todosRef.doc(id).update({ tags: tags });
    }

    // Inline notes
    if (e.target.classList.contains('inline-notes')) {
        await todosRef.doc(id).update({ notes: e.target.value || '' });
    }
}, true); // Use capture to catch blur events

// Detail panel event listeners
detailClose.addEventListener('click', closeDetailPanel);
detailBackdrop.addEventListener('click', closeDetailPanel);

// Due date info icon toggle
dueInfoIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    dueInfoTooltip.classList.toggle('open');
});

// Close tooltip when clicking elsewhere in detail panel
detailPanel.addEventListener('click', (e) => {
    if (!dueInfoIcon.contains(e.target) && !dueInfoTooltip.contains(e.target)) {
        dueInfoTooltip.classList.remove('open');
    }
});

// Add form due date info icon toggle
addDueInfoIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    addDueInfoTooltip.classList.toggle('open');
});

// Close add form tooltip when clicking elsewhere
document.addEventListener('click', (e) => {
    if (!addDueInfoIcon.contains(e.target) && !addDueInfoTooltip.contains(e.target)) {
        addDueInfoTooltip.classList.remove('open');
    }
});

// Save notes on blur
detailNotes.addEventListener('blur', () => {
    if (selectedTodoId) {
        updateNotes(selectedTodoId, detailNotes.value);
    }
});

// Also save notes after typing stops (debounced)
let notesTimeout;
detailNotes.addEventListener('input', () => {
    clearTimeout(notesTimeout);
    notesTimeout = setTimeout(() => {
        if (selectedTodoId) {
            updateNotes(selectedTodoId, detailNotes.value);
        }
    }, 1000);
});

// Save due date on blur (with natural language parsing)
detailDueInput.addEventListener('blur', async () => {
    if (!selectedTodoId) return;
    const value = detailDueInput.value.trim();
    if (value === '') {
        // Clear the due date
        await todosRef.doc(selectedTodoId).update({ dueTime: null });
    } else {
        const parsed = parseNaturalDate(value);
        if (parsed) {
            // parseNaturalDate returns an ISO string, convert to timestamp
            const timestamp = new Date(parsed).getTime();
            await todosRef.doc(selectedTodoId).update({ dueTime: timestamp });
        }
    }
});

// Save due date on Enter key
detailDueInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        detailDueInput.blur();
    }
});

// Save due date from datetime picker
detailDueDatetime.addEventListener('change', async () => {
    if (!selectedTodoId) return;
    if (detailDueDatetime.value) {
        const timestamp = new Date(detailDueDatetime.value).getTime();
        await todosRef.doc(selectedTodoId).update({ dueTime: timestamp });
    } else {
        await todosRef.doc(selectedTodoId).update({ dueTime: null });
    }
});

// Save priority on change
detailPriorityInput.addEventListener('change', async () => {
    if (!selectedTodoId) return;
    const priority = parseFloat(detailPriorityInput.value) || 5;
    const clampedPriority = Math.max(0, Math.min(10, priority));
    await todosRef.doc(selectedTodoId).update({ priority: clampedPriority });
});

// Save priority on blur
detailPriorityInput.addEventListener('blur', async () => {
    if (!selectedTodoId) return;
    const priority = parseFloat(detailPriorityInput.value) || 5;
    const clampedPriority = Math.max(0, Math.min(10, priority));
    await todosRef.doc(selectedTodoId).update({ priority: clampedPriority });
});

// Advanced options toggle (detail panel)
advancedToggle.addEventListener('click', () => {
    detailAdvancedOptions.classList.toggle('expanded');
});

// Save scheduled priority change - helper function
// Add a scheduled priority change to an existing todo
async function addScheduledPriorityChangeToTodo() {
    if (!selectedTodoId) return;

    const timeValue = scheduledTimeDatetime.value;
    const priorityValue = scheduledPriority.value;

    // Both time and priority must be set
    if (!timeValue || priorityValue === '') {
        return;
    }

    const scheduledTime = new Date(timeValue).getTime();
    const newPriority = Math.max(0, Math.min(10, parseFloat(priorityValue) || 5));

    // Get current todo data
    const doc = currentDocs.find(d => d.id === selectedTodoId);
    if (!doc) return;

    const todo = doc.data();
    let existingChanges = todo.scheduledPriorityChanges || [];
    // Handle legacy single change
    if (todo.scheduledPriorityChange && todo.scheduledPriorityChange.time) {
        existingChanges = [todo.scheduledPriorityChange];
    }

    // Add the new change
    const newChange = { time: scheduledTime, newPriority: newPriority };
    const updatedChanges = [...existingChanges, newChange];

    await todosRef.doc(selectedTodoId).update({
        scheduledPriorityChanges: updatedChanges,
        scheduledPriorityChange: null // Clear legacy field
    });

    // Re-render the list with updated changes
    refreshDetailScheduledList(updatedChanges);

    // Clear input fields
    scheduledTimeText.value = '';
    scheduledTimeDatetime.value = '';
    scheduledPriority.value = '';
}

// Helper to refresh the detail panel's scheduled changes list
function refreshDetailScheduledList(changes) {
    renderScheduledChangesList(detailScheduledList, changes, async (index) => {
        const updated = changes.filter((_, i) => i !== index);
        await todosRef.doc(selectedTodoId).update({
            scheduledPriorityChanges: updated.length > 0 ? updated : null,
            scheduledPriorityChange: null
        });
        refreshDetailScheduledList(updated);
    });
}

// Scheduled time text input (natural language) - just parse, don't auto-save
scheduledTimeText.addEventListener('blur', () => {
    const value = scheduledTimeText.value.trim();
    if (value) {
        const parsed = parseNaturalDate(value);
        if (parsed) {
            const timestamp = new Date(parsed).getTime();
            scheduledTimeDatetime.value = new Date(timestamp).toISOString().slice(0, 16);
        }
    }
});

// Scheduled datetime picker - sync with text field
scheduledTimeDatetime.addEventListener('change', () => {
    if (scheduledTimeDatetime.value) {
        scheduledTimeText.value = formatDueTime(new Date(scheduledTimeDatetime.value).getTime());
    }
});

// Detail panel add scheduled change button
addDetailScheduledBtn.addEventListener('click', addScheduledPriorityChangeToTodo);

// Add form - add scheduled change to list
function renderAddFormScheduledChanges() {
    renderScheduledChangesList(addScheduledList, addFormScheduledChanges, (index) => {
        addFormScheduledChanges.splice(index, 1);
        renderAddFormScheduledChanges();
    });
}

addScheduledBtn.addEventListener('click', () => {
    const timeValue = addScheduledTimeDatetime.value;
    const priorityValue = addScheduledPriority.value;

    if (!timeValue || priorityValue === '') {
        return;
    }

    const scheduledTime = new Date(timeValue).getTime();
    const newPriority = Math.max(0, Math.min(10, parseFloat(priorityValue) || 5));

    addFormScheduledChanges.push({ time: scheduledTime, newPriority: newPriority });
    renderAddFormScheduledChanges();

    // Clear inputs
    addScheduledTimeText.value = '';
    addScheduledTimeDatetime.value = '';
    addScheduledPriority.value = '';
});

// Deleted panel toggle
deletedHeader.addEventListener('click', () => {
    deletedPanel.classList.toggle('expanded');
});

// Deleted list event handlers
deletedList.addEventListener('click', (e) => {
    const item = e.target.closest('.deleted-item');
    if (!item) return;
    const id = item.dataset.id;

    if (e.target.classList.contains('restore-btn')) {
        restoreTodo(id);
    }

    if (e.target.classList.contains('perm-delete-btn')) {
        permanentlyDeleteTodo(id);
    }
});

// Timezone selector change
timezoneSelect.addEventListener('change', (e) => {
    selectedTimezone = e.target.value;
    localStorage.setItem('timezone', selectedTimezone);
    // Re-render to update all displayed times
    renderTodos(currentDocs);
    // Update detail panel if open
    if (selectedTodoId) {
        openDetailPanel(selectedTodoId);
    }
});

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
}

// Initialize timezone selector
initTimezoneSelector();

// Initialize tag bubble inputs
addFormTagInput = new TagBubbleInput(tagsInputContainer, tagsInput);
detailTagInput = new TagBubbleInput(detailTagsContainer, detailTags, async (tags) => {
    if (selectedTodoId) {
        await todosRef.doc(selectedTodoId).update({ tags: tags });
    }
});

// Auth event listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';

    const username = loginUsername.value.trim().toLowerCase();
    const password = loginPassword.value;

    try {
        // Find user by username
        const snapshot = await usersRef.where('username', '==', username).get();
        if (snapshot.empty) {
            loginError.textContent = 'User not found';
            return;
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        // Check password
        const hashedPassword = await hashPassword(password);
        if (userData.password !== hashedPassword) {
            loginError.textContent = 'Incorrect password';
            return;
        }

        // Login successful
        currentUser = { id: userDoc.id, username: userData.username };
        localStorage.setItem('todoUser', JSON.stringify(currentUser));
        loginForm.reset();
        showApp();
    } catch (error) {
        loginError.textContent = 'Login failed. Please try again.';
        console.error('Login error:', error);
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signupError.textContent = '';

    const username = signupUsername.value.trim().toLowerCase();
    const password = signupPassword.value;
    const confirm = signupConfirm.value;

    // Validate username
    if (!/^[a-z0-9_]+$/.test(username)) {
        signupError.textContent = 'Username can only contain letters, numbers, and underscores';
        return;
    }

    if (username.length < 3) {
        signupError.textContent = 'Username must be at least 3 characters';
        return;
    }

    if (password !== confirm) {
        signupError.textContent = 'Passwords do not match';
        return;
    }

    try {
        // Check if username already exists
        const existing = await usersRef.where('username', '==', username).get();
        if (!existing.empty) {
            signupError.textContent = 'Username already taken';
            return;
        }

        // Create user
        const hashedPassword = await hashPassword(password);
        const newUserRef = await usersRef.add({
            username: username,
            password: hashedPassword,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Auto-login after signup
        currentUser = { id: newUserRef.id, username: username };
        localStorage.setItem('todoUser', JSON.stringify(currentUser));
        signupForm.reset();
        showApp();
    } catch (error) {
        signupError.textContent = 'Signup failed. Please try again.';
        console.error('Signup error:', error);
    }
});

logoutBtn.addEventListener('click', () => {
    showLogin();
});

// Auth tab switching
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;

        // Update active tab
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show/hide forms
        if (targetTab === 'login') {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
        }

        // Clear errors
        loginError.textContent = '';
        signupError.textContent = '';
    });
});

// ============================================
// PHONE SETTINGS MODAL FUNCTIONALITY
// ============================================

// Open phone settings modal
function openPhoneSettingsModal() {
    phoneError.textContent = '';
    phoneSuccess.textContent = '';
    newPhoneInput.value = '';
    loadUserPhones();
    phoneModalBackdrop.classList.add('open');
    phoneSettingsModal.classList.add('open');
}

// Close phone settings modal
function closePhoneSettingsModal() {
    phoneModalBackdrop.classList.remove('open');
    phoneSettingsModal.classList.remove('open');
}

// Load and render user's phone numbers
async function loadUserPhones() {
    if (!currentUser) return;

    try {
        const userDoc = await usersRef.doc(currentUser.id).get();
        const userData = userDoc.data();
        const phones = userData.phoneNumbers || [];
        renderPhoneList(phones);
    } catch (error) {
        console.error('Failed to load phone numbers:', error);
        phoneError.textContent = 'Failed to load phone numbers.';
    }
}

// Render the phone list
function renderPhoneList(phones) {
    if (!phones || phones.length === 0) {
        phoneList.innerHTML = '<div class="phone-empty">No phone numbers added yet.</div>';
        return;
    }

    phoneList.innerHTML = phones.map((phone, index) => `
        <div class="phone-item" data-index="${index}">
            <span class="phone-item-number">${escapeHtml(phone)}</span>
            <button class="phone-item-remove" data-phone="${escapeHtml(phone)}" title="Remove">x</button>
        </div>
    `).join('');
}

// Validate phone number format
// Accepts formats like: +1234567890, +1 234 567 8901, +44 20 7946 0958, etc.
function isValidPhoneNumber(phone) {
    // Remove all spaces for validation
    const cleaned = phone.replace(/\s/g, '');
    // Must start with + and contain only digits after that (minimum 10 digits total)
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(cleaned);
}

// Add a new phone number
async function addPhone() {
    let phone = newPhoneInput.value.trim();
    phoneError.textContent = '';
    phoneSuccess.textContent = '';

    if (!phone) {
        phoneError.textContent = 'Please enter a phone number.';
        return;
    }

    // Normalize the phone number (remove spaces)
    phone = phone.replace(/\s/g, '');

    if (!isValidPhoneNumber(phone)) {
        phoneError.textContent = 'Please enter a valid phone number with country code (e.g. +1234567890).';
        return;
    }

    try {
        const userDoc = await usersRef.doc(currentUser.id).get();
        const userData = userDoc.data();
        const phones = userData.phoneNumbers || [];

        if (phones.includes(phone)) {
            phoneError.textContent = 'This phone number is already added.';
            return;
        }

        phones.push(phone);
        await usersRef.doc(currentUser.id).update({ phoneNumbers: phones });

        newPhoneInput.value = '';
        phoneSuccess.textContent = 'Phone number added successfully!';
        renderPhoneList(phones);

        // Clear success message after 3 seconds
        setTimeout(() => {
            phoneSuccess.textContent = '';
        }, 3000);
    } catch (error) {
        console.error('Failed to add phone number:', error);
        phoneError.textContent = 'Failed to add phone number. Please try again.';
    }
}

// Remove a phone number
async function removePhone(phone) {
    phoneError.textContent = '';
    phoneSuccess.textContent = '';

    try {
        const userDoc = await usersRef.doc(currentUser.id).get();
        const userData = userDoc.data();
        const phones = (userData.phoneNumbers || []).filter(p => p !== phone);

        await usersRef.doc(currentUser.id).update({ phoneNumbers: phones });

        phoneSuccess.textContent = 'Phone number removed.';
        renderPhoneList(phones);

        setTimeout(() => {
            phoneSuccess.textContent = '';
        }, 3000);
    } catch (error) {
        console.error('Failed to remove phone number:', error);
        phoneError.textContent = 'Failed to remove phone number. Please try again.';
    }
}

// Phone settings event listeners
phoneSettingsBtn.addEventListener('click', openPhoneSettingsModal);
phoneModalClose.addEventListener('click', closePhoneSettingsModal);
phoneModalBackdrop.addEventListener('click', closePhoneSettingsModal);
addPhoneBtn.addEventListener('click', addPhone);
newPhoneInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addPhone();
    }
});
phoneList.addEventListener('click', (e) => {
    if (e.target.classList.contains('phone-item-remove')) {
        const phone = e.target.dataset.phone;
        if (phone) removePhone(phone);
    }
});

// ============================================
// SMS SCHEDULING FUNCTIONALITY
// ============================================

// Add scheduled SMS to detail panel todo
async function addScheduledSmsToTodo() {
    if (!selectedTodoId) return;

    const timeValue = detailSmsTimeDatetime ? detailSmsTimeDatetime.value : null;
    const message = detailSmsMessage ? detailSmsMessage.value.trim() : '';

    if (!timeValue) {
        return; // Silently return if no time set
    }

    const scheduledTime = new Date(timeValue).getTime();

    // Get current todo data
    const doc = currentDocs.find(d => d.id === selectedTodoId);
    if (!doc) return;

    const todo = doc.data();
    const existingSms = todo.scheduledSms || [];

    // Add the new SMS
    const newSms = {
        time: scheduledTime,
        message: message || `Reminder: ${todo.text}`,
        sent: false
    };
    const updatedSms = [...existingSms, newSms];

    await todosRef.doc(selectedTodoId).update({
        scheduledSms: updatedSms
    });

    // Clear input fields
    if (detailSmsTimeText) detailSmsTimeText.value = '';
    if (detailSmsTimeDatetime) detailSmsTimeDatetime.value = '';
    if (detailSmsMessage) detailSmsMessage.value = '';
}

// Render add form scheduled SMS
function renderAddFormScheduledSms() {
    renderScheduledSmsList(addSmsList, addFormScheduledSms, (index) => {
        addFormScheduledSms.splice(index, 1);
        renderAddFormScheduledSms();
    });
}

// Detail panel SMS button
if (addDetailSmsBtn) {
    addDetailSmsBtn.addEventListener('click', addScheduledSmsToTodo);
}

// Detail panel SMS datetime picker - sync with text field
if (detailSmsTimeDatetime) {
    detailSmsTimeDatetime.addEventListener('change', () => {
        if (detailSmsTimeDatetime.value && detailSmsTimeText) {
            detailSmsTimeText.value = formatDueTime(new Date(detailSmsTimeDatetime.value).getTime());
        }
    });
}

// Detail panel SMS text input (natural language)
if (detailSmsTimeText) {
    detailSmsTimeText.addEventListener('blur', () => {
        const value = detailSmsTimeText.value.trim();
        if (value) {
            const parsed = parseNaturalDate(value);
            if (parsed && detailSmsTimeDatetime) {
                const timestamp = new Date(parsed).getTime();
                detailSmsTimeDatetime.value = new Date(timestamp).toISOString().slice(0, 16);
            }
        }
    });
}

// Add form SMS button
if (addSmsBtn) {
    addSmsBtn.addEventListener('click', () => {
        const timeValue = addSmsTimeDatetime ? addSmsTimeDatetime.value : null;
        const message = addSmsMessage ? addSmsMessage.value.trim() : '';

        if (!timeValue) {
            return;
        }

        const scheduledTime = new Date(timeValue).getTime();
        const todoText = todoInput.value.trim() || 'your task';

        addFormScheduledSms.push({
            time: scheduledTime,
            message: message || `Reminder: ${todoText}`,
            sent: false
        });
        renderAddFormScheduledSms();

        // Clear inputs
        if (addSmsTimeText) addSmsTimeText.value = '';
        if (addSmsTimeDatetime) addSmsTimeDatetime.value = '';
        if (addSmsMessage) addSmsMessage.value = '';
    });
}

// Add form SMS datetime picker - sync with text field
if (addSmsTimeDatetime) {
    addSmsTimeDatetime.addEventListener('change', () => {
        if (addSmsTimeDatetime.value && addSmsTimeText) {
            addSmsTimeText.value = formatDueTime(new Date(addSmsTimeDatetime.value).getTime());
        }
    });
}

// Add form SMS text input (natural language)
if (addSmsTimeText) {
    addSmsTimeText.addEventListener('blur', () => {
        const value = addSmsTimeText.value.trim();
        if (value) {
            const parsed = parseNaturalDate(value);
            if (parsed && addSmsTimeDatetime) {
                const timestamp = new Date(parsed).getTime();
                addSmsTimeDatetime.value = new Date(timestamp).toISOString().slice(0, 16);
            }
        }
    });
}

// ============================================
// RECURRENCE UI FUNCTIONALITY
// ============================================

// Get recurrence element IDs for a prefix ('add' or 'detail')
function getRecurrenceElements(prefix) {
    return {
        typeSelect: document.getElementById(`${prefix}-recurrence-type`),
        weeklyOptions: document.getElementById(`${prefix}-weekly-options`),
        monthlyOptions: document.getElementById(`${prefix}-monthly-options`),
        customOptions: document.getElementById(`${prefix}-custom-options`),
        endOptions: document.getElementById(`${prefix}-end-options`),
        monthlyMode: document.getElementById(`${prefix}-monthly-mode`),
        monthlyDayOfMonth: document.getElementById(`${prefix}-monthly-day-of-month`),
        monthlyDayOfWeek: document.getElementById(`${prefix}-monthly-day-of-week`),
        monthlyDay: document.getElementById(`${prefix}-monthly-day`),
        monthlyWeek: document.getElementById(`${prefix}-monthly-week`),
        monthlyWeekday: document.getElementById(`${prefix}-monthly-weekday`),
        customInterval: document.getElementById(`${prefix}-custom-interval`),
        customUnit: document.getElementById(`${prefix}-custom-unit`),
        endType: document.getElementById(`${prefix}-end-type`),
        endDateWrapper: document.getElementById(`${prefix}-end-date-wrapper`),
        endCountWrapper: document.getElementById(`${prefix}-end-count-wrapper`),
        endDate: document.getElementById(`${prefix}-end-date`),
        endCount: document.getElementById(`${prefix}-end-count`),
        recurrenceDisplay: document.getElementById(`${prefix}-recurrence-display`)
    };
}

// Update recurrence UI visibility based on type selection
function updateRecurrenceUI(prefix) {
    const els = getRecurrenceElements(prefix);
    if (!els.typeSelect) return;

    const type = els.typeSelect.value;

    // Hide all options
    if (els.weeklyOptions) els.weeklyOptions.style.display = 'none';
    if (els.monthlyOptions) els.monthlyOptions.style.display = 'none';
    if (els.customOptions) els.customOptions.style.display = 'none';
    if (els.endOptions) els.endOptions.style.display = 'none';

    // Show relevant options
    if (type === RECURRENCE_TYPES.WEEKLY && els.weeklyOptions) {
        els.weeklyOptions.style.display = 'block';
    } else if (type === RECURRENCE_TYPES.MONTHLY && els.monthlyOptions) {
        els.monthlyOptions.style.display = 'block';
    } else if (type === RECURRENCE_TYPES.CUSTOM && els.customOptions) {
        els.customOptions.style.display = 'block';
    }

    // Show end options for all recurrence types except 'none'
    if (type !== RECURRENCE_TYPES.NONE && els.endOptions) {
        els.endOptions.style.display = 'block';
    }

    // Update recurrence display text if available
    if (els.recurrenceDisplay) {
        const recurrence = getRecurrenceFromForm(prefix);
        els.recurrenceDisplay.textContent = formatRecurrenceRule(recurrence);
    }
}

// Update monthly mode visibility
function updateMonthlyModeUI(prefix) {
    const els = getRecurrenceElements(prefix);
    if (!els.monthlyMode) return;

    const mode = els.monthlyMode.value;

    if (els.monthlyDayOfMonth) {
        els.monthlyDayOfMonth.style.display = mode === MONTHLY_MODES.DAY_OF_MONTH ? 'flex' : 'none';
    }
    if (els.monthlyDayOfWeek) {
        els.monthlyDayOfWeek.style.display = mode === MONTHLY_MODES.DAY_OF_WEEK ? 'flex' : 'none';
    }
}

// Update end type visibility
function updateEndTypeUI(prefix) {
    const els = getRecurrenceElements(prefix);
    if (!els.endType) return;

    const endType = els.endType.value;

    if (els.endDateWrapper) {
        els.endDateWrapper.style.display = endType === RECURRENCE_END_TYPES.ON_DATE ? 'flex' : 'none';
    }
    if (els.endCountWrapper) {
        els.endCountWrapper.style.display = endType === RECURRENCE_END_TYPES.AFTER_COUNT ? 'flex' : 'none';
    }
}

// Get recurrence object from form inputs
function getRecurrenceFromForm(prefix) {
    const els = getRecurrenceElements(prefix);
    if (!els.typeSelect) return createDefaultRecurrence();

    const type = els.typeSelect.value;

    if (type === RECURRENCE_TYPES.NONE) {
        return createDefaultRecurrence();
    }

    const recurrence = createDefaultRecurrence();
    recurrence.type = type;

    // Get weekly days
    if (type === RECURRENCE_TYPES.WEEKLY && els.weeklyOptions) {
        const checkboxes = els.weeklyOptions.querySelectorAll('.weekday-selector input[type="checkbox"]:checked');
        recurrence.daysOfWeek = Array.from(checkboxes).map(cb => parseInt(cb.value));
    }

    // Get monthly settings
    if (type === RECURRENCE_TYPES.MONTHLY && els.monthlyMode) {
        recurrence.monthlyMode = els.monthlyMode.value;
        if (els.monthlyMode.value === MONTHLY_MODES.DAY_OF_MONTH && els.monthlyDay) {
            recurrence.dayOfMonth = parseInt(els.monthlyDay.value) || 1;
        } else if (els.monthlyMode.value === MONTHLY_MODES.DAY_OF_WEEK) {
            if (els.monthlyWeek) {
                recurrence.weekOfMonth = els.monthlyWeek.value === 'last' ? 'last' : parseInt(els.monthlyWeek.value);
            }
            if (els.monthlyWeekday) {
                recurrence.dayOfWeek = parseInt(els.monthlyWeekday.value);
            }
        }
    }

    // Get custom settings
    if (type === RECURRENCE_TYPES.CUSTOM) {
        if (els.customInterval) {
            recurrence.customInterval = parseInt(els.customInterval.value) || 1;
        }
        if (els.customUnit) {
            recurrence.customUnit = els.customUnit.value;
        }
    }

    // Get end settings
    if (els.endType) {
        recurrence.endType = els.endType.value;
        if (recurrence.endType === RECURRENCE_END_TYPES.ON_DATE && els.endDate && els.endDate.value) {
            recurrence.endDate = new Date(els.endDate.value).getTime();
        }
        if (recurrence.endType === RECURRENCE_END_TYPES.AFTER_COUNT && els.endCount) {
            recurrence.endCount = parseInt(els.endCount.value) || 10;
        }
    }

    return recurrence;
}

// Set recurrence form from recurrence object
function setRecurrenceForm(prefix, recurrence) {
    const els = getRecurrenceElements(prefix);
    if (!els.typeSelect) return;

    const rec = recurrence || createDefaultRecurrence();

    // Set type
    els.typeSelect.value = rec.type || RECURRENCE_TYPES.NONE;

    // Set weekly days
    if (els.weeklyOptions) {
        const checkboxes = els.weeklyOptions.querySelectorAll('.weekday-selector input[type="checkbox"]');
        checkboxes.forEach(cb => {
            const day = parseInt(cb.value);
            cb.checked = rec.daysOfWeek && rec.daysOfWeek.includes(day);
            // Update visual state
            const label = cb.closest('.weekday-btn');
            if (label) {
                label.classList.toggle('selected', cb.checked);
            }
        });
    }

    // Set monthly settings
    if (els.monthlyMode) {
        els.monthlyMode.value = rec.monthlyMode || MONTHLY_MODES.DAY_OF_MONTH;
    }
    if (els.monthlyDay) {
        els.monthlyDay.value = rec.dayOfMonth || 1;
    }
    if (els.monthlyWeek) {
        els.monthlyWeek.value = rec.weekOfMonth === 'last' ? 'last' : (rec.weekOfMonth || 1);
    }
    if (els.monthlyWeekday) {
        els.monthlyWeekday.value = rec.dayOfWeek || 0;
    }

    // Set custom settings
    if (els.customInterval) {
        els.customInterval.value = rec.customInterval || 1;
    }
    if (els.customUnit) {
        els.customUnit.value = rec.customUnit || 'days';
    }

    // Set end settings
    if (els.endType) {
        els.endType.value = rec.endType || RECURRENCE_END_TYPES.NEVER;
    }
    if (els.endDate && rec.endDate) {
        els.endDate.value = new Date(rec.endDate).toISOString().slice(0, 10);
    } else if (els.endDate) {
        els.endDate.value = '';
    }
    if (els.endCount) {
        els.endCount.value = rec.endCount || 10;
    }

    // Update UI visibility
    updateRecurrenceUI(prefix);
    updateMonthlyModeUI(prefix);
    updateEndTypeUI(prefix);
}

// Reset recurrence form to defaults
function resetRecurrenceForm(prefix) {
    setRecurrenceForm(prefix, createDefaultRecurrence());
}

// Setup recurrence event listeners for a form (add or detail)
function setupRecurrenceListeners(prefix) {
    const els = getRecurrenceElements(prefix);

    // Type change
    if (els.typeSelect) {
        els.typeSelect.addEventListener('change', () => {
            updateRecurrenceUI(prefix);
            // Auto-save for detail panel
            if (prefix === 'detail' && selectedTodoId) {
                saveRecurrenceToTodo();
            }
        });
    }

    // Weekly day checkboxes
    if (els.weeklyOptions) {
        els.weeklyOptions.querySelectorAll('.weekday-selector input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const label = e.target.closest('.weekday-btn');
                if (label) {
                    label.classList.toggle('selected', e.target.checked);
                }
                updateRecurrenceUI(prefix);
                if (prefix === 'detail' && selectedTodoId) {
                    saveRecurrenceToTodo();
                }
            });
        });
    }

    // Monthly mode change
    if (els.monthlyMode) {
        els.monthlyMode.addEventListener('change', () => {
            updateMonthlyModeUI(prefix);
            updateRecurrenceUI(prefix);
            if (prefix === 'detail' && selectedTodoId) {
                saveRecurrenceToTodo();
            }
        });
    }

    // Monthly day/week changes
    if (els.monthlyDay) {
        els.monthlyDay.addEventListener('change', () => {
            updateRecurrenceUI(prefix);
            if (prefix === 'detail' && selectedTodoId) {
                saveRecurrenceToTodo();
            }
        });
    }
    if (els.monthlyWeek) {
        els.monthlyWeek.addEventListener('change', () => {
            updateRecurrenceUI(prefix);
            if (prefix === 'detail' && selectedTodoId) {
                saveRecurrenceToTodo();
            }
        });
    }
    if (els.monthlyWeekday) {
        els.monthlyWeekday.addEventListener('change', () => {
            updateRecurrenceUI(prefix);
            if (prefix === 'detail' && selectedTodoId) {
                saveRecurrenceToTodo();
            }
        });
    }

    // Custom interval/unit changes
    if (els.customInterval) {
        els.customInterval.addEventListener('change', () => {
            updateRecurrenceUI(prefix);
            if (prefix === 'detail' && selectedTodoId) {
                saveRecurrenceToTodo();
            }
        });
    }
    if (els.customUnit) {
        els.customUnit.addEventListener('change', () => {
            updateRecurrenceUI(prefix);
            if (prefix === 'detail' && selectedTodoId) {
                saveRecurrenceToTodo();
            }
        });
    }

    // End type change
    if (els.endType) {
        els.endType.addEventListener('change', () => {
            updateEndTypeUI(prefix);
            updateRecurrenceUI(prefix);
            if (prefix === 'detail' && selectedTodoId) {
                saveRecurrenceToTodo();
            }
        });
    }

    // End date/count changes
    if (els.endDate) {
        els.endDate.addEventListener('change', () => {
            updateRecurrenceUI(prefix);
            if (prefix === 'detail' && selectedTodoId) {
                saveRecurrenceToTodo();
            }
        });
    }
    if (els.endCount) {
        els.endCount.addEventListener('change', () => {
            updateRecurrenceUI(prefix);
            if (prefix === 'detail' && selectedTodoId) {
                saveRecurrenceToTodo();
            }
        });
    }
}

// Save recurrence settings to current todo (for detail panel)
async function saveRecurrenceToTodo() {
    if (!selectedTodoId) return;

    const recurrence = getRecurrenceFromForm('detail');
    const recurrenceToSave = recurrence.type !== RECURRENCE_TYPES.NONE ? recurrence : null;

    await todosRef.doc(selectedTodoId).update({
        recurrence: recurrenceToSave
    });

    // Update display
    const els = getRecurrenceElements('detail');
    if (els.recurrenceDisplay) {
        els.recurrenceDisplay.textContent = formatRecurrenceRule(recurrence);
    }
}

// Initialize recurrence UI for both forms
function initRecurrenceUI() {
    setupRecurrenceListeners('add');
    setupRecurrenceListeners('detail');

    // Initialize add form to defaults
    resetRecurrenceForm('add');
}

// Initialize recurrence UI
initRecurrenceUI();

// Initialize when Firebase is ready
initApp();
