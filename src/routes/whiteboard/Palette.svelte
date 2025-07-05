<script>
	let { 
		colors = [
			'#d58141',
			'#d7c44c',
			'#4fa9cc',
			'#3f8d27',
		], 
		paletteColor = $bindable(), 
		background = '#fff',
		onColorChange
	} = $props()

	const handleColorSelect = (color) => {
		paletteColor = color
		onColorChange?.(color)
	}
</script>

<section class="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
	<div class="flex space-x-2">
		{#each colors as color}
		<button 
			onclick={() => handleColorSelect(color)}
			style:background={color}
			class="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors duration-200 flex-shrink-0 shadow-sm">
			<span class="visually-hidden">
				//
			</span>
		</button>
		{/each}
	</div>
	
	<button 
		onclick={() => handleColorSelect(background)}
		style:background
		class="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors duration-200 flex-shrink-0 shadow-sm">
		<span class="visually-hidden">
			//
		</span>
	</button>
	
	<svg 
		style:color={paletteColor} 
		viewBox="-50 -50 100 100"
		class="w-8 h-8 text-current">
		<g fill="currentColor" stroke="currentColor" stroke-width="0" stroke-linecap="round">
			<path d="M -38 12 a 38 38 0 0 0 76 0 q 0 -28 -38 -62 -38 34 -38 62" />
		</g>
	</svg>	
</section>