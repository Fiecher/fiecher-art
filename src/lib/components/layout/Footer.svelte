<script lang="ts">
	import type { FooterItem } from '$lib/types';

	const defaultItems: FooterItem[] = [
		{
			label: 'made by',
			value: 'Stepan Belebezev',
		},
		{
			label: 'contact via',
			value: ['Mail', 'Telegram'],
		},
		{
			label: 'hosted on',
			value: 'Github Pages',
		},
		{
			label: 'all rights reserved',
			value: new Date().getFullYear().toString(),
		},
	];

	const { items = defaultItems } = $props();

	function normalizeValue(value: string | string[]): string[] {
		return Array.isArray(value) ? value : [value];
	}
</script>

<footer class="footer">
	<div class="footer-grid">
		{#each items as item, index (index)}
			<div class="footer-cell" class:footer-cell--right={index % 2 === 1}>
				<div class="footer-text-block">
					<span class="footer-label">{item.label}&nbsp;</span>

					{#each normalizeValue(item.value) as value, valueIndex}
						<span class="footer-value">{value}</span>

						{#if valueIndex < normalizeValue(item.value).length - 1}
							<span class="footer-label">&nbsp;or&nbsp;</span>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>
</footer>

<style>
	.footer {
		background-color: var(--color-primary);
		padding: 12px 16px;
	}

	.footer-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, auto);
		gap: 10px 20px;
	}

	.footer-cell {
		display: flex;
		align-items: baseline;
		font-family: var(--font-secondary);
		color: var(--color-secondary);
		text-transform: uppercase;
		letter-spacing: -0.5px;
	}

	.footer-cell--right {
		justify-content: flex-end;
		text-align: right;
	}

	.footer-text-block {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
	}

	.footer-cell--right .footer-text-block {
		justify-content: flex-end;
	}

	.footer-label {
		font-size: 15px;
		font-weight: 400;
	}

	.footer-value {
		font-size: 25px;
		font-weight: 400;
	}

</style>