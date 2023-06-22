echo "Starte den Monitoring Dienst"

while true; do
    # Starte die Node.js-Anwendung
    node dmx_api.js
    
    # Überprüfe den Exit-Code
    exit_code=$?
    echo "$exit_code"    
    # Überprüfe den Exit-Code 1
    if [ $exit_code -eq 1 ]; then
        echo "Exit-Code 1 erkannt. Lade neue Version des Node-Servers herunter..."
        
        # Versuche, die neue Version des Node-Servers per Wget herunterzuladen
        wget -q --no-check-certificate --no-cache --no-cookies "https://raw.githubusercontent.com/jannikhst/pastebin/main/dmx_api.js" -O dmx_api.js
        
        # Überprüfe den Rückgabewert von wget
        if [ $? -ne 0 ]; then
            echo "Fehler beim Herunterladen der neuen Version. Verwende die alte Datei weiterhin."
        fi
    else
        echo "Neustart der Node.js-Anwendung..."
	sleep 1
    fi
done