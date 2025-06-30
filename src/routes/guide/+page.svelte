<script>
	import { onMount } from 'svelte';
	import { marked } from 'marked';

	// Enable GFM and automatic line-breaks when two spaces appear at end-of-line
	marked.use({
		gfm: true,
		breaks: true,
	});

	// Each entry has a title and a raw‐Markdown string
	const examples = [
		{
			title: 'Headings',
			raw: `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
`
		},
        {
			title: 'Note Links and Note Tags',
			raw: `[[Note Title]]
@Tag`
		},
		{
			title: 'Paragraphs & Line-breaks',
			raw: `This is a paragraph to demonstrate how marked.js wraps content automatically when it exceeds the container width. If you keep typing without leaving a blank line, it stays within this paragraph.  

Here we have two spaces at the end of the line (above), which forces a “soft break” (↵).  

Below is a manual HTML break tag:

Line before <br> this text appears after a <br> tag.

Compared to leaving a blank line, which starts an entirely new paragraph.

This is a new paragraph after a blank line.`
		},
		{
			title: 'Styling (emphasis + strikethrough)',
			raw: `*Italic text*  
**Bold text**  
***Bold + Italic text***  
~~Strikethrough text~~`
		},
		{
			title: 'Links & Autolinks',
			raw: `[Custom link to Example.com](https://example.com)  
Email: <test@example.com>  
Visit https://svelte.dev/ for more info.`
		},
		{
			title: 'Lists (unordered, ordered, task-lists)',
			raw: `- Unordered item 1
- Unordered item 2
- Unordered item 3

1. Ordered item 1
2. Ordered item 2
3. Ordered item 3

- [x] Completed task
- [ ] Incomplete task
- [ ] Another task`
		},
		{
			title: 'Blockquotes',
			raw: `> This is a blockquote.
> It can span multiple lines.
> 
> - And even lists inside blockquotes.`
		},
		{
			title: 'Code Blocks (inline + fenced)',
			raw: `Here is some \`inline code\`.  

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
console.log(greet("World"));
\`\`\``
		},
		{
			title: 'Tables',
			raw: `| Name    | Role     | Age |
|:--------|:---------|:---:|
| Alice   | Engineer |  30 |
| Bob     | Designer |  25 |
| Charlie | PM       |  28 |`
		},
		{
			title: 'Images',
			raw: `![Svelte Logo](https://upload.wikimedia.org/wikipedia/commons/1/1b/Svelte_Logo.svg)  
Inline images render at their natural size unless constrained by CSS.`
		},
		{
			title: 'Horizontal Rules',
			raw: `---
or
***
or
___
`
		},
	];

	// No onMount needed unless you fetch these from somewhere
</script>


<div class="p-3 overflow-y-auto">
	<h1 class="text-4xl text-center mb-4">GitHub-Flavored Markdown Guide</h1>

	{#each examples as { title, raw }}
		<div class="bg-secondary p-4 rounded flex flex-col p-3">
			<h2 class="text-2xl text-center">{title}</h2>
			<div class="flex flex-row space-x-4">
				<!-- Left: raw Markdown -->
				<div class="w-1/2 bg-card rounded p-2">
					<div class="raw-markdown whitespace-pre-wrap">{raw}</div>
				</div>

				<!-- Right: rendered HTML -->
				<div class="w-1/2 bg-card rounded p-2">
					<div class="prose">{@html marked.parse(raw)}</div>
				</div>
			</div>
		</div>
	{/each}
</div>
