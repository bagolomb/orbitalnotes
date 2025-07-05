<script>
    import { onMount, onDestroy } from 'svelte';
    import { getTodo } from '$lib/functions/storefuncs.js';
    import { 
        isPermissionGranted, 
        requestPermission, 
        sendNotification 
    } from '@tauri-apps/plugin-notification';
    import Task from '$lib/components/Task.svelte';

    let todo_store;
    let todo_list = $state([]);
    let newTaskText = $state('');
    let newTaskPriority = $state('Medium');
    let notificationTime = $state('');
    let notificationEnabled = $state(false);
    let permissionGranted = $state(false);
    let activeTimers = new Map(); // Store active notification timers

    onMount(async () => {
        try {
            todo_store = await getTodo();
            const storedTodos = await todo_store.get('todo_list');
            // Ensure we always have an array
            todo_list = Array.isArray(storedTodos) ? storedTodos : [];
            console.log('Loaded todos:', todo_list);
            
            // Check notification permission
            permissionGranted = await isPermissionGranted();
            
            // Reschedule existing notifications on app start
            scheduleExistingNotifications();
        } catch (error) {
            console.error('Error loading todos:', error);
            todo_list = [];
        }
    });

    onDestroy(async () => {
        if (todo_store) {
            try {
                await todo_store.set('todo_list', todo_list);
                await todo_store.save();
                console.log('Saved todos on destroy:', todo_list);
            } catch (error) {
                console.error('Error saving todos:', error);
            }
        }
        
        // Clear all active timers
        activeTimers.forEach(timer => clearTimeout(timer));
        activeTimers.clear();
    });

    async function requestNotificationPermission() {
        if (!permissionGranted) {
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
        }
        return permissionGranted;
    }

    function scheduleNotification(task) {
        if (!task.notificationTime || !permissionGranted) return;
        
        const now = new Date();
        const notificationDate = new Date(task.notificationTime);
        
        if (notificationDate <= now) return; // Don't schedule past notifications
        
        const timeUntilNotification = notificationDate.getTime() - now.getTime();
        
        const timer = setTimeout(() => {
            sendNotification({
                title: '📋 Task Reminder',
                body: `Time to work on: ${task.text}`,
                icon: 'notification'
            });
            
            // Remove timer from active timers
            activeTimers.delete(task.id);
        }, timeUntilNotification);
        
        // Store timer reference
        activeTimers.set(task.id, timer);
    }

    function scheduleExistingNotifications() {
        const currentList = Array.isArray(todo_list) ? todo_list : [];
        currentList.forEach(task => {
            if (task.notificationTime && !task.completed) {
                scheduleNotification(task);
            }
        });
    }

    function clearNotification(taskId) {
        const timer = activeTimers.get(taskId);
        if (timer) {
            clearTimeout(timer);
            activeTimers.delete(taskId);
        }
    }

    async function createTask() {
        if (newTaskText.trim() === '') return;
        
        // Request permission if notification is enabled
        if (notificationEnabled && notificationTime) {
            const hasPermission = await requestNotificationPermission();
            if (!hasPermission) {
                alert('Notification permission is required for task reminders');
                return;
            }
        }
        
        const newTask = {
            id: Date.now() + Math.random(),
            text: newTaskText.trim(),
            priority: newTaskPriority,
            completed: false,
            notificationTime: notificationEnabled && notificationTime ? notificationTime : null,
            createdAt: new Date().toISOString()
        };
        
        // Ensure todo_list is always an array before spreading
        const currentList = Array.isArray(todo_list) ? todo_list : [];
        todo_list = [...currentList, newTask];
        
        // Schedule notification if enabled
        if (newTask.notificationTime && permissionGranted) {
            scheduleNotification(newTask);
        }
        
        // Reset form
        newTaskText = '';
        newTaskPriority = 'Medium';
        notificationTime = '';
        notificationEnabled = false;
        
        // Save to store immediately
        if (todo_store) {
            try {
                await todo_store.set('todo_list', todo_list);
                await todo_store.save();
                console.log('Created task:', newTask);
                console.log('Current todo_list:', todo_list);
            } catch (error) {
                console.error('Error saving task:', error);
            }
        }
    }

    async function updateTask(taskId, updatedTask) {
        // Ensure todo_list is always an array
        const currentList = Array.isArray(todo_list) ? todo_list : [];
        const oldTask = currentList.find(task => task.id === taskId);
        
        todo_list = currentList.map(task => 
            task.id === taskId ? { ...task, ...updatedTask } : task
        );
        
        // Handle notification scheduling for updated tasks
        const updatedTaskData = todo_list.find(task => task.id === taskId);
        
        // Clear old notification if it exists
        clearNotification(taskId);
        
        // Schedule new notification if needed
        if (updatedTaskData?.notificationTime && !updatedTaskData.completed && permissionGranted) {
            scheduleNotification(updatedTaskData);
        }
        
        // Save to store immediately
        if (todo_store) {
            try {
                await todo_store.set('todo_list', todo_list);
                await todo_store.save();
                console.log('Updated task:', taskId, updatedTask);
            } catch (error) {
                console.error('Error updating task:', error);
            }
        }
    }

    async function deleteTask(taskId) {
        // Clear notification timer
        clearNotification(taskId);
        
        // Ensure todo_list is always an array
        const currentList = Array.isArray(todo_list) ? todo_list : [];
        todo_list = currentList.filter(task => task.id !== taskId);
        
        // Save to store immediately
        if (todo_store) {
            try {
                await todo_store.set('todo_list', todo_list);
                await todo_store.save();
                console.log('Deleted task:', taskId);
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    }

    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return date.toLocaleString();
    }

    function getMinDateTime() {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 1); // Minimum 1 minute from now
        return now.toISOString().slice(0, 16);
    }

    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            createTask();
        }
    }
