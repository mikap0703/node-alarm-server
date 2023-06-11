<script>
    import {Button, Form, FormGroup, InlineNotification, Modal, TextArea} from "carbon-components-svelte";
    import TestServerAnswer from "$lib/TestServerAnswer.svelte";
    let content, open, responsePromise;

    const fetchData = async () => {
        fetch("http://localhost:8113/api/v1/test/dme", {
            method: 'POST',
            headers:{
                "Content-Type": "application/json",
                "authorization": localStorage.getItem("token")
            },
            body: JSON.stringify({
                "content": "content"
            })
        })
            .then(response => {
                console.log(response)
                response.json()
                    .then(json => {
                        console.log("json")
                        return json
                    })
                    .catch(error => console.log(error))
            })
    };
</script>

<div>
    <h2>DME Tester</h2>

    <Form
            on:submit={(e) => {
                e.preventDefault();
                open = true;

                responsePromise = fetchData();
            }}>
        <InlineNotification
                lowContrast
                kind="info"
                title="Hinweis:"
                subtitle="Zum Testen der DME-Anbindung muss diese in den Config Dateien konfiguriert und aktiviert sein."
        />
        <FormGroup>
            <TextArea
                    helperText="Serielle Ausgabe des Funkmeldeempfängers"
                    labelText="DME-Text"
                    placeholder="Text eingeben..."
                    bind:value={content}
            />
        </FormGroup>

        <Button kind="danger" type="submit">"Auslösen"</Button>
    </Form>
    <!--
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
    -->
</div>

