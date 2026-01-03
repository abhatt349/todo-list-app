const todoInput = document.getElementById('todo-input');
const prioritySelect = document.getElementById('priority-select');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');

let db;
let todosRef;

// Initialize Firebase and load todos
function initApp() {
    db = firebase.firestore();
    todosRef = db.collection('todos');

    // Listen for real-time updates
    todosRef.orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        renderTodos(snapshot.docs);
    });
}

// Render todos to the DOM
function renderTodos(docs) {
    if (docs.length === 0) {
        todoList.innerHTML = '<li class="empty-state">No todos yet. Add one above!</li>';
        return;
    }

    todoList.innerHTML = docs.map(doc => {
        const todo = doc.data();
        return `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${doc.id}">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <span class="priority-badge priority-${todo.priority}">${todo.priority}</span>
                <button class="delete-btn">&times;</button>
            </li>
        `;
    }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add a new todo
async function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    await todosRef.add({
        text: text,
        priority: prioritySelect.value,
        completed: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    todoInput.value = '';
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
});

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
}

// Initialize when Firebase is ready
initApp();
