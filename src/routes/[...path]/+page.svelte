<script lang='ts'>
  import Footer from '$lib/components/layout/Footer.svelte'
  import Menu from '$lib/components/layout/Menu.svelte'
  import WorkspaceFrame from '$lib/components/layout/Workspace.svelte'
  import Info from '$lib/components/sections/Info.svelte'
  import Works from '$lib/components/sections/Works.svelte'
  import { activeSection, goToSection, initNavigation, isTransitioning, SECTIONS } from '$lib/navigation'
  import { onDestroy, onMount } from 'svelte'
  import { fade } from 'svelte/transition'

  let unsubscribe: (() => void) | null = null
  let scrollAccumulator = 0
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null
  const SCROLL_THRESHOLD = 100
  const SCROLL_RESET_DELAY = 150

  onMount(() => {
    unsubscribe = initNavigation()
    window.addEventListener('wheel', handleWheelGlobal, { passive: false })
  })

  onDestroy(() => {
    unsubscribe?.()
    window.removeEventListener('wheel', handleWheelGlobal)
    if (scrollTimeout)
      clearTimeout(scrollTimeout)
  })

  function handleWheelGlobal(event: WheelEvent) {
    if ($activeSection === 'WORKS')
      return

    event.preventDefault()

    if ($isTransitioning)
      return

    let normalizedDelta = event.deltaY

    if (event.deltaMode === 1) {
      normalizedDelta *= 16
    } else if (event.deltaMode === 2) {
      normalizedDelta *= 100
    }

    scrollAccumulator += normalizedDelta

    if (scrollTimeout)
      clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      scrollAccumulator = 0
    }, SCROLL_RESET_DELAY)

    if (Math.abs(scrollAccumulator) >= SCROLL_THRESHOLD) {
      navigateByDelta(scrollAccumulator)
      scrollAccumulator = 0
      if (scrollTimeout)
        clearTimeout(scrollTimeout)
    }
  }

  function navigateByDelta(dy: number) {
    const idx = SECTIONS.indexOf($activeSection)
    if (dy > 0 && idx < SECTIONS.length - 1) {
      goToSection(SECTIONS[idx + 1])
    } else if (dy < 0 && idx > 0) {
      goToSection(SECTIONS[idx - 1])
    }
  }

  let touchStartY = 0
  function onTouchStart(e: TouchEvent) {
    touchStartY = e.touches[0].clientY
  }

  function onTouchEnd(e: TouchEvent) {
    if ($activeSection === 'WORKS')
      return

    const dy = touchStartY - e.changedTouches[0].clientY
    if (Math.abs(dy) < 40 || $isTransitioning)
      return

    navigateByDelta(dy)
  }

  $: isInfo = $activeSection === 'INFO'
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class='page-shell'
  on:touchstart={onTouchStart}
  on:touchend={onTouchEnd}
>
  <header class='page-header'>
    <Menu activeItem={$activeSection} onSelect={goToSection} />
  </header>
  <div class='stage'>
    <div class='workspace-wrapper' class:workspace-wrapper--collapsed={isInfo}>
      <WorkspaceFrame>
        {#if $activeSection === 'REEL'}
          <section
            class='workspace-section'
            in:fade={{ duration: 300, delay: 150 }}
          >
            <h1 class='works-title'>REEL</h1>
          </section>
        {:else if $activeSection === 'WORKS'}
          <Works
            onNext={() => {
              if (!$isTransitioning)
                goToSection('INFO')
            }}
            onPrev={() => {
              if (!$isTransitioning)
                goToSection('REEL')
            }}
          />
        {/if}
      </WorkspaceFrame>
    </div>
    <div class='footer-wrapper'>
      {#if isInfo}
        <Info />
      {:else}
        <div in:fade={{ duration: 200 }}>
          <Footer onContactOpen={() => goToSection('INFO')} />
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }
  .workspace-wrapper {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
    padding: 20px;
    transition:
      flex 0.6s cubic-bezier(0.4, 0, 0.2, 1),
      padding 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .workspace-wrapper--collapsed {
    flex: 0;
    padding-top: 0;
    padding-bottom: 0;
    pointer-events: none;
  }
  .workspace-section {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .works-title {
    font-family: var(--font-main);
    font-size: 5rem;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-primary);
  }
  .footer-wrapper {
    flex-shrink: 0;
    padding: 0 20px 20px 20px;
  }
</style>
