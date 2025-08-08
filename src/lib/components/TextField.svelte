<script>
    export let id = '';
    export let label = '';
    export let description = '';
    export let value = '';
    export let readonly = false;
    export let error = null;
    export let onInput = () => {};

    function handleInput(event) {
        onInput(event.target.value);
    }
</script>

<div class="flex flex-col gap-2">
    <label for={id} class="text-sm font-medium text-gray-700">{label}</label>
    {#if description}
        <p class="text-sm text-gray-500 -mt-1 mb-1">{description}</p>
    {/if}
    <input
        {id}
        type="text"
        class="border border-gray-300 p-2 rounded outline-none"
        {readonly}
        {value}
        on:input={handleInput}
    />
    {#if error}
        <p class="text-red-500 font-bold mt-2">
            {error}
        </p>
    {/if}
</div>
