<script lang='ts'>
  import Footer from '$lib/components/Footer.svelte'
  import Info from '$lib/components/Info.svelte'
  import Menu from '$lib/components/Menu.svelte'
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

  $: isInfo = $activeSection === 'INFO'

  let prevSection = $activeSection
  let worksEntryDelay = 0
  $: {
    if ($activeSection === 'WORKS' && prevSection === 'INFO') {
      worksEntryDelay = 150
    } else if ($activeSection !== 'WORKS') {
      worksEntryDelay = 0
    }
    prevSection = $activeSection
  }
</script>

<div class='page-shell'>
  <header class='page-header'>
    <Menu activeItem={$activeSection} onSelect={goToSection} />
  </header>
  <div class='stage'>
    <div class='workspace-wrapper' class:workspace-wrapper--collapsed={isInfo}>
      <div class='workspace-frame'>
        <main class='workspace-main'>
          {#if $activeSection === 'REEL'}
            <section
              class='workspace-section'
              in:fade={{ duration: 300, delay: 150 }}
            >
              <h1 class='works-title'>REEL</h1>
            </section>
          {:else if $activeSection === 'WORKS'}
            <Works entryDelay={worksEntryDelay} />
          {/if}
        </main>
      </div>
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
  }

  @media (max-width: 1279px) {
    .workspace-main {
      padding: 0px;
    }
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
