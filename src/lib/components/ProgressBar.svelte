<script lang="ts">
  export let currentStep: number = 0;  // Zero-based index
  export let totalSteps: number = 10;   // Must be at least 1

  $: progress = Math.min((currentStep / (totalSteps - 1)) * 100, 100);
</script>

<div class="flex items-center justify-between gap-4">
  <!-- Progress Bar -->
  <div class="relative h-2 bg-gray-200 rounded flex-grow">
    <div
      class="absolute top-0 left-0 h-2 bg-[#ffcc00] rounded transition-all duration-300"
      style="width: {progress}%"
    ></div>
  </div>

  <!-- Index Indicator -->
  <div class="text-sm text-gray-600 min-w-max pl-2">
    <p>{currentStep + 1} / {totalSteps}</p>
  </div>
</div>
