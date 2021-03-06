class BaseClient {

    constructor() {
        this.listeners = {};
        this.pendingRequests = [];
    }

    logIn() {
        return Promise.resolve();
    }

    logOut() {
        return Promise.resolve();
    }

    addTorrent(torrent) {
        return Promise.resolve();
    }

    addTorrentUrl(url) {
        return Promise.resolve();
    }

    addHeadersReceivedEventListener(listener) {
        const {hostname} = this.options;

        this.listeners.onHeadersReceived = listener;

        browser.webRequest.onHeadersReceived.addListener(
            this.listeners.onHeadersReceived,
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
            ['responseHeaders']
        );
    }

    addBeforeSendHeadersEventListener(listener) {
        const {hostname} = this.options;

        this.listeners.onBeforeSendHeaders = listener;

        browser.webRequest.onBeforeSendHeaders.addListener(
            this.listeners.onBeforeSendHeaders,
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
            ['blocking', 'requestHeaders']
        );
    }

    addAuthRequiredListener() {
        const {hostname, username, password} = this.options;

        this.listeners.onAuthRequired = (details) => {
            if (this.pendingRequests.indexOf(details.requestId) !== -1)
                return;

            this.pendingRequests.push(details.requestId);

            return {
                authCredentials: {
                    username: username,
                    password: password
                }
            };
        };

        this.listeners.onAuthCompleted = (details) => {
            let index = this.pendingRequests.indexOf(details.requestId);

            if (index > -1)
                this.pendingRequests.splice(index, 1);
        };

        browser.webRequest.onAuthRequired.addListener(
            this.listeners.onAuthRequired,
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
            ['blocking']
        );

        browser.webRequest.onCompleted.addListener(
            this.listeners.onAuthCompleted,
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
        );

        browser.webRequest.onErrorOccurred.addListener(
            this.listeners.onAuthCompleted,
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
        );
    }

    removeEventListeners() {
        if (this.listeners.onHeadersReceived)
            browser.webRequest.onHeadersReceived.removeListener(this.listeners.onHeadersReceived);

        if (this.listeners.onBeforeSendHeaders)
            browser.webRequest.onBeforeSendHeaders.removeListener(this.listeners.onBeforeSendHeaders);

        if (this.listeners.onAuthRequired) {
            browser.webRequest.onAuthRequired.removeListener(this.listeners.onAuthRequired);
            browser.webRequest.onCompleted.removeListener(this.listeners.onAuthCompleted);
            browser.webRequest.onErrorOccurred.removeListener(this.listeners.onAuthCompleted);
        }
    }

}
