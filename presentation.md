---
marp: true
theme: uncover
class: 
    - invert
---
<style>
    p {
        text-align: center
    }
    h1 {
        
        margin: 0;
        padding: 0;
    }
</style>

![bg](./app/icons/zippiri.png)

--- 

# Zippiri
Un'applicazione di backup Android progettata per semplificare il processo di protezione dei dati. Offre diverse opzioni di backup e compressione per adattarsi alle esigenze degli utenti.

--- 
![bg left:30% h:600px](images/home_nav.jpg)
## Caratteristiche Chiave

- Backup Differenziale, Incrementale e Completo.
- Compressione Zip, Gzip e Tar.
- Pianificazione automatica.
- Archiviazione su server privato.
- Pulizia della cache.
- Filtro connessione Wi-Fi e dati.
---
## Tipi di backup
![bg left:30% h:550px](images/backup_frequency.jpg)
- Incrementale
- Differenziale
- Completo
---
## Compressione
![bg left:30% h:550px](images/other_settings.jpg)
- Zip
- Gzip
- Tar
---
## Impostazioni server
![bg left:30% h:550px](images/server_settings.jpg)
- Indirizzo
- Signature
- Credenziali (username/password)
---
## Navigazione cartelle
![bg left h:550px](images/home_nav.jpg)
![bg right h:550px](images/home.jpg)

---
## Struttura del progetto

- Views per pagine di settings e homepage.
- Components per elementi UI riutilizzabili.
- Lib per la logica interna dell'app
- Cartella Icons per le icone.
---
## Tecnologie utilizzate

- **React Native**
- **TypeScript**
- **Python**
- **Docker**
---
## Librerie
- **React Native File Access**
- **FontAwesome**
- **React Native WiFi Reborn e NetInfo**
- **React Native Modal**
- **React Native Async Storage**
- **React Native Document Picker**
- **React Native Zip Archive**
- **Base64**
---
# Grazie!