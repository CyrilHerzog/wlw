/*
    Autor   : Herzog Cyril
    Version : 1.0
    Datum   : 09.06.24


*/

const WebSocket = require('ws');
const SerialPort = require('serialport').SerialPort;
const { ReadlineParser: Readline } = require('@serialport/parser-readline');
const { randomBytes } = require('crypto');

// Konfiguriere die UART-Verbindung
const port = new SerialPort({
    path: '/dev/ttyUSB0',
    baudRate: 115200,
    dataBits: 8,
    parity: 'odd',
    stopBits: 1,
    flowControl: false
});

const parser = port.pipe(new Readline({ delimiter: '\n' }));

// Befehlsdefinitionen
const START_LOOP_CMD = 0b10000011;
const STOP_LOOP_CMD  = 0b01000011;
const GET_ECHO_CMD   = 0b11000011;
const SET_DELAY_CMD  = 0b00100011;
const WRITE_DEST_CMD = 0b10100011;
const READ_SRC_CMD   = 0b01100011;
const READ_CYCLE_CMD = 0b11100011;
const DUMMY          = 0b00000000;


// Funktion zum Generieren eines zufälligen Bytes
const generateRandomByte = () => randomBytes(1)[0];

// Initialisiere den WebSocket-Server
const server = new WebSocket.Server({ port: 8080 });


// Funktion zum Aktualisieren des Logs und Senden der Benachrichtigung an den Client
function updateLogAndNotify(socket, event, keyword) {
    const now = new Date();
    const time = now.toLocaleTimeString(); // Aktuelle Uhrzeit als String
    const logEntry = `${keyword} ${time}: ${event}`; // Schlüsselwort hinzugefügt

    // Senden der Lognachricht an den Client
    socket.send(logEntry);
    console.log(logEntry); // Optional: Ausgabe des Logs auf der Serverseite
}

server.on('connection', socket => {
    console.log('Client connected');

    socket.on('message', async message => {
        console.log(`Received message: ${message}`);

        if (message == 'echo') { // Befehl Echo gekommen
            const randomByte = generateRandomByte(); // Zufallsbyte erzeugen
            console.log(`Generated random byte: ${randomByte.toString(16)}`);

            // Sende den Echo-Befehl mit dem zufälligen Byte
            port.write([GET_ECHO_CMD, randomByte]);
            updateLogAndNotify(socket, 'Echo gesendet', 'uart_log');
            
            // Setze ein Timeout für die Antwort
            const timeout = setTimeout(() => {
                updateLogAndNotify(socket, 'Echo Timeout', 'uart_log');
            }, 5000); // Timeout nach 5 Sekunden

            // Warte auf die Antwort
            port.once('data', data => {
                clearTimeout(timeout); // Lösche das Timeout, wenn die Antwort empfangen wird

                const receivedByte = data[0];
                console.log(`Received byte: ${receivedByte.toString(16)}`);

                if (receivedByte === randomByte) {
                    updateLogAndNotify(socket, 'Echo empfangen', 'uart_echo');
                    socket.send('echo successful');
                } else {
                    updateLogAndNotify(socket, 'Echo fehlgeschlagen', 'uart_echo');
                    socket.send('echo failed');
                }
            });
        }

        if (message == 'write') { // Befehl zum Senden von Zufallsbytes gekommen
            const randomBytes = [];
            for (let i = 0; i < 28; i++) {
                randomBytes.push(generateRandomByte()); // Zufallsbyte hinzufügen
            }
            const hexString = randomBytes.map(byte => byte.toString(16)).join(', ');
            console.log(`generated values: ${hexString}`);
            // Sende die Zufallsbytes => 4 * 56bit Simulations Frames
            port.write(Buffer.from([WRITE_DEST_CMD, DUMMY, randomBytes]));
            updateLogAndNotify(socket, 'Zufallsbytes gesendet', 'uart_log');

            // Sende Daten zum Client zurück
            const genMessage = hexString;
            socket.send(genMessage);
            updateLogAndNotify(socket, genMessage, 'gen_data');
        }
        
        if (message == 'start') {
            // Log-Nachricht auf dem Server
            console.log('Start Transceiver Loop');
            // Starten
            port.write(Buffer.from([START_LOOP_CMD, DUMMY]));
            updateLogAndNotify(socket, 'Loop gestartet', 'uart_log');
        }

        if (message == 'stop') {
            // Log-Nachricht auf dem Server
            console.log('Stop Transceiver Loop');
            // Stoppen
            port.write(Buffer.from([STOP_LOOP_CMD, DUMMY]));
            updateLogAndNotify(socket, 'Loop gestoppt', 'uart_log');
        
            // Nach dem Stoppen Daten vom UART lesen
            port.write(Buffer.from([READ_SRC_CMD, DUMMY]));
        
            // Timeout für die Antwort setzen
            const timeout = setTimeout(() => {
                console.log('Timeout beim Lesen vom UART');
                updateLogAndNotify(socket, 'Timeout beim Lesen vom UART', 'uart_log');
                // Parser-Event entfernen, um weitere Daten zu ignorieren
                parser.removeAllListeners('data');
            }, 10000); // Timeout nach 10 Sekunden
        
            // Warten auf Antwort vom UART und Daten an den Client senden
            const receivedBytes = [];
            parser.on('data', data => {
                // Timeout zurücksetzen
                clearTimeout(timeout);
                // Daten empfangen
                receivedBytes.push(...data);
                // Wenn 28 Bytes empfangen wurden
                if (receivedBytes.length >= 28) {
                    // Bytes als Hexadezimalzeichenfolge konvertieren
                    const hexString = receivedBytes.slice(0, 28).map(byte => byte.toString(16)).join(', ');
                    console.log(`Received bytes: ${hexString}`);
                    // Nachricht an den Client senden
                    socket.send(`Empfangene Bytes: ${hexString}`);
                    // Lognachricht auf dem Server aktualisieren
                    updateLogAndNotify(socket, `Empfangene Bytes: ${hexString}`, 'recv_data');
                    // Parser-Event entfernen, um weitere Daten zu ignorieren
                    parser.removeAllListeners('data');
                }
            });
        }

        
    });

    socket.on('close', () => {
        console.log('Client disconnected');
    });
});


console.log('Server running at ws://localhost:8080');
