<script>
    import {
        Header,
        HeaderUtilities,
        HeaderGlobalAction,
        SideNav,
        SideNavItems,
        SideNavMenu,
        SideNavMenuItem,
        SideNavLink,
        SkipToContent,
        Content,
        Grid,
        Row,
        Column, HeaderPanelLink, HeaderActionLink, SideNavDivider,
    } from "carbon-components-svelte";
    import {Chemistry, Help, LogoGithub, Settings, TrafficCone} from "carbon-icons-svelte";

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
        <HeaderActionLink aria-label="Settings" icon={Help} href="/help"/>
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
