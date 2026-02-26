<script lang="ts">
	import WorkspaceFrame from '$lib/components/layout/Workspace.svelte';
	import Menu from '$lib/components/sections/Menu.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import FilmStrip from '$lib/components/sections/FilmStrip.svelte';
</script>

<div class="page-shell">
	<header class="page-header">
		<Menu />
	</header>

	<div class="page-frame">
		<WorkspaceFrame>
			фывыфв
		</WorkspaceFrame>
	</div>

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
		min-height: 600px;
	}

	.page-header {
		padding: 20px 23px 0px 23px;
	}

	.page-frame {
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
    }

	.page-footer {
		flex-shrink: 0;
		padding: 0 20px 20px;
	}
</style>