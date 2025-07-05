<script>
	import Canvas from './Canvas.svelte'
	import Palette from './Palette.svelte'
	
	const colors = [
		'#d58141',
		'#d7c44c',
		'#4fa9cc',
		'#3f8d27',
	]
	const background = '#fff'

	let color = $state(colors[0])
	let canvasInstance

	const handleSave = () => {
		canvasInstance.save()
	}

	const handleClear = () => {
		canvasInstance?.clear()
	}

	const handleLoad = (event) => {
		const file = event.target.files[0]
		if (!file) return
		
		const reader = new FileReader()
		reader.onload = (e) => {
			canvasInstance?.loadCanvasData(e.target.result)
		}
		reader.readAsText(file)
	}
</script>

<div class="w-full h-full">
	<h1 class="text-4xl font-semibold">Whiteboard</h1>
	
	<div class="flex flex-col items-center space-y-2">
		<Canvas bind:this={canvasInstance}
			{color} 
			{background} > 
			</Canvas>

		<Palette 
			paletteColor={color}
			{colors}
			{background}
			onColorChange={(newColor) => {
				color = newColor
			}}/>
	</div>
	
	<!-- Optional: Add save/load controls here if needed -->
	
	<div class="flex space-x-2">
		<button onclick={handleSave} class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
		<button onclick={handleClear} class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Clear</button>
		<label class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer">
			Load
			<input type="file" accept=".json" onchange={handleLoad} class="hidden" />
		</label>
	</div>
	
</div>