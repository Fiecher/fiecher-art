<script lang='ts'>
  import Footer from '$lib/components/Footer.svelte'
  import Info from '$lib/components/Info.svelte'
  import Menu from '$lib/components/Menu.svelte'
  import Reel from '$lib/components/Reel.svelte'
  import Works from '$lib/components/Works.svelte'
  import { activeSection, goToSection, initNavigation } from '$lib/navigation'
  import { onDestroy, onMount } from 'svelte'
  import { fade } from 'svelte/transition'

  let unsubscribe: (() => void) | null = null
  onMount(() => {
    unsubscribe = initNavigation()
  })
  onDestroy(() => {
    unsubscribe?.()
  })

  const isInfo = $derived($activeSection === 'CONTACT')
  const isWorks = $derived($activeSection === 'WORKS')
  const isReel = $derived($activeSection === 'REEL')

  let prevSection = $activeSection
  let worksEntryDelay = $state(0)

  $effect(() => {
    if ($activeSection === 'WORKS' && prevSection === 'CONTACT') {
      worksEntryDelay = 150
    } else if ($activeSection !== 'WORKS') {
      worksEntryDelay = 0
    }
    prevSection = $activeSection
  })

  let reelReady = $state(false)

  onMount(() => {
    const handler = () => {
      reelReady = true
    }
    window.addEventListener('app:loaded', handler, { once: true })
    return () => window.removeEventListener('app:loaded', handler)
  })
</script>

<div class='page-shell'>
  <header class='page-header'>
    <Menu activeItem={$activeSection} onSelect={goToSection} />
  </header>
  <div class='stage'>
    <div
      class='workspace-wrapper'
      class:workspace-wrapper--collapsed={isInfo}
    >
      <div class='workspace-frame'>
        <main class='workspace-main'>

          <section
            class='workspace-section workspace-section--reel'
            class:workspace-section--hidden={!isReel && !isWorks}
            aria-hidden={isInfo}
          >
            <Reel
              ready={reelReady}
              playing={isReel}
              dimmed={!isReel}
            />
          </section>

          <section
            class='workspace-section workspace-section--overlay'
            class:workspace-section--invisible={!isWorks}
            aria-hidden={!isWorks}
          >
            <Works entryDelay={worksEntryDelay} overlay={true} visible={isWorks} />
          </section>

        </main>
      </div>
    </div>
    <div class='footer-wrapper' class:footer-wrapper--info={isInfo}>
      {#if isInfo}
        <Info />
      {:else}
        <div in:fade={{ duration: 200 }}>
          <Footer onContactOpen={() => goToSection('CONTACT')} />
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
      padding 0.6s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .workspace-wrapper--collapsed {
    flex: 0;
    padding-top: 0;
    padding-bottom: 0;
    pointer-events: none;
    opacity: 0.3;
  }
  .workspace-frame {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    background-color: var(--color-secondary);
    position: relative;
    isolation: isolate;
  }
  .workspace-main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
    overflow: hidden;
    position: relative;
  }
  @media (max-width: 1279px) {
    .workspace-main { padding: 0; }
  }
  .workspace-section {
    flex: 1;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
  .workspace-section--reel {
    position: absolute;
    inset: 0;
    z-index: 1;
  }
  .workspace-section--hidden {
    pointer-events: none;
  }
  .workspace-section--overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: auto;
    contain: layout style;
  }
  .workspace-section--invisible {
    visibility: hidden;
    pointer-events: none;
  }
  .footer-wrapper {
    flex-shrink: 0;
    padding: 0 20px 20px 20px;
  }
</style>
