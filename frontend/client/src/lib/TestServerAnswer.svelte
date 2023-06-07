<script>
    import {CodeSnippet, Modal} from "carbon-components-svelte";

    export let data;
</script>

{#await data}
    <CodeSnippet type="multi" skeleton />
{:then number}
    <h1>{data}</h1>
    <CodeSnippet type="multi" {data} />
{:catch error}
    <p style="color: red">{error.message}</p>
{/await}