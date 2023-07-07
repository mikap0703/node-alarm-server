<script>
    import { Tabs, Tab, TabContent } from "carbon-components-svelte";
    import { writable } from 'svelte/store';
    import GeneralSettings from "./GeneralSettings.svelte";

    export const configuration = writable(0);
        /*writable({
        "general": {},
        "mail": {},
        "dme": {},
        "alarmTemplates": {}
    });
         */
</script>

<div>
    <h1>Tester</h1>

    <Tabs>
        <Tab label="General" />
        <Tab label="Mail" />
        <Tab label="DME" />
        <Tab label="Alarm-Templates" />
        <svelte:fragment slot="content">
            <TabContent>
                <GeneralSettings></GeneralSettings>
            </TabContent>
            <TabContent>
            </TabContent>
            <TabContent>
            </TabContent>
        </svelte:fragment>
    </Tabs>
</div>