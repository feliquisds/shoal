let discordToken = null;
let abortController = null;
let popupAbortController = null;

let home;
let friendRequest;
let settings;
let friendCodeInput;

let popup;

window.addEventListener('DOMContentLoaded', () => {
    home = document.getElementById('home');
    friendRequest = document.getElementById('friendRequest');
    settings = document.getElementById('settings');
    friendCodeInput = document.getElementById('friendCodeInput');
    popup = document.getElementById('popup');

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
        showPopup(error);
        return;
    }

    if (!discordTransientToken) {
        home.hidden = false;
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

        if (response.status === 400 || response.status === 500) {
            friendCodeInput.classList.add('error');
            showPopup(data.error);
            return;
        }

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

        showPopup('Be sure to check your friend requests.', 'Nintendo Account connected', 'success');
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

        if (response.status === 400 || response.status === 500) {
            showPopup(await response.json().error);
            return;
        }

        if (!response.ok) {
            showPopup(`Network error [${response.status}]`);
            console.error(`Network error [${response.status}]: ${response.statusText}`);
            return;
        }

        showPopup(null, 'Changes saved', 'success');
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

        if (response.status === 400 || response.status === 500) {
            showPopup(await response.json().error);
            return;
        }

        if (!response.ok) {
            showPopup(`Network error [${response.status}]`);
            console.error(`Network error [${response.status}]: ${response.statusText}`);
            return;
        }

        settings.hidden = true;
        friendRequest.hidden = true;
        home.hidden = false;
        showPopup(null, 'Account deleted', 'success');
    } catch (error) {
        console.error(`Error while deleting account: ${error.message}`);
    }
}

async function showPopup(message, banner = 'Something went wrong', type = 'critical') {
    if (popupAbortController) {
        popupAbortController.abort();
        popup.classList.add('hide');
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    popupAbortController = new AbortController();
    const signal = popupAbortController.signal;

    let formatMessage = message;

    document.getElementById('popupBannerMessage').innerText = banner;
    document.getElementById('popupIcon').className = `popupIcon ${type}`;

    if (type !== 'success') {
        switch (message) {
            case 'discord_auth_failed':
                formatMessage = 'Authentication with Discord application failed.';
                friendRequest.hidden = true;
                settings.hidden = true;
                home.hidden = false;
                break;
            case 'discord_token_exchange_failed':
                formatMessage = 'Authentication with Discord failed.';
                friendRequest.hidden = true;
                settings.hidden = true;
                home.hidden = false;
                break;
            case 'discord_user_fetch_failed':
                formatMessage = 'Failed to fetch Discord user information.';
                friendRequest.hidden = true;
                settings.hidden = true;
                home.hidden = false;
                break;

            case 'nintendo_invalid_friend_code':
                formatMessage = 'Invalid friend code.';
                break;
            case 'nintendo_user_not_found':
                formatMessage = 'Nintendo user not found. Try a different friend code.';
                break;
            case 'nintendo_friend_request_failed':
                formatMessage = 'Failed to send friend request. Check your account settings on Nintendo Switch.';
                break;

            case 'settings_invalid_request_body':
                formatMessage = 'Invalid request for settings update.';
                break;
            case 'transient_auth_failed':
                formatMessage = 'Authentication failed. Please try again.';
                friendRequest.hidden = true;
                settings.hidden = true;
                home.hidden = false;
                break;
            case 'database_fetch_failed':
                formatMessage = 'Internal database error occurred.';
                break;
            case 'database_user_not_found':
                formatMessage = 'User not registered.';
                break;

            case 'processing_discord_callback_failed':
                formatMessage = 'Internal error while processing Discord callback occurred.';
                friendRequest.hidden = true;
                settings.hidden = true;
                home.hidden = false;
                break;
            case 'processing_nintendo_request_failed':
                formatMessage = 'Internal error while processing Nintendo friend request occurred.';
                break;
            case 'processing_settings_change_failed':
                formatMessage = 'Internal error while processing settings change occurred.';
                break;
            case 'processing_account_deletion_failed':
                formatMessage = 'Internal error while processing account deletion occurred.';
                break;

            default:
                formatMessage = message || 'An unexpected error occurred.';
                break;
        }

        document.getElementById('popupMessage').innerText = formatMessage;
        document.getElementById('popupMessage').hidden = false;
    }

    if (type === 'success' && message) {
        document.getElementById('popupMessage').innerText = message;
        document.getElementById('popupMessage').hidden = false;
    }

    if (type === 'success' && !message) {
        document.getElementById('popupMessage').hidden = true;
    }

    popup.classList.remove('hide');

    try {
        await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                resolve();
            }, 5000);

            signal.addEventListener('abort', () => {
                clearTimeout(timeoutId);
                reject(new DOMException('Overridden by a new popup', 'AbortError'));
            });
        });

        popup.classList.add('hide');
        popupController = null;
    } catch (error) {
        if (error.name === 'AbortError')
            console.log('Previous popup timer was overridden.');
        else
            popup.classList.add('hide');
    }
}