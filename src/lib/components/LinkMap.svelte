<script>
    import { onMount, tick } from 'svelte';
    import { getNoteLinksWithNoteTitles, getTitlesAndIds } from '$lib/functions/dbfuncs';
    import * as d3 from 'd3';
    import * as d3force from 'd3-force';
  
    let simulation;
    let graph_element;
    let graph_w;
    let graph_h;
    let ro;
  
    let processed_data = $state({ nodes: [], links: [] });
  
    onMount(() => {
      ro = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          graph_w = width;
          graph_h = height;
  
          if (graph_w && graph_h) loadData(); // trigger on resize once dimensions known
        }
      });
  
      ro.observe(graph_element);
    });
  
    async function loadData() {
      const note_link_with_note_titles = await getNoteLinksWithNoteTitles(); // from_note_id, to_note_id, from_title, to_title
      const titles_and_ids = await getTitlesAndIds(); // note_id, note_title
  
      // Build nodes (deduplicated by ID)
      const nodes = titles_and_ids.map(d => ({
        id: d.note_id,
        title: d.note_title,
      }));
  
      const validIds = new Set(nodes.map(n => n.id));
  
      // Build links (only between valid nodes)
      const links = note_link_with_note_titles
        .filter(l => validIds.has(l.from_note_id) && validIds.has(l.to_note_id))
        .map(l => ({
          source: l.from_note_id,
          target: l.to_note_id,
        }));
  
      const rScale = d3.scaleSqrt().domain([1, 10]).range([30, 60]);
  
      simulation = d3force.forceSimulation(nodes)
        .force("charge", d3force.forceManyBody().strength(-300))
        .force("center", d3force.forceCenter(graph_w / 2, graph_h / 2))
        .force("link", d3force.forceLink(links).id(d => d.id).distance(160))
        .force("collision", d3force.forceCollide().radius(() => 40));
  
      simulation.tick(300);
      simulation.stop();
  
      processed_data.nodes = nodes.map(d => ({
        ...d,
        x: d.x,
        y: d.y,
        r: 30,
        textEl: null,
        labelWidth: 0,
        labelHeight: 0
      }));
  
      processed_data.links = links;
  
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
        {#each processed_data.links as link}
            <line
                x1={link.source.x}
                y1={link.source.y}
                x2={link.target.x}
                y2={link.target.y}
                stroke="grey"
                stroke-width="1"
            />
        {/each}
        {#each processed_data.nodes as node}
            <!-- Group circle+text together -->
            <!-- Node group centered at (x, y) -->
            <g transform="translate({node.x}, {node.y})">
                <!-- Circle (visual background) -->
                <circle r={node.r} fill="red" />
            
                <!-- Rect + Text centered inside circle -->
                <g class="label">
                <rect
                    x={-(node.labelWidth / 2 + 4)}
                    y={-(node.labelHeight / 2 + 2)}
                    width={node.labelWidth + 8}
                    height={node.labelHeight + 4}
                    fill="white"
                    stroke="black"
                    rx="4"
                    ry="4"
                />
                <text
                    bind:this={node.textEl}
                    text-anchor="middle"
                    alignment-baseline="middle"
                    font-size="10px"
                    fill="black"
                >
                    {node.title}
                </text>
                </g>
            </g>
        {/each}
    </svg>
</div>