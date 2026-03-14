<script lang='ts'>
  import APP_CONFIG from '$lib/config'

  const { onContactOpen }: { onContactOpen: () => void } = $props()
</script>

<button class='footer-block' onclick={onContactOpen} type='button' aria-label='Open contact info'>
  <span class='footer-line'>
    <span class='footer-large'>Insomnia Creative</span>
    <span class='footer-small'>presents</span>
  </span>
  <span class='footer-line'>
    <span class='footer-small'>a</span>
    <span class='footer-large'>Fiecher</span>
    <span class='footer-small'>production</span>
  </span>
  <span class='footer-line'>
    <span class='footer-large'>{APP_CONFIG.author.name}</span>
    <span class='footer-small'> portfolio</span>
  </span>
  <span class='footer-line'>
    <span class='footer-small'>contact via</span>
    <span class='footer-large'>Mail</span>
    <span class='footer-small'>or</span>
    <span class='footer-large'>Telegram</span>
  </span>
  <span class='footer-line'>
    <span class='footer-small'>check out studio's</span>
    <span class='footer-large'>YouTube Channel</span>
  </span>
  <span class='footer-line'>
    <span class='footer-small'>follow author's</span>
    <span class='footer-large'>ArtStation,</span>
    <span class='footer-large'>Telegram Channel</span>
    <span class='footer-small'>&</span>
    <span class='footer-large'>Behance</span>
  </span>
  <span class='footer-sep'>·</span>
  <span class='footer-line'>
    <span class='footer-small'>© {new Date().getFullYear()}</span>
  </span>
</button>

<style>
  .footer-block {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: center;
    gap: 0 0.4rem;
    padding: 0px 0px 20px 00px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: center;
    width: 100%;
    font-family: var(--font-secondary);
    text-transform: uppercase;
    color: var(--color-secondary);
    letter-spacing: 0.02em;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .footer-block:hover {
    opacity: 1;
  }

  .footer-line {
    display: inline-flex;
    align-items: baseline;
    gap: 0.3rem;
    white-space: nowrap;
  }

  .footer-small {
    font-size: clamp(0.75rem, 0.636rem + 0.227vw, 1rem);
    opacity: 0.5;
  }

  .footer-large {
    font-size: clamp(1.0625rem, 0.864rem + 0.398vw, 1.5rem);
    text-shadow:
      1px 1px 0 rgba(0, 0, 0, 0.65),
      0px 2px 3px rgba(0, 0, 0, 0.28);
  }

  .footer-sep {
    font-size: clamp(0.75rem, 0.636rem + 0.227vw, 1rem);
    opacity: 0.25;
    align-self: center;
  }

  @media (max-width: 600px) or (max-height: 900px) {

    .footer-block .footer-line,
  .footer-block .footer-sep {
    display: none;
  }

  .footer-block .footer-line:nth-of-type(1),
  .footer-block .footer-line:nth-of-type(3),
  .footer-block .footer-line:last-of-type {
    display: inline-flex;
  }

  .footer-block .footer-sep:nth-of-type(1),
  .footer-block .footer-sep:nth-of-type(2) {
    display: inline;
  }
  }
</style>
