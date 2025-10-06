<script lang="ts">
	import { _ } from 'svelte-i18n';
</script>

<!-- TitleBar -->
<div
    class={`relative sm:fixed top-0 sm:top-16 z-40 min-h-16 items-center text-white transition-colors duration-[100ms] bg-[#141414] py-6 mt-16 sm:mt-0
        w-full sm:w-[calc(100%-21.428%)]
        md:w-[calc(100%-16.666%)]
        lg:w-[calc(100%-13.636%)]
        xl:w-[calc(100%-11.538%)]
        px-4 sm:px-0
        sm:mx-[10.714%]
        md:mx-[8.333%]
        lg:mx-[6.818%]
        xl:mx-[5.769%]
    `}
>
		<slot />
</div>
