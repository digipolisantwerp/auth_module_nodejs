export default {
    clientId,
    clientSecret,
    basePath, // default
    defaultScopes,
    scopeGroups,
    sharedSessionsUrl, //nodig voor middleware, url voor consent.
    identifier, // niet meer nodig in v2? wel nodig voor uit te loggen
    saveConsent, // default hier
    oauthHost,
    refresh, // default false
    key, // default user
    errorRedirect, // default /
    authPath, // default hier
    authMethods: { // niet in config
        low: [
            'iam-aprofiel-userpass', 
            'fas-citizen-bmid',
            'fas-citizen-otp',
            'fas-citizen-totp',
            'fas-citizen-eid'
        ].join(','),
        substantial: [
            'fas-citizen-bmid',
            'fas-citizen-otp',
            'fas-citizen-totp',
            'fas-citizen-eid'
        ].join(','),
        high: ['fas-citizen-eid'].join(',')
    },
    logout: {
        headerKey,
        securityHash,
        sessionStoreLogoutAdapter
    },
    hooks: {
        prelogin: [],
        loginSuccess: [],
        logoutSuccess: []
    } // functies
}
// tokenUrl niet meer nodig
// geen redirectUri niet meer
// authenticationType niet nodig voor burger
// tokenUrl?
// migration guide