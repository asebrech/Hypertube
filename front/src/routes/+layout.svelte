<script lang="ts">
	import '../app.css';
	let { children } = $props();
	import { ModeWatcher } from 'mode-watcher';
</script>

<ModeWatcher defaultMode={'dark'} />

{@render children?.()}
