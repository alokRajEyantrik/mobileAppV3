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

  function handleOptionClick(optionValue: string | number) {
    const newSelectedValues = selectedValues.includes(optionValue)
      ? selectedValues.filter(value => value !== optionValue)
      : [...selectedValues, optionValue];
    selectedValues = newSelectedValues;
    onChange(newSelectedValues);
  }
</script>

<div class="mb-4">
  <label for={id} class="block text-sm font-medium text-gray-700 mb-1">
    {label}
    {#if required}<span class="text-red-500">*</span>{/if}
  </label>
  <div
    class="w-full border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
    class:error={error}
  >
    {#each options as option}
      <div
        class="p-2 cursor-pointer hover:bg-gray-100"
        class:selected={selectedValues.includes(option.value)}
        on:click={() => !disabled && handleOptionClick(option.value)}
      >
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedValues.includes(option.value)}
            disabled={disabled}
            on:change={() => handleOptionClick(option.value)}
          />
          <span>{option.label}</span>
        </label>
      </div>
    {/each}
  </div>
  {#if error}
    <p class="mt-1 text-sm text-red-600">{error}</p>
  {/if}
</div>

<style>
  .error {
    border-color: red;
  }
  
  .selected {
    background-color: #e5edff;
  }
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }
</style>
