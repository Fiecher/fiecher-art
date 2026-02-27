<script lang='ts'>
  import Footer from '$lib/components/layout/Footer.svelte'
  import Menu from '$lib/components/layout/Menu.svelte'
  import WorkspaceFrame from '$lib/components/layout/Workspace.svelte'
  import Info from '$lib/components/sections/Info.svelte'
  import { activeSection, goToSection, initNavigation, isTransitioning, SECTIONS } from '$lib/navigation'
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'

  onMount(() => initNavigation())

  function handleWheel(event: WheelEvent) {
    event.preventDefault()

    if ($isTransitioning || Math.abs(event.deltaY) < 20)
      return

    const idx = SECTIONS.indexOf($activeSection)

    if (event.deltaY > 0 && idx < SECTIONS.length - 1)
      goToSection(SECTIONS[idx + 1])
    else if (event.deltaY < 0 && idx > 0)
      goToSection(SECTIONS[idx - 1])
  }

  $: isInfo = $activeSection === 'INFO'
</script>

<div class='page-shell' on:wheel={handleWheel}>
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
          <section
            class='workspace-section workspace-section--works'
            in:fade={{ duration: 300, delay: 150 }}
          >
            <h1 class='works-title'>WORKS</h1>
          </section>
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
  .page-shell {
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
    min-height: 100vh;
    overflow: hidden;
  }

  .page-header {
    padding: 20px 23px 0 23px;
  }

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

  .workspace-section--works {
    text-align: center;
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

  @media (max-width: 768px) {
    .workspace-wrapper {
      padding-inline: 16px;
    }

    .footer-wrapper {
      padding-inline: 16px;
    }

    .works-title {
      font-size: 3rem;
    }
  }
</style>
