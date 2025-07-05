<script>
	import { onMount, onDestroy } from 'svelte'
	
	let { 
		width = 800, 
		height = 600, 
		color = '#333', 
		background = '#fff' 
	} = $props()
	
	let canvas
	let context
	let isDrawing = $state(false)
	let start = $state({})
	let animationId = $state(null)
	
	onMount(() => {
		context = canvas.getContext('2d')
		context.lineWidth = 3
		context.lineCap = 'round'
		context.lineJoin = 'round'
	})
	
	$effect(() => {
		if (context) {
			// Batch canvas context updates
			requestAnimationFrame(() => {
				context.strokeStyle = color
			})
		}
	})

	onDestroy(() => {
		if (animationId) {
			cancelAnimationFrame(animationId)
		}
	})
	
	const handleStart = ((event) => { 
		const { x, y } = getCanvasCoordinates(event.clientX, event.clientY)
		
		if(color === background) {
			context.clearRect(0, 0, width, height)
		} else {
			isDrawing = true
			start = { x, y }
			context.beginPath()
			context.moveTo(x, y)
		}
	})
	
	const handleEnd = () => { 
		isDrawing = false 
	}
	
	const handleMove = ((event) => {
		if(!isDrawing) return
		
		// Use requestAnimationFrame to throttle drawing for better performance
		if (animationId) return
		
		animationId = requestAnimationFrame(() => {
			const { x: x1, y: y1 } = getCanvasCoordinates(event.clientX, event.clientY)
			const { x, y } = start
			context.lineTo(x1, y1)
			context.stroke()
			
			start = { x: x1, y: y1 }
			animationId = null
		})
	})
	
	const getCanvasCoordinates = (clientX, clientY) => {
		const rect = canvas.getBoundingClientRect()
		const scaleX = canvas.width / rect.width
		const scaleY = canvas.height / rect.height
		
		return {
			x: (clientX - rect.left) * scaleX,
			y: (clientY - rect.top) * scaleY
		}
	}

	// Export methods for parent component
	export function clear() {
		if (context) {
			context.clearRect(0, 0, width, height)
		}
	}

	export function save() {
		if (canvas) {
			const dataURL = canvas.toDataURL('image/png')
			const link = document.createElement('a')
			link.download = 'whiteboard-drawing.png'
			link.href = dataURL
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
		}
	}

	export function loadCanvasData(data) {
		// Implementation depends on your data format
		console.log('Loading canvas data:', data)
	}
</script>

<svelte:window />

<canvas
	bind:this={canvas} 
	{width}
	{height}
	style:background
	onmousedown={handleStart}	
	ontouchstart={e => {
		e.preventDefault()
		const { clientX, clientY } = e.touches[0]
		const { x, y } = getCanvasCoordinates(clientX, clientY)
		
		if(color === background) {
			context.clearRect(0, 0, width, height)
		} else {
			isDrawing = true
			start = { x, y }
			context.beginPath()
			context.moveTo(x, y)
		}
	}}	
	onmouseup={handleEnd}				
	ontouchend={handleEnd}				
	onmouseleave={handleEnd}
	onmousemove={handleMove}
	ontouchmove={e => {
		e.preventDefault()
		if(!isDrawing) return
		
		const { clientX, clientY } = e.touches[0]
		const { x: x1, y: y1 } = getCanvasCoordinates(clientX, clientY)
		const { x, y } = start
		context.lineTo(x1, y1)
		context.stroke()
		
		start = { x: x1, y: y1 }
	}}
	class="border-2 cursor-crosshair w-full max-w-4xl"
	style="aspect-ratio: 4/3;"
>
</canvas>