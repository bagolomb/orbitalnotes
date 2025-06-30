<script>
    import * as Tabs from "$lib/components/ui/tabs/index.js";
    import LinkMap from "$lib/components/LinkMap.svelte";
    import TagQuantityBubble from "$lib/components/TagQuantityBubble.svelte";
    import LinkQuantityBubble from "$lib/components/LinkQuantityBubble.svelte";    
</script>

<Tabs.Root value="LinkMap" class="w-full h-full">
    <Tabs.List class="w-full">
      <Tabs.Trigger value="LinkMap">Link Map</Tabs.Trigger>
      <Tabs.Trigger value="TagQuantityBubble">Tag Quantity Bubble</Tabs.Trigger>
      <Tabs.Trigger value="LinkQuantityBubble">Link Quantity Bubble</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="LinkMap" class="w-full h-full">
      <LinkMap />
    </Tabs.Content>
    <Tabs.Content value="TagQuantityBubble" class="w-full h-full">
      <TagQuantityBubble />
    </Tabs.Content>
    <Tabs.Content value="LinkQuantityBubble" class="w-full h-full">
      <LinkQuantityBubble />
    </Tabs.Content>
</Tabs.Root>