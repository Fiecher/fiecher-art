<script lang="ts">
	import WorkspaceFrame from '$lib/components/layout/WorkspaceFrame.svelte';
	import Menu from '$lib/components/sections/Menu.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import FilmStrip from '$lib/components/sections/FilmStrip.svelte';
</script>

<div class="page-shell">
	<header class="page-header">
		<Menu />
	</header>

	<WorkspaceFrame>
		<FilmStrip />
	</WorkspaceFrame>

	<footer class="page-footer">
		<Footer />
	</footer>
</div>

<style>
	.page-shell {
		display: flex;
		flex-direction: column;
		width: 100%;
		flex: 1;
		min-height: 0;
	}

	.page-header {
		flex-shrink: 0;
		padding: 20px;
	}

	.page-footer {
		flex-shrink: 0;
		padding: 0 20px 20px;
	}
</style>