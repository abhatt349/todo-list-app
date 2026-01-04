const todoInput = document.getElementById('todo-input');
const prioritySelect = document.getElementById('priority-select');
const dueTimeInput = document.getElementById('due-time-input');
const tagsInput = document.getElementById('tags-input');
const notesInput = document.getElementById('notes-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const searchInput = document.getElementById('search-input');
const timezoneSelect = document.getElementById('timezone-select');
const detailPanel = document.getElementById('detail-panel');
const detailTitle = document.getElementById('detail-title');
const detailDueInput = document.getElementById('detail-due-input');
const detailDueDatetime = document.getElementById('detail-due-datetime');
const detailPriorityInput = document.getElementById('detail-priority-input');
const detailNotes = document.getElementById('detail-notes');
const detailTags = document.getElementById('detail-tags');
const detailClose = document.getElementById('detail-close');
const detailBackdrop = document.getElementById('detail-backdrop');
const deletedPanel = document.getElementById('deleted-panel');
const deletedHeader = document.getElementById('deleted-header');
const deletedList = document.getElementById('deleted-list');
const deletedCount = document.getElementById('deleted-count');

let db;
let todosRef;
let currentDocs = [];
let deletedDocs = [];
let notifiedIds = new Set(); // Track which todos have already triggered notifications
let selectedTodoId = null; // Currently selected todo for detail panel
let searchQuery = ''; // Current search query
let selectedTimezone = localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;

// Common timezones grouped by region
const timezones = [
    { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
    { value: 'America/Anchorage', label: 'Alaska (AKST)' },
    { value: 'America/Los_Angeles', label: 'Pacific (PST)' },
    { value: 'America/Denver', label: 'Mountain (MST)' },
    { value: 'America/Chicago', label: 'Central (CST)' },
    { value: 'America/New_York', label: 'Eastern (EST)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
    { value: 'Atlantic/Reykjavik', label: 'Iceland (GMT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
];

// Initialize timezone selector
function initTimezoneSelector() {
    // Add user's local timezone if not in list
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hasLocalTz = timezones.some(tz => tz.value === localTz);

    if (!hasLocalTz) {
        timezones.unshift({ value: localTz, label: `${localTz} (Local)` });
    }

    // Populate dropdown
    timezones.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz.value;
        option.textContent = tz.label;
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
function initApp() {
    db = firebase.firestore();
    todosRef = db.collection('todos');

    // Listen for real-time updates on all todos
    todosRef.onSnapshot((snapshot) => {
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

    // Re-check for overdue items every minute
    setInterval(() => {
        if (currentDocs.length > 0) {
            // Check for newly overdue items and send notifications
            currentDocs.forEach(doc => {
                const data = doc.data();
                if (isOverdue(data)) {
                    if (data.priority < 10) {
                        todosRef.doc(doc.id).update({ priority: 10 });
                    }
                    sendOverdueNotification(data, doc.id);
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

// Check if a todo matches the search query
function matchesSearch(doc) {
    if (!searchQuery) return true;
    const data = doc.data();
    const query = searchQuery.toLowerCase();
    const text = (data.text || '').toLowerCase();
    const notes = (data.notes || '').toLowerCase();
    const tags = (data.tags || []).join(' ').toLowerCase();
    return text.includes(query) || notes.includes(query) || tags.includes(query);
}

// Render todos to the DOM
function renderTodos(docs) {
    // Filter by search query
    const filteredDocs = docs.filter(matchesSearch);

    if (filteredDocs.length === 0) {
        if (searchQuery) {
            todoList.innerHTML = '<li class="empty-state">No matching tasks found.</li>';
        } else {
            todoList.innerHTML = '<li class="empty-state">No todos yet. Add one above!</li>';
        }
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

    const dueTime = parseNaturalDate(dueTimeInput.value);
    const tags = parseTags(tagsInput.value);
    const notes = notesInput.value.trim();

    await todosRef.add({
        text: text,
        priority: priority,
        completed: false,
        deleted: false,
        dueTime: dueTime,
        tags: tags,
        notes: notes || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    todoInput.value = '';
    prioritySelect.value = '5';
    dueTimeInput.value = '';
    tagsInput.value = '';
    notesInput.value = '';
    todoInput.focus();
}

// Toggle todo completion
async function toggleTodo(id, completed) {
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
    detailTags.value = formatTags(todo.tags);
    detailNotes.value = todo.notes || '';

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

// Event listeners
addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

// Search functionality
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderTodos(currentDocs);
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

// Save tags on blur
detailTags.addEventListener('blur', async () => {
    if (!selectedTodoId) return;
    const tags = parseTags(detailTags.value);
    await todosRef.doc(selectedTodoId).update({ tags: tags });
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

// Initialize when Firebase is ready
initApp();
