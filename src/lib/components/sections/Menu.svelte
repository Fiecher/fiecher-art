<script lang="ts">
    import type { NavigationItems } from '$lib/types';

    const MENU_ITEMS: NavigationItems = ['REEL', 'WORKS', 'CONTACT'] as const;
    const PADDING_OFFSET = 40;
    const GAP_SIZE = 24;

    let active = $state<string>(MENU_ITEMS[0]);
    let isDropdownOpen = $state(false);
    let isCollapsed = $state(false);
    let dropdownHeight = $state(0);

    let measureEl: HTMLUListElement | null = null;
    let dropdownEl = $state<HTMLUListElement | null>(null);

    function checkMenuOverflow(): void {
        if (!measureEl) return;

        const navElement = measureEl.closest('nav') as HTMLElement | null;
        if (!navElement) return;

        const availableWidth = navElement.clientWidth - PADDING_OFFSET;
        let totalWidth = 0;

        measureEl.querySelectorAll('li').forEach((li) => {
            totalWidth += (li as HTMLElement).scrollWidth;
        });

        totalWidth += (MENU_ITEMS.length - 1) * GAP_SIZE;
        isCollapsed = totalWidth > availableWidth;
    }

    
    function selectMenuItem(item: string): void {
        active = item;
        isDropdownOpen = false;
        
    }

    $effect(() => {
        if (!measureEl) return;

        const navElement = measureEl.closest('nav') as HTMLElement | null;
        if (!navElement) return;

        const resizeObserver = new ResizeObserver(checkMenuOverflow);
        resizeObserver.observe(navElement);
        checkMenuOverflow();

        return () => resizeObserver.disconnect();
    });

    $effect(() => {
        if (dropdownEl) {
            dropdownHeight = dropdownEl.scrollHeight;
        }
    });
</script>

<nav
    class="menu"
    class:menu--open={isDropdownOpen && isCollapsed}
    style={isDropdownOpen && isCollapsed ? `--dropdown-height: ${dropdownHeight}px` : ''}
>
    <div
        class="menu-border"
        class:menu-border--expanded={isDropdownOpen && isCollapsed}
    ></div>

    <ul class="menu-list menu-list--measure" bind:this={measureEl} aria-hidden="true">
        {#each MENU_ITEMS as item}
            <li><span class="menu-text">{item}</span></li>
        {/each}
    </ul>

    {#if !isCollapsed}
        <ul class="menu-list">
            {#each MENU_ITEMS as item}
                <li>
                    <button
                        class="menu-text"
                        class:menu-text--active={item === active}
                        onclick={() => (active = item)}
                        type="button"
                    >{item}</button>
                </li>
            {/each}
        </ul>
    {:else}
        <div class="menu-collapsed">
            <button
                class="menu-trigger"
                onclick={() => (isDropdownOpen = !isDropdownOpen)}
                aria-expanded={isDropdownOpen}
                type="button"
            >
                <span
                    class="menu-text menu-text--active"
                    class:menu-text--open={isDropdownOpen}
                >{active}</span>
            </button>

            <div class="menu-dropdown-grid" class:menu-dropdown-grid--open={isDropdownOpen}>
                <div class="menu-dropdown-overflow">
                    <ul class="menu-dropdown" bind:this={dropdownEl}>
                        {#each MENU_ITEMS.filter((i) => i !== active) as item}
                            <li>
                                <button
                                    class="menu-text menu-dropdown-item"
                                    onclick={() => selectMenuItem(item)}
                                    type="button"
                                >{item}</button>
                            </li>
                        {/each}
                    </ul>
                </div>
            </div>
        </div>
    {/if}
</nav>

<style>
    .menu {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        position: relative;
        width: 100%;
        box-sizing: border-box;
        --dropdown-height: 0px;
        transition: margin-bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .menu-border {
        position: absolute;
        inset: -3px -3px 0 -3px;
        border: 0.5rem solid var(--color-secondary);
        pointer-events: none;
        z-index: 2;
    }

    .menu-list {
        display: flex;
        gap: 2rem;
        list-style: none;
        margin: 0;
        padding: 0;
        position: relative;
        z-index: 1;
    }

    .menu-list--measure {
        position: absolute;
        visibility: hidden;
        pointer-events: none;
        white-space: nowrap;
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
        background: none;
        border: none;
        cursor: pointer;
        white-space: nowrap;
    }

    .menu-text::before,
    .menu-text::after {
        content: '';
        position: absolute;
        bottom: 2px;
        height: 0.25rem;
        background-color: var(--color-secondary);
        transition:
            width 0.15s ease-in-out,
            transform 0.15s ease-in-out;
        width: 0;
    }

    .menu-text::before {
        right: 50%;
        transform-origin: right bottom;
    }

    .menu-text::after {
        left: 50%;
        transform-origin: left bottom;
    }

    .menu-text:hover::before,
    .menu-text:hover::after,
    .menu-text--active::before,
    .menu-text--active::after {
        width: 50%;
    }

    .menu-text:hover {
        transform: scale(1.05);
    }

    .menu-trigger:hover .menu-text {
        transform: none;
    }

    .menu-trigger:hover .menu-text::before {
        width: 50%;
        transform: translateY(5px) rotate(4deg);
    }

    .menu-trigger:hover .menu-text::after {
        width: 50%;
        transform: translateY(5px) rotate(-4deg);
    }

    .menu-text--open::before {
        width: 50%;
        transform: translateY(5px) rotate(4deg);
    }

    .menu-text--open::after {
        width: 50%;
        transform: translateY(5px) rotate(-4deg);
    }

    .menu-collapsed {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }

    .menu-trigger {
        display: flex;
        align-items: center;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
    }

    .menu-dropdown-grid {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        width: 100%;
    }

    .menu-dropdown-grid--open {
        grid-template-rows: 1fr;
    }

    .menu-dropdown-overflow {
        overflow: hidden;
        min-height: 0;
    }

    .menu-dropdown {
        list-style: none;
        margin: 0;
        padding: 0.5rem 0 0.75rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
    }

    .menu-dropdown-item {
        font-size: 5rem;
        transition:
            transform 0.2s ease;
    }

    .menu-dropdown-item:hover {

        transform: scale(1.03);
    }

    
    .menu-list:has(.menu-text:not(.menu-text--active):hover) .menu-text--active::before,
    .menu-list:has(.menu-text:not(.menu-text--active):hover) .menu-text--active::after {
        width: 0;
    }

    @media (max-width: 768px) {
        .menu {
            padding-inline: 16px;
        }
    }
</style>