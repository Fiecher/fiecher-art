<nav class="menu">
	<div class="menu-border"></div>
	<ul class="menu-list">
		<li><p class="menu-text">REEL</p></li>
		<li><p class="menu-text">WORKS</p></li>
		<li><p class="menu-text">CONTACT</p></li>
	</ul>
</nav>

<style>
	.menu {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		position: relative;
		width: 100%;
		margin-top: 20px;
	}

	.menu-border {
		position: absolute;
		inset: -3px -3px 0 -3px;
		border: 0.5rem solid var(--color-secondary);
	}

	.menu-list {
		display: flex;
		gap: 1.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
		position: relative;
		z-index: 1;
	}

	.menu-text {
		font-family: var(--font-main);
		font-size: 5rem;
		font-weight: 400;
		line-height: 1;
		margin: 0;
		padding: 0;
		color: var(--color-secondary);
		text-align: center;
		display: inline-block;
		position: relative;
		transition: all 0.3s ease;
	}

	.menu-text::after {
		content: '';
		position: absolute;
		bottom: 2px;
		left: 50%;
		width: 0;
		height: 0.25rem;
		background-color: var(--color-secondary);
		transition: width 0.3s ease;
		transform: translateX(-50%);
	}

	.menu-text:hover::after {
		width: 100%;
	}

	.menu-text:hover {
		transform: scale(1.05);
	}
</style>