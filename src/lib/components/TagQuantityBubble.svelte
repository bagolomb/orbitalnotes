<script>
    import { onMount, tick } from 'svelte';
    import { getTagsAndQuantity } from '$lib/functions/dbfuncs';
    import * as d3 from 'd3';
    import * as d3force from 'd3-force';

    let tags_and_quantity;
    let simulation;
    let graph_element;
    let graph_w;
    let graph_h;
    let ro;
    let processed_data = $state({ nodes: [] });

    onMount(() => {
        // Observe size changes of the SVG container
        ro = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                graph_w = width;
                graph_h = height;

                if (tags_and_quantity) runSimulation();
            }
        });

        ro.observe(graph_element);
        loadData();
    });

    async function loadData() {
        tags_and_quantity = Object.values(await getTagsAndQuantity());
        if (graph_w && graph_h) runSimulation();
    }

    async function runSimulation() {
        const quantities = tags_and_quantity.map(d => d.quantity);
        const minQ = d3.min(quantities);
        const maxQ = d3.max(quantities);
        const rScale = d3.scaleSqrt().domain([minQ, maxQ]).range([30, 80]);

        simulation = d3force.forceSimulation(tags_and_quantity)
            .force('charge', d3force.forceManyBody().strength(1000))
            .force('center', d3force.forceCenter(graph_w / 2, graph_h / 2))
            .force('collision', d3force.forceCollide().radius(d => rScale(d.quantity)));

        simulation.tick(600);
        simulation.stop();

        // Set processed_data with placeholders for textEl and label dimensions
        processed_data.nodes = simulation.nodes().map(d => ({
            ...d,
            x: d.x,
            y: d.y,
            r: rScale(d.quantity),
            textEl: null,
            labelWidth: 0,
            labelHeight: 0
        }));

        // Wait for DOM update before measuring text
        await tick();

        for (const node of processed_data.nodes) {
            if (node.textEl) {
                const bbox = node.textEl.getBBox();
                node.labelWidth = bbox.width;
                node.labelHeight = bbox.height;
            }
        }
    }
</script>

<div class="w-full h-full">
    <svg bind:this={graph_element} class="w-full h-full">
        {#each processed_data.nodes as node}
            <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill="red"
            />
            <g transform="translate({node.x}, {node.y})" class="label">
                {#if node.labelWidth && node.labelHeight}
                    <rect
                        x={-node.labelWidth / 2 - 4}
                        y={-node.labelHeight / 2 - 2}
                        width={node.labelWidth + 8}
                        height={node.labelHeight + 4}
                        fill="white"
                        stroke="black"
                        rx="4"
                        ry="4"
                    />
                {/if}
                <text
                    bind:this={node.textEl}
                    text-anchor="middle"
                    alignment-baseline="middle"
                    font-size="10px"
                    fill="black"
                >
                    {node.tag_name}
                </text>
            </g>
        {/each}
    </svg>
</div>
