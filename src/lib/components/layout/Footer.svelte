<script lang='ts'>
  import type { FooterItem } from '$lib/types'

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
  ]

  const { items = defaultItems } = $props()

  function normalizeValue(value: string | string[]): string[] {
    return Array.isArray(value) ? value : [value]
  }
</script>

<footer class='footer'>
  <div class='footer-grid'>
    {#each items as item, index (index)}
      <div class='footer-cell' class:footer-cell--right={index % 2 === 1}>
        <div class='footer-text-block'>
          <span class='footer-label'>{item.label}&nbsp;</span>

          {#each normalizeValue(item.value) as value, valueIndex}
            <span class='footer-value'>{value}</span>

            {#if valueIndex < normalizeValue(item.value).length - 1}
              <span class='footer-label'>&nbsp;or&nbsp;</span>
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
    padding: 0px 4rem;
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
    font-size: 0.9rem;
    font-weight: 400;
  }

  .footer-value {
    font-size: 1.5rem;
    font-weight: 400;
  }

  @media (max-width: 600px) or (max-height: 900px) {
    .footer-grid {
        grid-template-columns: 1fr;
        gap: 0;
    }

    .footer-cell {
        display: none;
    }

    .footer-cell:nth-child(2) {
        display: flex;
        justify-content: center;
        text-align: center;
        padding: 8px 0;
    }

    .footer-cell:nth-child(2) .footer-text-block {
        justify-content: center;
    }
}

</style>
