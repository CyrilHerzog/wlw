/*





*/


let socket;
let isConnected = false;

function connectToServer() {
    socket = new WebSocket('ws://192.168.54.159:8080');

    // Wenn Port geöffnet
    socket.onopen = function() {
        console.log('Connected to server');
        updateConnectionStatus(true, 'connected'); // Verbindungsstatus aktualisieren
        isConnected = true;
    };

    // Wenn eine Nachricht empfangen
    socket.onmessage = function(event) {
        const logMessage = event.data;
    
        // Textnachrichten verarbeiten =>

        // Log-Nachrichten für Uart
        if (selectTextMessage(event.data, 'uart_log')) {
            addTextMessage(event.data, 'com_status_log_id', 'uart_log');
        }

        // Antwort aus Echo Test
        if (selectTextMessage(event.data, 'uart_echo')) {
            addTextMessage(event.data, 'com_test_result_id', 'uart_echo');
        }

        // Antwort generierte Daten
        if (selectTextMessage(event.data, 'gen_data')) {
            addTextMessage(event.data, 'generate_output_id', 'gen_data');
        }

        // Antwort generierte Daten
        if (selectTextMessage(event.data, 'recv_data')) {
            addTextMessage(event.data, 'result_output_id', 'recv_data');
        }








    };

    // Wenn Port geschlossen
    socket.onclose = function(event) {
        console.log('Disconnected from server');
        // Wenn der Verbindungsabbruch ein Fehler war (nicht absichtlich getrennt), wird 'event.wasClean' false sein
        if (!event.wasClean) {
            updateConnectionStatus(false, 'error'); // Hintergrund rot setzen bei Fehler
        } else {
            updateConnectionStatus(false, 'disconnected'); // Hintergrund normal bei absichtlicher Trennung
        }
        isConnected = false;
    };

    // Bei Fehler
    socket.onerror = function(error) {
        console.log('WebSocket error: ' + error.message);
        updateConnectionStatus(false, 'error'); // Hintergrund rot setzen bei Fehler
        isConnected = false;
    };
}

function disconnectFromServer() {
    if (socket) {
        socket.close();
    }
}

// Icon toggeln zum Verbinden, respektive Trennen der Verbindung
function toggleConnection() {
    if (isConnected) {
        disconnectFromServer();
    } else {
        connectToServer();
    }
}

// Funktion zum Aktualisieren des Verbindungsstatus
function updateConnectionStatus(connected, status) {
    const iconContainer = document.getElementById('connection_status_id');
    const icon = document.getElementById('connection_icon_id');

    if (connected) {
        icon.src = 'graphics/ic_connect.png'; // Steckersymbol
        icon.alt = 'Connected';
        iconContainer.classList.remove('disconnected');
        iconContainer.classList.add('connected'); // Hintergrundfarbe auf grün setzen
    } else {
        icon.src = 'graphics/ic_disconnect.png'; // Pfad zum getrennten Symbol
        icon.alt = 'Disconnected';
        iconContainer.classList.remove('connected'); // Hintergrundfarbe entfernen
        if (status === 'error') {
            iconContainer.classList.add('disconnected'); // Hintergrundfarbe auf rot setzen
        } else {
            iconContainer.classList.remove('disconnected'); // Hintergrundfarbe entfernen
        }
    }
}

// Funktion zum Senden einer Nachricht an den Server
function sendMessage(message) { // message = echo, write, start, stop
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(message);
    }
}


// Stelle sicher, dass die Verbindung hergestellt wird, wenn die Seite geladen wird
document.addEventListener('DOMContentLoaded', (event) => {
    updateConnectionStatus(false, 'disconnected'); // Initialen Status auf getrennt setzen
});



// Funktion zum Hinzufügen einer Lognachricht zum Textfeld
function addTextMessage(message, text_id, keyword) {
    const logTextarea = document.getElementById(text_id);
    if (logTextarea) {
        message = message.replace(keyword, '');
        logTextarea.value += message + '\n'; // Füge die Nachricht zum Textfeld hinzu
    } else {
        console.error(`Element with id ${text_id} not found.`);
    }
} 

// Überprüfe, ob die Nachricht das Schlüsselwort enthält
function selectTextMessage(message, keyword) {
    return message.includes(keyword);
}
