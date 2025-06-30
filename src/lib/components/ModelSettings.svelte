    
<script>
    import { onMount } from 'svelte';
    import * as Select from "$lib/components/ui/select/index.js";
    import * as Card from "$lib/components/ui/card/index.js";

    import { getSettings } from '$lib/functions/storefuncs';
    import ollama from 'ollama'

    let chat_model = $state('');
    let embedding_model = $state('');
    let completion_model = $state('');
    let completion_models = $state();
    let embedding_models = $state();
    let settings_store;

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

    onMount(async () => {
        settings_store = await getSettings();
        chat_model = await settings_store.get('chat_model');
        embedding_model = await settings_store.get('embedding_model');
        completion_model = await settings_store.get('completion_model');
        
        const { models } = await ollama.list();
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
        console.log(infos);
    });
</script>

<div class="flex flex-col items-center space-y-2">
    <div class='w-full h-full flex justify-center items-center'>
        <Card.Root>
            <Card.Header>
                <Card.Title class="text-center">Model Configuration</Card.Title>
            </Card.Header>
            <Card.Content class="space-y-2">
                <div>
                    <h1>Chat Model</h1>
                    <Select.Root type="single" bind:value={chat_model} onValueChange={async () => await setChatModel()}>
                        <Select.Trigger class="w-64">
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
                        <Select.Trigger class="w-64">
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
                        <Select.Trigger class="w-64">
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
            </Card.Content>
        </Card.Root>
    </div>
</div>