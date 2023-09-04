import React, { useState, useEffect } from 'react';
import { View, Text, ToastAndroid, ScrollView, Button } from 'react-native';
import { FileSystem } from 'react-native-file-access';
import DropdownComponent from '../components/DropdownComponent.native';
import ItemCardList from '../components/ItemCardList.native';
import { getPathList } from '../components/utils';
import BackupLogic from '../components/backup/backup';
import FileHandler from '../components/backup/FileHandler';

async function getItems(path:string) {
    try {
        let res = await FileSystem.statDir(path)
        return res.map((v) => { return { path: v.path, filename: v.filename, type: v.type, status: "TODO" } })
    } catch (e) {
        console.log(e)
    }
    return []
}

interface Item {
    path:string;
    filename:string;
    type:string;
    status:string;
    depth?:number;
}

export default function Home() {
    const BL = new BackupLogic()
    const fh = new FileHandler()
    const [itemList, setItemList] = useState([] as Item[]);
    const [pathList, setPathList] = useState([] as string[]);
    const [cacheLabel, setCacheLabel] = useState("Clear cache")
    const [serverStatus, setServerStatus] = useState(false)
    const [currentPath, setCurrentPath] = useState(null as Item|null);
    const [syncStatus, setSyncStatus] = useState('Checking server connection');

    useEffect(() => {
        init()
    }, [])

    useEffect(() => {
        ToastAndroid.show(serverStatus ? "Server connected" : "The server is not connected", ToastAndroid.SHORT)
        if (serverStatus) {
            getSyncStatus()
        }
    }, [serverStatus])


    useEffect(() => {
        updateItemList()
    }, [currentPath])


    async function init() {
        getPathList(setPathList)
        const srv = await BL.getServerInteractor()
        if(!srv){
            setServerStatus(false);
            setSyncStatus("Unable to connect to server")
            return
        }
        const server = await srv.checkServer()
        if (server) {
            setSyncStatus("Server connected, checking sync")
            setServerStatus(true);
        }
    }

    async function updateItemList() {
        if (currentPath != null && currentPath?.depth != null && currentPath.path != null) {
            let newitems = await getItems(currentPath['path']);
            const backItem = {
                path: currentPath['path'].split("/").slice(0, -1).join('/'),
                filename: "..",
                type: "directory",
                status: "TODO"
            }
            let finalList = (currentPath['depth'] > 0 ? [backItem] : []);
            setItemList([...finalList, ...newitems])
        }
    }

    // -1: no files to check
    // 0: server out of sync
    // 1: server in sync
    async function getSyncStatus() {
        // TODO: IMPLEMENT
        if (currentPath == null) {
            return -1;
        }
        return 0


    }

    async function checkSync() {
        if (!serverStatus) {
            ToastAndroid.show("The server is not connected", ToastAndroid.SHORT)
            return
        }
        let s = await getSyncStatus()
        switch (s) {
            case -1:
                ToastAndroid.show("Folder not selected", ToastAndroid.SHORT)
                break;
            case 0:
                if(!currentPath) return ToastAndroid.show("Folder not selected", ToastAndroid.SHORT)
                ToastAndroid.show("The server is out of sync, syncing...", ToastAndroid.SHORT)
                const res = await BL.upload_full(currentPath.path)
                console.log("Upload was "+(res?"successfull":"BROKEN"))
                break;
            case 1:
                ToastAndroid.show("The server is in sync", ToastAndroid.SHORT)
                break;
        }
    }

    return (
        <ScrollView style={{
            margin: 20,
        }}>
            <DropdownComponent
                data={pathList.map(p => { return { label: decodeURIComponent(p.split("tree/")[1]), value: p } })}
                setCurrentPath={(p:string) => {
                    setCurrentPath({ depth: 0, path: p, filename:"", type:"", status:"" })
                }}
                label="folder"
                icon="folder"
            />
            <View style={{ flex: 1, justifyContent: 'space-evenly', alignItems: 'stretch', flexDirection: 'row', marginTop: 10 }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <Button
                        title="sync"
                        color="#841584"
                        accessibilityLabel="Sync the current folder"
                        onPress={checkSync}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Button
                        title="check server"
                        color="#841584"
                        accessibilityLabel="Check the current folder status"
                        onPress={async () => {
                            const srv = await BL.getServerInteractor()
                            if(!srv){
                                setSyncStatus("Unable to get server informations")
                                return
                            }
                            const s = await srv.checkServer();
                            ToastAndroid.show(s ? "Server connected" : "The server is not connected", ToastAndroid.SHORT)
                            if (s != serverStatus) {
                                setSyncStatus(s ? "Server connected" : "The server is not connected")
                            }
                            setServerStatus(s)
                        }}
                    />
                </View>
            </View>
            <View style={{ flex: 1, marginTop:5 }}>
                    <Button
                        title={cacheLabel}
                        color="#841584"
                        accessibilityLabel={cacheLabel}
                        disabled={cacheLabel=="Clearing..."}
                        onPress={async () => {
                            setCacheLabel("Clearing...")
                            await fh.clearCache()
                            ToastAndroid.show("Cache cleared", ToastAndroid.SHORT)
                            setCacheLabel("Clear cache")
                        }}
                    />
                </View>
            <Text style={{ marginTop: 10, fontSize: 20, textAlign: 'center' }}>{syncStatus}</Text>
            <ItemCardList items={itemList} currentPath={currentPath} setCurrentPath={setCurrentPath} />

        </ScrollView>
    )
}