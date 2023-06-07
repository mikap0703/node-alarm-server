<script>
    import { Tabs, Tab, TabContent } from "carbon-components-svelte";
    import MailTest from "./MailTest.svelte";
    import DmeTest from './DmeTest.svelte';
    import ConfigTest from "./ConfigTest.svelte";
</script>

<div>
    <h1>Tester</h1>

    <Tabs>
        <Tab label="Mail" />
        <Tab label="DME" />
        <Tab label="API" />
        <Tab label="Config" />
        <svelte:fragment slot="content">
            <TabContent>
                <MailTest></MailTest>
            </TabContent>
            <TabContent>
                <DmeTest></DmeTest>
            </TabContent>
            <TabContent>
                <ConfigTest></ConfigTest>
            </TabContent>
        </svelte:fragment>
    </Tabs>
</div>
