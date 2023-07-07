<script>
    import { configuration } from "./store.js";
    import {onMount} from "svelte";
    import {
        Form,
        FormGroup,
        NumberInput,
        Select,
        SelectItem,
        TextInput,
        Toggle
    } from "carbon-components-svelte";

    onMount(() => {
        configuration.subscribe((value) => {
            console.log(value);
        });
    })
</script>

<div>
    <Form>
        <FormGroup>
            <Select
                    labelText="API"
            >
                <SelectItem value="0" text="Anbieter auswählen" disabled hidden />
                <SelectItem value="Divera"/>
                <SelectItem value="Alamos"/>
                <SelectItem value="Telegram"/>
                <SelectItem value="GroupAlarm"/>
                <SelectItem value="FF-Agent"/>
                <SelectItem value="Smart-DME"/>
            </Select>
        </FormGroup>
        <FormGroup>
            <TextInput
                    helperText="Je nach API auch Access-Key"
                    labelText="API-Key"
                    placeholder="API-Key eingeben..."
            />
        </FormGroup>
        <FormGroup>
            <NumberInput
                    helperText="Die Zeit, die nach dem Start vergeht, bis die Alarmanbindungen gestartet werden"
                    label="Start-Timeout (in ms)"
                    step={100}
                    min={0}
                    value={0}
            />
        </FormGroup>
        <FormGroup>
            <Toggle labelText="Alarm Weiterleitung"/>
        </FormGroup>
        <FormGroup>
            <Toggle labelText="E-Mail Auswertung"/>
        </FormGroup>
        <FormGroup>
            <Toggle labelText="DME Auswertung"/>
        </FormGroup>
    </Form>
</div>