<script>
    export let id = '';
    export let label = '';
    export let value = '';
    export let readonly = false;
    export let error = null;
    export let onInput = () => {};

    function handleInput(event) {
        onInput(event.target.value);
    }
</script>

<div class="flex flex-col gap-2">
    <label for={id}>{label}</label>
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
