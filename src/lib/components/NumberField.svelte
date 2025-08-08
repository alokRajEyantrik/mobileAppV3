<script lang="ts">
  export let id: string;
  export let label: string;
  export let value: number | null = null;
  export let error: string | null = null;
  export let min: number | undefined = undefined;
  export let max: number | undefined = undefined;
  export let step: number | 'any' = 1;
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let onInput: (value: number | null) => void = () => {};

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    onInput(target.value ? parseFloat(target.value) : null);
  }
</script>

<div class="mb-4">
  <label for={id} class="block text-sm font-medium text-gray-700 mb-1">
    {label}
    {#if required}<span class="text-red-500">*</span>{/if}
  </label>
  <input
    {id}
    type="number"
    bind:value
    {min}
    {max}
    {step}
    {disabled}
    {required}
    on:input={handleInput}
    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    class:error={error}
  />
  {#if error}
    <p class="mt-1 text-sm text-red-600">{error}</p>
  {/if}
</div>

<style>
  .error {
    border-color: red;
  }
</style>
