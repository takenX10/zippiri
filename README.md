# Zippiri - Android Folder Backup App
![Zippiri icon](/home/taken/Documents/github/zippiri3/app/icons/android/play_store_512.png)
## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Backup Types](#backup-types)
- [Compression Options](#compression-options)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Welcome to Zippiri, your go-to Android folder backup app! Zippiri is designed to make backing up your important data on your Android device simple and efficient. Whether you want to safeguard your photos, documents, or any other data, Zippiri has got you covered.

Zippiri is all about flexibility and offers a variety of backup types and compression options, ensuring that you can tailor your backup strategy to your specific needs. Whether you want to perform differential backups, incremental backups, or full backups, Zippiri has the features you need to protect your data.

## Features

Zippiri comes packed with powerful features to help you manage your Android folder backups:

- **Backup Types:**
  - Differential Backups
  - Incremental Backups
  - Full Backups

- **Compression Options:**
  - Zip Compression
  - Gzip Compression
  - Tar Compression

- **Easy-to-Use Interface:** Zippiri's user-friendly interface ensures that even beginners can perform backups with ease.

- **Scheduling:** Set up automatic backup schedules to ensure your data is always up-to-date.

- **Customizable Settings:** Tailor your backup settings to meet your specific requirements.

- **Server Storage:** Save all your backups in your private server.

## Installation

### Part 1: server
To install zippiri server you just need to:
1. Clone this repository `git clone https://github.com/takenX10/zippiri.git`
2. Go to `zippiri/server/.env` and configure your environment variables:
    - Set the server username
    - Set the server password
    - Set the server port
    - Zippiri uses a field called `signature` so that the server is harder to detect for web crawlers.
      You can put anything you want there, just remember it is not ensured that this text doesn't get discovered by a potential attacker.
      I suggest generating your signature with the following command: `python3 -c 'import secrets;print(secrets.token_hex(32))'`
3. Execute your docker environment in your server 
    ```sh
    sudo docker build . -t zippiri-server
    sudo docker run zippiri-server
    ```
Now you should be good to go, remember to make your server reachable by your phone (forward ports)

### Part 2: The app
You can build the app yourself with eas locally.
```sh
eas build --profile preview --platform android --local
```
You can also download the latest apk from the latest github release

Now send the apk to your phone and install it.
> Google play is going to warn you because the application doesn't have certificates, just ignore the warning.

The first thing you should do when the application is installed is to go to Settings and configure your app:
1. Configure the server, insert the url, username, password and signature.
2. Select the compression type you want to use
3. Select the frequency at wich you want your backup to get executed automatically
4. You can enable backups without wifi, even though I don't suggest it.
5. You can make a whitelist for wifi SSID, in case your server is local and you don't want to accidentally send data to other servers when you are not connected to the local network.
6. Select all the folders you want to backup (and obviously give the application permissions to access that folder)

Once done, you should be good to go. Remember to SAVE YOUR SETTINGS and TEST THE SERVER CONNECTION.

## Usage

Using Zippiri to backup your Android folders is straightforward:

1. Launch the Zippiri app.
2. Make sure all the settings are configured correctly.
3. The application automatically backups the folder you selected.

You can also start the backups manually, clear the cache in case it gets too big, and navigate through the folders you selected in the settigs.

## Restoring backups

You can use the tool `extractor.py` to extract a backup from everything you saved, it is self explainatory.
```sh
sudo docker container ls
# Find zippiri server container name

sudo docker exec -it <container_hash> python3 extractor.py

```
In case the server gets full with backup, make sure you use `deleter.py` to delete old backups without creating conflicts.

## Backup Types

Zippiri offers three types of backups to suit your needs:

- **Differential Backups:** This option backs up only the files that have changed since the last full backup, saving time and storage space.

- **Incremental Backups:** Incremental backups save changes made since the last incremental backup, creating a series of backup points.

- **Full Backups:** A full backup copies all selected files and folders, providing a complete snapshot of your data.

## Compression Options

Choose from three compression options to optimize your backup process:

- **Zip Compression:** Creates standard zip archives, compatible with a wide range of devices and software.

- **Gzip Compression:** Utilizes the gzip format, offering efficient compression and compatibility.

- **Tar Compression:** Archives files using the tar format, commonly used in Unix-based systems.

## License
Copyright (c) 2023 The Zippiri Authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.