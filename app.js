const todoInput = document.getElementById('todo-input');
const prioritySelect = document.getElementById('priority-select');
const dueTimeInput = document.getElementById('due-time-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const detailPanel = document.getElementById('detail-panel');
const detailTitle = document.getElementById('detail-title');
const detailDue = document.getElementById('detail-due');
const detailPriority = document.getElementById('detail-priority');
const detailNotes = document.getElementById('detail-notes');
const detailClose = document.getElementById('detail-close');

let db;
let todosRef;
let currentDocs = [];
let notifiedIds = new Set(); // Track which todos have already triggered notifications
let selectedTodoId = null; // Currently selected todo for detail panel

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

    // Listen for real-time updates
    todosRef.onSnapshot((snapshot) => {
        // Boost overdue items to max priority and send notifications
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (isOverdue(data)) {
                if (data.priority < 10) {
                    todosRef.doc(doc.id).update({ priority: 10 });
                }
                sendOverdueNotification(data, doc.id);
            }
        });

        // Sort: overdue first, then uncompleted (by priority desc), then completed
        currentDocs = snapshot.docs.slice().sort((a, b) => {
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
        renderTodos(currentDocs);
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

// Get color based on priority value (10 = red, 0 = green)
function getPriorityColor(priority) {
    const p = Math.max(0, Math.min(10, priority || 0));
    const ratio = (10 - p) / 10; // 0 at priority 10, 1 at priority 0

    // Red (255, 200, 200) to Green (200, 255, 200)
    const r = Math.round(255 - (55 * ratio));
    const g = Math.round(200 + (55 * ratio));
    const b = 200;

    // Darker text color
    const textR = Math.round(180 - (100 * ratio));
    const textG = Math.round(50 + (100 * ratio));
    const textB = Math.round(50);

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
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today ${timeStr}`;
    if (isTomorrow) return `Tomorrow ${timeStr}`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` ${timeStr}`;
}

// Get priority section for a priority value
function getPrioritySection(priority) {
    const p = priority || 0;
    if (p >= 10) return 'urgent';
    if (p >= 6) return 'high';
    if (p >= 3) return 'medium';
    return 'low';
}

// Render a single todo item
function renderTodoItem(doc) {
    const todo = doc.data();
    const colors = getPriorityColor(todo.priority);
    const overdue = isOverdue(todo);
    const dueTimeDisplay = todo.dueTime ? formatDueTime(todo.dueTime) : '';
    const classes = ['todo-item'];
    if (todo.completed) classes.push('completed');
    if (overdue) classes.push('overdue');

    return `
        <li class="${classes.join(' ')}"
            data-id="${doc.id}"
            data-duetime="${todo.dueTime || ''}"
            draggable="true"
            style="background-color: ${overdue ? '#ffcdd2' : colors.bg}">
            <span class="drag-handle">&#8942;&#8942;</span>
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <button class="due-time-btn" title="Set due time">${dueTimeDisplay || '⏰'}</button>
            <span class="priority-badge" style="background-color: ${colors.bg}; color: ${colors.text}">${formatPriority(todo.priority)}</span>
            <button class="delete-btn">&times;</button>
        </li>
    `;
}

// Render todos to the DOM
function renderTodos(docs) {
    if (docs.length === 0) {
        todoList.innerHTML = '<li class="empty-state">No todos yet. Add one above!</li>';
        return;
    }

    // Separate completed and uncompleted
    const uncompleted = docs.filter(d => !d.data().completed);
    const completed = docs.filter(d => d.data().completed);

    // Group uncompleted by priority section
    const sections = {
        urgent: uncompleted.filter(d => getPrioritySection(d.data().priority) === 'urgent'),
        high: uncompleted.filter(d => getPrioritySection(d.data().priority) === 'high'),
        medium: uncompleted.filter(d => getPrioritySection(d.data().priority) === 'medium'),
        low: uncompleted.filter(d => getPrioritySection(d.data().priority) === 'low')
    };

    let html = '';

    // Render each section
    if (sections.urgent.length > 0) {
        html += `<li class="section-header section-urgent">Urgent (10)</li>`;
        html += sections.urgent.map(renderTodoItem).join('');
    }

    if (sections.high.length > 0) {
        html += `<li class="section-header section-high">High (6-9)</li>`;
        html += sections.high.map(renderTodoItem).join('');
    }

    if (sections.medium.length > 0) {
        html += `<li class="section-header section-medium">Medium (3-5)</li>`;
        html += sections.medium.map(renderTodoItem).join('');
    }

    if (sections.low.length > 0) {
        html += `<li class="section-header section-low">Low (0-2)</li>`;
        html += sections.low.map(renderTodoItem).join('');
    }

    // Render completed section
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

    await todosRef.add({
        text: text,
        priority: priority,
        completed: false,
        dueTime: dueTime,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    todoInput.value = '';
    prioritySelect.value = '5';
    dueTimeInput.value = '';
    todoInput.focus();
}

// Toggle todo completion
async function toggleTodo(id, completed) {
    await todosRef.doc(id).update({ completed: !completed });
}

// Delete a todo
async function deleteTodo(id) {
    await todosRef.doc(id).delete();
}

// Update priority for a todo
async function updatePriority(id, newPriority) {
    await todosRef.doc(id).update({ priority: newPriority });
}

// Update due time for a todo
async function updateDueTime(id, newDueTime) {
    await todosRef.doc(id).update({ dueTime: newDueTime || null });
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

    detailTitle.textContent = todo.text;
    detailDue.textContent = todo.dueTime ? formatDueTime(todo.dueTime) : 'Not set';
    detailPriority.textContent = formatPriority(todo.priority);
    detailNotes.value = todo.notes || '';

    detailPanel.classList.add('open');

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
    selectedTodoId = null;
    document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('selected');
    });
}

// Show date input for a todo item (natural language)
function showDueTimePicker(item) {
    const id = item.dataset.id;
    const btn = item.querySelector('.due-time-btn');

    // Create inline text input for natural language
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'due-time-input-inline';
    input.placeholder = 'tomorrow 3pm';

    // Replace button with input
    btn.style.display = 'none';
    btn.insertAdjacentElement('afterend', input);
    input.focus();

    // Handle save
    const save = async () => {
        const parsed = parseNaturalDate(input.value);
        await updateDueTime(id, parsed);
        input.remove();
        btn.style.display = '';
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
        }
        if (e.key === 'Escape') {
            input.remove();
            btn.style.display = '';
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

    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
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

// Get section bounds for a priority
function getSectionBounds(priority) {
    const p = priority || 0;
    if (p >= 10) return { min: 10, max: 10 };
    if (p >= 6) return { min: 6, max: 9.9 };
    if (p >= 3) return { min: 3, max: 5.9 };
    return { min: 0, max: 2.9 };
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

    if (e.target.classList.contains('priority-badge')) {
        showPriorityEditor(item);
    }

    // Click on todo text to open detail panel
    if (e.target.classList.contains('todo-text')) {
        openDetailPanel(id);
    }
});

// Detail panel event listeners
detailClose.addEventListener('click', closeDetailPanel);

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

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
}

// Initialize when Firebase is ready
initApp();
