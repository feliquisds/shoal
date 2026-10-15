let discordToken = null;
let abortController = null;

let home = document.getElementById('home');
let friendRequest = document.getElementById('friendRequest');
let settings = document.getElementById('settings');
let friendCodeInput = document.getElementById('friendCodeInput');

window.addEventListener('DOMContentLoaded', () => {
    home = document.getElementById('home');
    friendRequest = document.getElementById('friendRequest');
    settings = document.getElementById('settings');
    friendCodeInput = document.getElementById('friendCodeInput');

    const params = new URLSearchParams(window.location.search);

    const nintendoName = params.get('nintendoName');
    const nintendoImageUri = params.get('nintendoImageUri');

    const discordTransientToken = params.get('discordTransientToken');
    const discordName = params.get('discordName');
    const discordImageUri = params.get('discordImageUri');

    const presenceAccountName = params.get('presenceAccountName');
    const presenceAccountImageUri = params.get('presenceAccountImageUri');

    const presenceEnabled = params.get('presenceEnabled') === 'true';
    const showPlayTime = params.get('showPlayTime') === 'true';

    const error = params.get('error');

    if (error) {
        console.error(`Error: ${error}`);
        return;
    }

    if (!discordTransientToken) {
        return;
    }

    discordToken = discordTransientToken;
    window.history.replaceState({}, document.title, window.location.pathname);

    document.querySelectorAll('.discordName').forEach(el => el.innerText = discordName);
    document.querySelectorAll('.discordImageUri').forEach(el => el.src = discordImageUri);

    document.getElementById('presenceToggle').checked = presenceEnabled;
    document.getElementById('playTimeToggle').checked = showPlayTime;

    document.querySelectorAll('.presenceAccountName').forEach(el => el.innerText = presenceAccountName);
    document.querySelectorAll('.presenceAccountImageUri').forEach(el => el.src = presenceAccountImageUri);

    home.hidden = true;

    if (nintendoName && nintendoImageUri) {
        document.querySelectorAll('.nintendoName').forEach(el => el.innerText = nintendoName);
        document.querySelectorAll('.nintendoImageUri').forEach(el => el.src = nintendoImageUri);
        friendRequest.hidden = true;
        settings.hidden = false;
        return;
    }

    settings.hidden = true;
    friendRequest.hidden = false;
});

friendCodeInput.addEventListener('input', (e) => {
    friendCodeInput.classList.remove('error');

    let value = e.target.value.replace(/\D/g, '');
    let formattedValue = '';

    if (value.length > 0)
        formattedValue += value.substring(0, 4);
    if (value.length > 4)
        formattedValue += '-' + value.substring(4, 8);
    if (value.length > 8)
        formattedValue += '-' + value.substring(8, 12);

    e.target.value = formattedValue;
});

async function confirmFriendCode() {
    const friendCode = friendCodeInput.value.trim();

    if (!friendCode) {
        friendCodeInput.classList.add('error');
        return;
    }

    try {
        const response = await fetch('/nintendo/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${discordToken}`
            },
            body: JSON.stringify({ friendCode })
        });

        const data = await response.json();

        if (!response.ok) {
            friendCodeInput.classList.add('error');
            console.error(`Error while confirming friend code: ${data.error}`);
            return;
        }

        const nintendoName = data.nintendoName;
        const nintendoImageUri = data.nintendoImageUri;
        const presenceEnabled = data.presenceEnabled;
        const showPlayTime = data.showPlayTime;

        document.querySelectorAll('.nintendoName').forEach(el => el.innerText = nintendoName);
        document.querySelectorAll('.nintendoImageUri').forEach(el => el.src = nintendoImageUri);
        document.getElementById('presenceToggle').checked = presenceEnabled;
        document.getElementById('playTimeToggle').checked = showPlayTime;
        home.hidden = true;
        friendRequest.hidden = true;
        settings.hidden = false;
    } catch (error) {
        console.error(`Error while confirming friend code: ${error.message}`);
    }
}

async function updateSettings() {
    if (abortController)
        abortController.abort();

    abortController = new AbortController();
    const signal = abortController.signal;

    await new Promise(r => setTimeout(r, 1000));

    const isPresenceActive = document.getElementById('presenceToggle').checked;
    const showHoursPlayed = document.getElementById('playTimeToggle').checked;

    try {
        const response = await fetch('/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${discordToken}`
            },
            body: JSON.stringify({ isPresenceActive, showHoursPlayed }),
            signal: signal
        }).catch(error => {
            if (error.name === 'AbortError') {
                console.log('Request aborted');
            }
        });

        if (!response.ok) {
            console.error(`Error while updating settings: ${response.statusText}`);
        }
    } catch (error) {
        console.error(`Error while updating settings: ${error.message}`);
    } finally {
        abortController = null;
    }
}

function changeNintendoAccount() {
    home.hidden = true;
    settings.hidden = true;
    friendRequest.hidden = false;
}

async function deleteAccount() {
    try {
        const response = await fetch('/delete', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${discordToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error while deleting account: ${response.statusText}`);
        }

        settings.hidden = true;
        friendRequest.hidden = true;
        home.hidden = false;
    } catch (error) {
        console.error(`Error while deleting account: ${error.message}`);
    }
}