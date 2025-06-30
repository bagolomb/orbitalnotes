<script>
    import { onMount, tick } from 'svelte';

	import * as Resizable from "$lib/components/ui/resizable/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";

    import * as d3 from 'd3';
    import * as d3force from "d3-force";
    import { Root } from './ui/button';

	let graph_element;
	let raw_mindmap_data = $state('');
    let mindmap_data = $derived(parseTabTree(raw_mindmap_data));
    let processed_data = $state({nodes: [], links: []});
    let graph_w;
    let graph_h;
    let ro;
    let text_area_suggestion = `Create a tabbed tree EX:
root
    child1
    child2
        grandchild 2.1
    child3
        grandchild 3.1
        grandchild 3.2
    child4`

    

	// Handle Tab key in Textarea
	function handleKeydown(event) {
		if (event.key === 'Tab') {
			event.preventDefault();
			const target = event.target;
			const start = target.selectionStart;
			const end = target.selectionEnd;

			raw_mindmap_data =
				raw_mindmap_data.slice(0, start) + '\t' + raw_mindmap_data.slice(end);

			// Restore cursor
			setTimeout(() => {
				target.selectionStart = target.selectionEnd = start + 1;
			}, 0);
		}
	}

	// Parse tab-indented text into D3-friendly structure
	function parseTabTree(input) {
        const lines = input.trim().split('\n');
        const nodes = [];
        const links = [];
        const stack = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const depth = line.match(/^\t*/)[0].length;
            const label = line.trim();
            if (!label) continue;

            // Always create a new, unique ID based on the current number of nodes
            const id = `node-${nodes.length}`;

            const node = { id, label };
            nodes.push(node);
            stack[depth] = node;

            if (depth > 0 && stack[depth - 1]) {
            links.push({
                source: stack[depth - 1].id,
                target: node.id
            });
            }

            stack.length = depth + 1;
        }

        console.log({ nodes, links });
        return { nodes, links };
    }


    $effect(async () => {
        const simulation = d3force.forceSimulation(mindmap_data.nodes)
            .force('charge', d3force.forceManyBody().strength(-300))
            .force('center', d3force.forceCenter(graph_w / 2, graph_h / 2))
            .force('collide',d3force.forceCollide().radius(5))
            .force('link',d3force.forceLink(mindmap_data.links).id(d => d.id).distance(80));

        simulation.tick(600);

        processed_data.nodes = simulation.nodes().map((d) => ({
            ...d,
            x: d.x,
            y: d.y,
            textEl: null,
            labelWidth: 0,
            labelHeight: 0
        }));
        processed_data.links = mindmap_data.links.map(l => ({
            source: { x: l.source.x, y: l.source.y },
            target: { x: l.target.x, y: l.target.y }
        }));
        await tick();

        for (const node of processed_data.nodes) {
            if (node.textEl) {
                const bbox = node.textEl.getBBox();
                node.labelWidth = bbox.width;
                node.labelHeight = bbox.height;
            }
        }   
    });

    onMount(() => {

        // Create a ResizeObserver that watches graph_element
        ro = new ResizeObserver(entries => {
        for (let entry of entries) {
            // entry.contentRect has the new size
            const { width, height } = entry.contentRect;
            graph_w = width;
            graph_h = height;

        }
        });

        ro.observe(graph_element);
    });

</script>

<div class="w-full h-full flex flex-col">
	<Resizable.PaneGroup direction="horizontal">
		<Resizable.Pane defaultSize={60} class="w-full h-full">
			<svg bind:this={graph_element} class="p-2 space-y-2 w-full h-full">
                {#each processed_data.links as link}
                    <line
                        x1={link.source.x}
                        y1={link.source.y}
                        x2={link.target.x}
                        y2={link.target.y}
                        stroke="red"
                        stroke-width="1" />
                {/each}
                {#each processed_data.nodes as node}
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
                            font-size="12px"
                            fill="black"
                        >
                            {node.label}
                        </text>
                    </g>
                {/each}
                
			</svg>
		</Resizable.Pane>
		<Resizable.Handle class="w-3" />
		<Resizable.Pane defaultSize={40}>
			<div class="p-2 w-full h-full prose prose-invert">
				<Textarea
					bind:value={raw_mindmap_data}
                    placeholder={text_area_suggestion}
					onkeydown={handleKeydown}
					class="resize-none w-full h-full rounded-none"
				/>
			</div>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
