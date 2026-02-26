<script lang="ts">
	let { children } = $props();
</script>

<div class="workspace-frame">
	<main class="workspace-main">
		{@render children()}
	</main>
</div>

<style>
	.workspace-frame {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
		background-color: var(--color-secondary);
	}


	.workspace-main {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	@media (max-width: 1279px) {
		.workspace-main {
			padding: 0px;
		}
	}
</style>