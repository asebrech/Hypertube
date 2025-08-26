<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen bg-cover bg-center bg-no-repeat relative" style="background-image: url('/img/netflix-background.jpg');">
	<div class="absolute inset-0 bg-black/50"></div>
	<div class="relative z-10 flex flex-1 items-center justify-center min-h-screen">
		{@render children()}
	</div>
</div>
