<script lang='ts'>
  import { base } from '$app/paths'
</script>

<svelte:head>
  <title>404 — Page not found</title>
</svelte:head>

<div class='shell'>
  <div class='content'>
    <p class='code'>404</p>
    <h1 class='title'>HOW DID YOU GET HERE?</h1>
    <p class='sub'>The thing you're looking for doesn't exist.</p>
    <a class='back' href={`${base}/`}>← BACK TO WEBSITE</a>
  </div>
</div>

<style>
  .shell {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    padding: 2rem;
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
  }

  .code {
    font-family: var(--font-secondary);
    font-size: clamp(5rem, 20vw, 12rem);
    font-weight: 700;
    color: var(--color-secondary);
    opacity: 0.08;
    line-height: 1;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .title {
    font-family: var(--font-main);
    font-size: clamp(2rem, 6vw, 4rem);
    font-weight: 400;
    color: var(--color-secondary);
    letter-spacing: 0.15em;
    margin: 0;
    text-shadow:
      1px 1px 0 rgba(0, 0, 0, 0.6),
      0 2px 4px rgba(0, 0, 0, 0.28);
  }

  .sub {
    font-family: var(--font-secondary);
    font-size: clamp(0.85rem, 2vw, 1.1rem);
    color: var(--color-secondary);
    opacity: 0.35;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 0;
  }

  .back {
    margin-top: 1.5rem;
    font-family: var(--font-secondary);
    font-size: clamp(0.75rem, 1.5vw, 0.95rem);
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--color-secondary);
    text-decoration: none;
    opacity: 0.5;
    transition: opacity 0.2s ease;
  }

  .back:hover {
    opacity: 1;
  }
</style>
