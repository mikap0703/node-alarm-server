<script>
    import {
        Header,
        HeaderUtilities,
        SideNav,
        SideNavItems,
        SideNavLink,
        SkipToContent,
        Content,
        Grid,
        Row,
        Column,
        HeaderActionLink,
        SideNavDivider
    } from "carbon-components-svelte";
    import {Chemistry, Help, LogoGithub, Settings, TrafficCone, User} from "carbon-icons-svelte";

    let isSideNavOpen = false;
</script>
<Header
        persistentHamburgerMenu={true}
        company="node-alarm-server"
        bind:isSideNavOpen
>
    <svelte:fragment slot="skip-to-content">
        <SkipToContent />
    </svelte:fragment>
    <HeaderUtilities>
        <HeaderActionLink aria-label="Hilfe" icon={Help} href="/help"/>
        <HeaderActionLink aria-label="Anmelden" icon={User} href="/login"/>
    </HeaderUtilities>

    <SideNav bind:isOpen={isSideNavOpen} rail>
        <SideNavItems>
            <SideNavLink text="Übersicht" href="/" icon={TrafficCone}/>
            <SideNavLink text="Tester" href="/test" icon={Chemistry} />
            <SideNavLink text="Einstellungen" href="settings" icon={Settings}/>
            <SideNavDivider />
            <SideNavLink icon={LogoGithub} text="GitHub" href="https://github.com/mikap0703/node-alarm-server" target="_blank" />
        </SideNavItems>
    </SideNav>
</Header>

<Content>
    <Grid>
        <Row>
            <Column>
                <slot />
            </Column>
        </Row>
    </Grid>
</Content>
