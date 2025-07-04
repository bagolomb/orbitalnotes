<script>
    import { onMount } from 'svelte';
    import * as Select from "$lib/components/ui/select/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Button from "$lib/components/ui/button/index.js";
    import { getSettings } from '$lib/functions/storefuncs';
    import ollama from 'ollama'

    let chat_model = $state('');
    let embedding_model = $state('');
    let completion_model = $state('');
    let completion_models = $state();
    let embedding_models = $state();
    let settings_store;

    // Model management state
    let available_models = $state([]);
    let downloaded_models = $state([]);
    let downloading_models = $state(new Set());
    let is_refreshing = $state(false);

    async function setChatModel() {
        settings_store.set('chat_model', chat_model);
        await settings_store.save();
    }

    async function setEmbedModel() {
        settings_store.set('embedding_model', embedding_model);
        await settings_store.save();
    }

    async function setCompletionModel() {
        settings_store.set('completion_model', completion_model);
        await settings_store.save();
    }

    async function loadAvailableModels() {
        try {
            const response = await fetch('https://mocki.io/v1/70df3cd0-b1e1-41c9-8279-37a0dc17c284');
            const data = await response.json();
            available_models = data.models;
        } catch (error) {
            console.error('Failed to fetch available models:', error);
        }
    }

    async function loadDownloadedModels() {
        try {
            const { models } = await ollama.list();
            downloaded_models = models.map(m => m.name);
            
            const names = models.map(m => m.name);
            const infos = await Promise.all(
                names.map(name => ollama.show({ name }).then(info => ({ name, capabilities: info.capabilities })))
            );

            completion_models = infos
                .filter(info => info.capabilities?.includes('completion'))
                .map(info => info.name);

            embedding_models = infos
                .filter(info => info.capabilities?.includes('embedding'))
                .map(info => info.name);
        } catch (error) {
            console.error('Failed to fetch downloaded models:', error);
        }
    }

    async function downloadModel(model_name) {
        // Add to downloading state
        const newDownloading = new Set(downloading_models);
        newDownloading.add(model_name);
        downloading_models = newDownloading;
        
        try {
            await ollama.pull({ model: model_name });
            // Refresh downloaded models list after successful download
            await loadDownloadedModels();
        } catch (error) {
            console.error(`Failed to download model ${model_name}:`, error);
        } finally {
            // Remove from downloading state
            const finalDownloading = new Set(downloading_models);
            finalDownloading.delete(model_name);
            downloading_models = finalDownloading;
        }
    }

    async function refreshModels() {
        is_refreshing = true;
        try {
            await Promise.all([loadAvailableModels(), loadDownloadedModels()]);
        } finally {
            is_refreshing = false;
        }
    }

    function isModelDownloaded(model_name) {
        return downloaded_models.includes(model_name);
    }

    onMount(async () => {
        settings_store = await getSettings();
        chat_model = await settings_store.get('chat_model');
        embedding_model = await settings_store.get('embedding_model');
        completion_model = await settings_store.get('completion_model');
        
        await Promise.all([loadAvailableModels(), loadDownloadedModels()]);
    });
</script>

<div class="flex flex-col items-center space-y-2 overflow-x-hidden">
    <div class='w-full h-full flex justify-center items-center overflow-x-hidden'>
        <Card.Root class="overflow-x-hidden" >
            <Card.Header class="flex flex-row items-center justify-between">
                <h2 class="text-lg font-semibold">Model Configuration</h2>
                <Button.Root 
                    variant="outline" 
                    size="sm"
                    onclick={refreshModels}
                    disabled={is_refreshing}
                >
                    {is_refreshing ? 'Refreshing...' : 'Refresh'}
                </Button.Root>
            </Card.Header>
            <Card.Content class="space-y-3">
                <div>
                    <h1>Chat Model</h1>
                    <Select.Root type="single" bind:value={chat_model} onValueChange={async () => await setChatModel()}>
                        <Select.Trigger class="w-96">
                            {chat_model}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                            <Select.Label>Chat Model</Select.Label>
                            {#each completion_models as model}
                                <Select.Item
                                value={model}
                                label={model}
                                >
                                {model}
                                </Select.Item>
                            {/each}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                </div>
                <div>
                    <h1>Completion Model</h1>
                    <Select.Root type="single" bind:value={completion_model} onValueChange={async () => await setCompletionModel()}>
                        <Select.Trigger class="w-96">
                            {completion_model}
                        </Select.Trigger>
                        <Select.Content>
                        <Select.Group>
                            <Select.Label>Completion Models</Select.Label>
                            {#each completion_models as model}
                                <Select.Item
                                value={model}
                                label={model}
                                >
                                {model}
                                </Select.Item>
                            {/each}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                </div>
                <div>
                    <h1>Embedding Model</h1>
                    <Select.Root type="single" bind:value={embedding_model} onValueChange={async () => await setEmbedModel()}>
                        <Select.Trigger class="w-96">
                            {embedding_model}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                            <Select.Label>Embedding Models</Select.Label>
                            {#each embedding_models as model}
                                <Select.Item
                                value={model}
                                label={model}
                                >
                                {model}
                                </Select.Item>
                            {/each}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                </div>
                
                <!-- Model Management Section -->
                <div class="pt-4 overflow-x-hidden">
                    <h2 class="text-lg font-semibold mb-3">Available Models</h2>
                    <div class="max-h-64 overflow-y-auto space-y-2">
                        {#each available_models as model}
                            <div class="flex items-center justify-between p-3 border rounded-lg w-96">
                                <div class="flex-1">
                                    <div class="font-medium">{model.model_name}</div>
                                    <div class="text-xs text-gray-500">
                                        {model.pulls.toLocaleString()} pulls • Updated {model.last_updated_str}
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    {#if isModelDownloaded(model.model_name)}
                                        <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                            Downloaded
                                        </span>
                                    {:else}
                                        <Button.Root 
                                            variant="default" 
                                            size="sm"
                                            onclick={() => downloadModel(model.model_name)}
                                            disabled={downloading_models.has(model.model_name)}
                                        >
                                            {downloading_models.has(model.model_name) ? 'Downloading...' : 'Download'}
                                        </Button.Root>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </Card.Content>
        </Card.Root>
    </div>
</div>


<style>

    div{
        overflow-x: hidden;
    }

</style>