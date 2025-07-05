<script>
    const { task, onupdate = () => {}, ondelete = () => {} } = $props();
    
    let isEditing = $state(false);
    let editText = $state(task.text);
    let editPriority = $state(task.priority);
    let editNotificationTime = $state(task.notificationTime || '');
    let editNotificationEnabled = $state(!!task.notificationTime);

    function startEdit() {
        isEditing = true;
        editText = task.text;
        editPriority = task.priority;
        editNotificationTime = task.notificationTime || '';
        editNotificationEnabled = !!task.notificationTime;
    }

    function cancelEdit() {
        isEditing = false;
        editText = task.text;
        editPriority = task.priority;
        editNotificationTime = task.notificationTime || '';
        editNotificationEnabled = !!task.notificationTime;
    }

    function saveEdit() {
        if (editText.trim() === '') return;
        
        const updatedData = {
            text: editText.trim(),
            priority: editPriority,
            notificationTime: editNotificationEnabled && editNotificationTime ? editNotificationTime : null
        };
        
        onupdate(updatedData);
        isEditing = false;
    }

    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            saveEdit();
        } else if (event.key === 'Escape') {
            cancelEdit();
        }
    }

    function toggleCompleted() {
        onupdate({
            completed: !task.completed
        });
    }

    function deleteTask() {
        ondelete();
    }

    function getPriorityColor(priority) {
        switch(priority) {
            case 'High': return 'text-red-600';
            case 'Medium': return 'text-yellow-600';
            case 'Low': return 'text-green-600';
            default: return 'text-gray-600';
        }
    }
</script>

<div class="w-full p-3 border rounded shadow-sm bg-white">
    {#if isEditing}
        <!-- Edit Mode -->
        <div class="space-y-2">
            <input 
                type="text" 
                bind:value={editText}
                onkeypress={handleKeyPress}
                class="w-full p-2 border rounded"
                autofocus
            />
            <div class="flex items-center space-x-2">
                <select bind:value={editPriority} class="p-2 border rounded">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </select>
                <button onclick={saveEdit} class="px-3 py-1 bg-green-500 text-white rounded text-sm">
                    Save
                </button>
                <button onclick={cancelEdit} class="px-3 py-1 bg-gray-500 text-white rounded text-sm">
                    Cancel
                </button>
            </div>
        </div>
    {:else}
        <!-- Display Mode -->
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <input 
                    type="checkbox" 
                    checked={task.completed}
                    onchange={toggleCompleted}
                    class="h-4 w-4"
                />
                <div class="flex flex-col">
                    <span class="text-lg {task.completed ? 'line-through text-gray-500' : ''}">
                        {task.text}
                    </span>
                    <span class="text-sm {getPriorityColor(task.priority)} font-medium">
                        Priority: {task.priority}
                    </span>
                </div>
            </div>
            <div class="flex space-x-2">
                <button onclick={startEdit} class="px-3 py-1 bg-blue-500 text-white rounded text-sm">
                    Edit
                </button>
                <button onclick={deleteTask} class="px-3 py-1 bg-red-500 text-white rounded text-sm">
                    Delete
                </button>
            </div>
        </div>
    {/if}
</div>