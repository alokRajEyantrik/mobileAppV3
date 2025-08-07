// TextareaField.svelte - A reusable textarea component with TypeScript support
<script lang="ts">
  export let id: string;
  export let label: string;
  export let value: string = '';
  export let error: string | null = null;
  export let rows: number = 4;
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let onInput: (value: string) => void = () => {};

  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    onInput(target.value);
  }
</script>

<div class="mb-4">
  <label for={id} class="block text-sm font-medium text-gray-700 mb-1">
    {label}
    {#if required}<span class="text-red-500">*</span>{/if}
  </label>
  <textarea
    {id}
    bind:value
    {rows}
    {disabled}
    {required}
    on:input={handleInput}
    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    class:error={error}
  ></textarea>
  {#if error}
    <p class="mt-1 text-sm text-red-600">{error}</p>
  {/if}
</div>

<style>
  .error {
    border-color: red;
  }
</style>
