<script lang="ts">
  export let id: string;
  export let label: string;
  export let value: string = '';
  export let error: string | null = null;
  export let min: string | undefined = undefined;
  export let max: string | undefined = undefined;
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let onChange: (value: string) => void = () => {};

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    onChange(target.value);
  }
</script>

<div class="mb-4">
  <label for={id} class="block text-sm font-medium text-gray-700 mb-1">
    {label}
    {#if required}<span class="text-red-500">*</span>{/if}
  </label>
  <input
    {id}
    type="date"
    bind:value
    {min}
    {max}
    {disabled}
    {required}
    on:change={handleChange}
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
