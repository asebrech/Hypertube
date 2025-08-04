<script>
	export let title = 'Loading...';
	export let subtitle = 'Please wait while we prepare your content';
	export let variant = 'video'; // 'video', 'general', 'conversion'

	$: if (variant === 'conversion') {
		title = 'Converting Video';
		subtitle = 'Optimizing quality for the best streaming experience...';
	}
</script>

<div class="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
	<div class="text-center">
		<!-- Simple spinner -->
		<div class="mx-auto mb-8 h-12 w-12">
			<div class="h-full w-full animate-spin rounded-full border-4 border-gray-700 border-t-red-600"></div>
		</div>
		
		<!-- Loading text -->
		<div class="space-y-2">
			<h2 class="text-2xl font-semibold text-red-600">{title}</h2>
			<p class="text-gray-300">{subtitle}</p>
		</div>
	</div>
</div>

<style>
	.netflix-loader {
		min-height: 400px;
		background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.content-container {
		text-align: center;
		max-width: 400px;
		padding: 2rem;
	}

	.spinner {
		width: 50px;
		height: 50px;
		margin: 0 auto 2rem;
	}

	.spinner-ring {
		width: 100%;
		height: 100%;
		border: 3px solid rgba(255, 255, 255, 0.1);
		border-top: 3px solid #e50914;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading-text {
		color: white;
	}

	.title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #e50914;
	}

	.subtitle {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 2rem;
	}

	.progress-container {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 0 auto;
	}

	.progress-bar {
		flex: 1;
		height: 6px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #e50914, #ff4444);
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.progress-text {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
		min-width: 45px;
		text-align: right;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.content-container {
			padding: 1rem;
		}
		
		.title {
			font-size: 1.25rem;
		}
		
		.subtitle {
			font-size: 0.8rem;
		}
	}
</style>

