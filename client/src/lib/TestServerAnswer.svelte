<script>
    import {CodeSnippet, Modal} from "carbon-components-svelte";

    export let promise;
</script>

{#await promise}
    <CodeSnippet type="multi" skeleton />
{:then number}
    <CodeSnippet type="multi" {promise} />
{:catch error}
    <p style="color: red">{error.message}</p>
{/await}