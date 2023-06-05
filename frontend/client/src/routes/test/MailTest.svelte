<script>
    import {
        Form,
        FormGroup,
        Button,
        TextArea,
        TextInput, Modal, InlineNotification,
    } from "carbon-components-svelte";
    import TestServerAnswer from "$lib/TestServerAnswer.svelte";

    let sender, subject, content, open, responsePromise;

    const fetchData = async () => {
        const response = await fetch('https://dog.ceo/api/breeds/image/random')
        return response.json()
    }
</script>

<div>
    <h2>Mail Tester</h2>
    <Form
            on:submit={async (e) => {
                e.preventDefault();
                open = true;
                console.log(sender, subject, content);

                responsePromise = fetchData();
        }}>
        <InlineNotification
                lowContrast
                kind="info"
                title="Hinweis:"
                subtitle="Zum Testen der Mail-Anbindung muss diese in den Config Dateien konfiguriert und aktiviert sein."
        />
        <FormGroup>
            <TextInput
                    helperText="Die E-Mail Adresse, von der aus die Alarmierung verschickt wird (z.B. E-Mail Adresse der Leitstelle)"
                    labelText="Absender"
                    placeholder="E-Mail eingeben..."
                    bind:value={sender}
            />
        </FormGroup>
        <FormGroup>
            <TextInput
                    helperText="Betreff, mit dem die Alarmierung verschickt wird"
                    labelText="Betreff"
                    placeholder="Betreff eingeben..."
                    bind:value={subject}
            />
        </FormGroup>
        <FormGroup>
        <TextArea
                helperText="Inhalt der E-Mail (HTML oder Klartext)"
                labelText="Text"
                placeholder="Text eingeben..."
                bind:value={content}
        />
        </FormGroup>

        <Button kind="danger" type="submit">"Absenden"</Button>
    </Form>
    <Modal
            bind:open
            passiveModal
            modalHeading="Server-Antwort"
            on:clos={() => (open = false)}
            on:open
            on:close
            on:submit
    >
        <TestServerAnswer promise={responsePromise}/>
    </Modal>
</div>