</script>

<div class="w-full h-full flex flex-col items-center space-y-2">
    <div class="w-full h-8 border-b flex items-center justify-center">
        <h1 class="text-2xl">Tasks</h1>
    </div>
    
    <!-- Create Task Form -->
    <div class="w-full max-w-md space-y-3 p-4 border rounded-lg shadow-sm bg-white">
        <input 
            type="text" 
            bind:value={newTaskText}
            onkeypress={handleKeyPress}
            placeholder="Enter new task..."
            class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        <div class="flex space-x-2">
            <select bind:value={newTaskPriority} class="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="Low">🟢 Low Priority</option>
                <option value="Medium">🟡 Medium Priority</option>
                <option value="High">🔴 High Priority</option>
            </select>
        </div>
        
        <!-- Notification Section -->
        <div class="space-y-2 p-3 border rounded-lg bg-gray-50">
            <div class="flex items-center space-x-2">
                <input 
                    type="checkbox" 
                    bind:checked={notificationEnabled}
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="#" class="text-sm font-medium text-gray-700">
                    🔔 Set reminder notification
                </label>
                {#if !permissionGranted}
                    <span class="text-xs text-red-600">(Permission required)</span>
                {/if}
            </div>
            
            {#if notificationEnabled}
                <div class="mt-2">
                    <label for="#" class="block text-sm text-gray-600 mb-1">
                        When to remind you:
                    </label>
                    <input 
                        type="datetime-local" 
                        bind:value={notificationTime}
                        min={getMinDateTime()}
                        class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
            {/if}
        </div>
        
        <button 
            onclick={createTask} 
            class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-colors"
        >
            ➕ Add Task
        </button>
    </div>

    <!-- Task List -->
    <div class="w-full max-w-md space-y-2">
        {#each todo_list as task (task.id)}
            <Task 
                {task} 
                onupdate={(updatedData) => updateTask(task.id, updatedData)}
                ondelete={() => deleteTask(task.id)}
            />
        {/each}
        
        {#if todo_list.length === 0}
            <p class="text-gray-500 text-center py-4">No tasks yet. Add one above!</p>
        {/if}
    </div>
</div>