<script>
    import {Button, PasswordInput, FormGroup, InlineNotification, ButtonSet} from "carbon-components-svelte";
    import {Login, Logout} from "carbon-icons-svelte";

    let password, success;
    let resData = {};
    const handleLogin = async () => {
        fetch("http://localhost:8112/api/v1/auth/login", {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "password": password
            })
        })
            .then(res => {
                console.log(res);
                res.json().then(json => {
                    resData = json;

                    if (res.status === 200) {
                        localStorage.setItem("token", resData.token);
                        console.log(localStorage.getItem('token'));
                        success = 1;
                    }
                    else {
                        success = -1;
                    }
                })
            })
            .catch(error => {
            console.log(error);
            resData.msg = error;
            success = -1;
        });
    };
</script>

<style>
    .form-container {
        max-width: 400px;
        margin: 0 auto;
    }
</style>

<div class="form-container">
    <h2>Login</h2>
    <form on:submit|preventDefault={handleLogin}>
        <InlineNotification
                lowContrast
                hideCloseButton
                kind="warning"
                title="Hinweis:"
                subtitle="Die Übermittlung des Passworts erfolgt möglicherweise ungesichert!"
        />
        <FormGroup>
            <PasswordInput labelText="Admin-Passwort" placeholder="Admin-Passwort aus .env-Variablen..." bind:value={password}/>
        </FormGroup>
        <ButtonSet>
            <Button type="submit" icon={Login}>Login</Button>
            <Button kind="ghost" icon={Logout}>Logout</Button>
        </ButtonSet>
    </form>
    {#if success === 1}
        <InlineNotification
                lowContrast
                kind="success"
                title={resData.msg}
                subtitle="Die Anwendung kann nun genutzt werden!"
        />
    {:else if success === -1}
        <InlineNotification
                lowContrast
                kind="error"
                title="Fehler:"
                subtitle={resData.msg}
        />
    {/if}
</div>

