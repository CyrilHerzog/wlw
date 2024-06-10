 /*
    Dateiname : date_time.js
    Autor     : Herzog Cyril

 */
 

// Funktion zum Aktualisieren der Uhrzeit
function updateTime() {
    const timeElement = document.getElementById('current-time');
    const currentTime = new Date().toLocaleTimeString();
    timeElement.textContent = currentTime;
}

// Funktion zum Aktualisieren des Datums
function updateDate() {
    const dateElement = document.getElementById('current-date');
    const currentDate = new Date().toLocaleDateString();
    dateElement.textContent = currentDate;
}

// Aktualisiere Datum und Uhrzeit beim Laden der Seite
window.onload = function() {
    updateDate();
    updateTime();
    // Aktualisieren der Uhrzeit bei jeder Sekunde
    setInterval(updateTime, 1000);
};