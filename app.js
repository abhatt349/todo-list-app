const todoInput = document.getElementById('todo-input');
const prioritySelect = document.getElementById('priority-select');
const dueTimeInput = document.getElementById('due-time-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');

let db;
let todosRef;
let currentDocs = [];

// Check if a todo is overdue
function isOverdue(todo) {
    if (!todo.dueTime || todo.completed) return false;
    return new Date(todo.dueTime) <= new Date();
}

// Initialize Firebase and load todos
function initApp() {
    db = firebase.firestore();
    todosRef = db.collection('todos');

    // Listen for real-time updates
    todosRef.onSnapshot((snapshot) => {
        // Boost overdue items to max priority
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (isOverdue(data) && data.priority < 10) {
                todosRef.doc(doc.id).update({ priority: 10 });
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

// Render todos to the DOM
function renderTodos(docs) {
    if (docs.length === 0) {
        todoList.innerHTML = '<li class="empty-state">No todos yet. Add one above!</li>';
        return;
    }

    todoList.innerHTML = docs.map((doc) => {
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
    }).join('');

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

    const dueTime = dueTimeInput.value || null;

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

// Show datetime picker for a todo item
function showDueTimePicker(item) {
    const id = item.dataset.id;
    const currentDueTime = item.dataset.duetime;
    const btn = item.querySelector('.due-time-btn');

    // Create inline datetime input
    const input = document.createElement('input');
    input.type = 'datetime-local';
    input.className = 'due-time-input-inline';
    input.value = currentDueTime || '';

    // Replace button with input
    btn.style.display = 'none';
    btn.insertAdjacentElement('afterend', input);
    input.focus();

    // Handle blur and change
    const save = async () => {
        await updateDueTime(id, input.value);
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
        item.classList.remove('drag-over');
    });
    draggedItem = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (this !== draggedItem) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

async function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (!draggedItem || this === draggedItem) return;

    const draggedId = draggedItem.dataset.id;
    const targetId = this.dataset.id;

    // Find the docs
    const draggedDoc = currentDocs.find(d => d.id === draggedId);
    const targetDoc = currentDocs.find(d => d.id === targetId);

    if (!draggedDoc || !targetDoc) return;

    const draggedData = draggedDoc.data();
    const targetPriority = targetDoc.data().priority;
    const draggedIndex = currentDocs.findIndex(d => d.id === draggedId);
    const targetIndex = currentDocs.findIndex(d => d.id === targetId);

    let newPriority;
    let clearDueTime = false;

    // If dragging an overdue item downward, clear its due time
    if (isOverdue(draggedData) && draggedIndex < targetIndex) {
        clearDueTime = true;
    }

    if (draggedIndex > targetIndex) {
        // Moving up (to higher priority)
        // Set priority slightly higher than target
        const aboveDoc = targetIndex > 0 ? currentDocs[targetIndex - 1] : null;
        const abovePriority = aboveDoc ? aboveDoc.data().priority : targetPriority + 1;
        newPriority = Math.min(10, Math.round((targetPriority + abovePriority) / 2 * 10) / 10);
        if (newPriority <= targetPriority) newPriority = Math.min(10, targetPriority + 0.5);
    } else {
        // Moving down (to lower priority)
        // Set priority slightly lower than target
        const belowDoc = targetIndex < currentDocs.length - 1 ? currentDocs[targetIndex + 1] : null;
        const belowPriority = belowDoc ? belowDoc.data().priority : targetPriority - 1;
        newPriority = Math.max(0, Math.round((targetPriority + belowPriority) / 2 * 10) / 10);
        if (newPriority >= targetPriority) newPriority = Math.max(0, targetPriority - 0.5);
    }

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
});

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
}

// Initialize when Firebase is ready
initApp();
