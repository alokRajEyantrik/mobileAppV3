<script lang="ts">
  interface Option {
    label: string;
    value: string | number;
  }

  export let id: string;
  export let label: string;
  export let options: Option[] = [];
  export let selectedValues: (string | number)[] = [];
  export let error: string | null = null;
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let onChange: (values: (string | number)[]) => void = () => {};

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(target.selectedOptions).map(opt => opt.value);
    selectedValues = selectedOptions;
    onChange(selectedValues);
  }
</script>

<div class="mb-4">
  <label for={id} class="block text-sm font-medium text-gray-700 mb-1">
    {label}
    {#if required}<span class="text-red-500">*</span>{/if}
  </label>
  <select
    {id}
    multiple
    {disabled}
    {required}
    on:change={handleChange}
    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    class:error={error}
    size={Math.min(options.length, 5)} 
  >
    {#each options as option}
      <option value={option.value} selected={selectedValues.includes(option.value)}>
        {option.label}
      </option>
    {/each}
  </select>
  {#if error}
    <p class="mt-1 text-sm text-red-600">{error}</p>
  {/if}
</div>

<style>
  .error {
    border-color: red;
  }
</style>
