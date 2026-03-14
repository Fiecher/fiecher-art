<script lang='ts'>
  import { base } from '$app/paths'
</script>

<svelte:head>
  <title>404 — Fiecher</title>
</svelte:head>

<div class='shell'>
  <div
    class='paper'
    style={`background-image: url('${base}/textures/paper.jpg')`}
    aria-hidden='true'
  ></div>

  <div class='content'>
    <p class='eyebrow'>Error</p>
    <h1 class='code'>404</h1>
    <p class='message'>This page does not exist</p>
    <a class='back' href={`${base}/reel`}>← Back to site</a>
  </div>
</div>

<style>
  .shell {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    position: relative;
    isolation: isolate;
    padding: 2rem;
  }

  .paper {
    position: absolute;
    inset: 0;
    z-index: 0;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    mix-blend-mode: multiply;
    opacity: 0.82;
    pointer-events: none;
  }

  .content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
  }

  .eyebrow {
    font-family: var(--font-secondary);
    font-size: clamp(0.75rem, 1.5vw, 0.95rem);
    font-weight: 400;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--color-accent);
    margin: 0;
  }

  .code {
    font-family: var(--font-main);
    font-size: clamp(8rem, 30vw, 18rem);
    font-weight: 400;
    line-height: 0.85;
    margin: 0;
    color: var(--color-secondary);
    text-shadow:
      2px 2px 0 rgba(0, 0, 0, 0.7),
      0 4px 12px rgba(0, 0, 0, 0.4);
    letter-spacing: -0.02em;
  }

  .message {
    font-family: var(--font-secondary);
    font-size: clamp(0.8rem, 1.8vw, 1rem);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-secondary);
    opacity: 0.35;
    margin: 0.75rem 0 0;
  }

  .back {
    margin-top: 2rem;
    font-family: var(--font-secondary);
    font-size: clamp(0.7rem, 1.4vw, 0.85rem);
    font-weight: 700;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--color-secondary);
    text-decoration: none;
    opacity: 0.45;
    transition: opacity 0.2s ease, color 0.2s ease;
    border-bottom: 1px solid rgba(223, 225, 215, 0.2);
    padding-bottom: 2px;
  }

  .back:hover {
    opacity: 1;
    color: var(--color-accent);
    border-bottom-color: var(--color-accent);
  }
</style>
