// CheckboxField.svelte - A reusable checkbox component with TypeScript support
<script lang="ts">
  export let id: string;
  export let label: string;
  export let checked: boolean = false;
  export let error: string | null = null;
  export let disabled: boolean = false;
  export let onChange: (checked: boolean) => void = () => {};

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    onChange(target.checked);
  }
</script>

<div class="mb-4">
  <div class="flex items-center">
    <input
      {id}
      type="checkbox"
      bind:checked
      {disabled}
      on:change={handleChange}
      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
    />
    <label for={id} class="ml-2 block text-sm text-gray-900">
      {label}
    </label>
  </div>
  {#if error}
    <p class="mt-1 text-sm text-red-600">{error}</p>
  {/if}
</div>
