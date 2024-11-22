document.getElementById('startBots').addEventListener('click', () => {
    const host = document.getElementById('host').value;
    const port = parseInt(document.getElementById('port').value, 10);
    const loginRequired = document.getElementById('loginRequired').checked;
    const messages = document.getElementById('messages').value.split(',');

    window.electronAPI.startBots({ host, port, loginRequired, messages });
});

document.getElementById('stopBots').addEventListener('click', () => {
    window.electronAPI.stopBots();
});

window.electronAPI.onLogMessage((message) => {
    const logElement = document.getElementById('log');
    logElement.innerHTML += message + '<br>';
    logElement.scrollTop = logElement.scrollHeight;
});