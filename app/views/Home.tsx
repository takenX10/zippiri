import React, { useState, useEffect } from 'react';
import { View, Text, ToastAndroid, Button, PermissionsAndroid } from 'react-native';
import { FileSystem } from 'react-native-file-access';
import Modal from "react-native-modal";
import WifiManager from "react-native-wifi-reborn";
import NetInfo from "@react-native-community/netinfo";
import DropdownComponent from '../components/DropdownComponent.native';
import ItemCardList from '../components/ItemCardList.native';
import { backgroundBackupCheck, getPathList, getStorage } from '../lib/utils';
import BackupLogic from '../lib/BackupLogic';
import FileHandler from '../lib/FileHandler';
import { useIsFocused } from '@react-navigation/native';
import { CardItem, InternetStatus } from '../lib/types';
import { FrequencyKey } from '../lib/constants';

export default function Home() {
    let firstLabelChange = false;
    let secondLabelChange = false;
    const defaultBackupLabel = "Backup"
    const loadingBackupLabel = "Backing up..."
    const BL = new BackupLogic()
    const fh = new FileHandler()
    const isFocused = useIsFocused()
    const [isModalVisible, setModalVisible] = useState(false);
    const [backupLabel, setBackupLabel] = useState(defaultBackupLabel)
    const [itemList, setItemList] = useState([] as CardItem[]);
    const [pathList, setPathList] = useState([] as string[]);
    const [cacheLabel, setCacheLabel] = useState("Clear cache (0B)")
    const [currentPath, setCurrentPath] = useState(null as CardItem | null);
    const [syncStatus, setSyncStatus] = useState('Loading current app state');


    useEffect(() => { init(); backgroundBackupCheck() }, [])
    useEffect(() => { if (currentPath) { updateItemList() }; if (isFocused) { init() } }, [isFocused])
    useEffect(() => { updateItemList(); if (currentPath && currentPath.filename == "") { init() } }, [currentPath])

    async function syncFolder(dest: FrequencyKey) {
        try {
            if (!currentPath) throw new Error("Select a folder")
            if (!await checkServer()) throw new Error("Server not connected")
            setBackupLabel((_) => {
                if (secondLabelChange) {
                    secondLabelChange = false;
                } else {
                    firstLabelChange = true;
                    return loadingBackupLabel
                }
                return defaultBackupLabel
            })
            if (!await BL.startBackup(currentPath.basepath, dest)) throw new Error("Something went wrong...")
            await init()
            setBackupLabel((_) => {
                if (firstLabelChange) {
                    firstLabelChange = false;
                } else {
                    secondLabelChange = true;
                }
                return defaultBackupLabel
            })
        } catch (err) {
            console.log(err)
            if (err instanceof Error) {
                ToastAndroid.show(err.message, ToastAndroid.SHORT)
            }
        }
    }

    async function checkServer(): Promise<boolean> {
        const srv = await BL.getServerInteractor()
        if (!srv) return false
        return await srv.checkServer();
    }

    async function checkSync() {
        if (!currentPath) throw new Error("Folder not selected")
        if (!await checkServer()) throw new Error("The server is not connected")
        const status = await BL.getSyncStatus(currentPath.basepath)
        return status.differential || status.full || status.incremental
    }

    async function clearCache() {
        await fh.clearCache()
        ToastAndroid.show("Cache cleared", ToastAndroid.SHORT)
        setCacheLabel(`Clear cache (${await fh.getCacheSize()})`)
    }

    async function checkInternet(): Promise<InternetStatus> {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: 'Location permission is required for WiFi connections',
                message:
                    'This app needs location permission as this is required  ' +
                    'to scan for wifi networks.',
                buttonNegative: 'DENY',
                buttonPositive: 'ALLOW',
            },
        );
        if (!granted) return { success: false, message: "Network permissions not granted" }
        const netstate = await NetInfo.fetch()
        const wifi = await getStorage("wifi", false);
        const wifissid = await getStorage("wifissid", "");
        const phonedata = await getStorage("phonedata", false);
        if (phonedata) return { success: true, message: "" }
        if (netstate.type != "wifi" || !netstate.isConnected || !netstate.isWifiEnabled) {
            return { success: false, message: "Connect to wifi before backing up" }
        }
        if (wifi) {
            let ssid = "";
            try {
                ssid = await WifiManager.getCurrentWifiSSID()
            } catch (err) {
                return { success: false, message: "Enable position in settings" }
            }
            if (ssid != wifissid) {
                return { success: false, message: "Connect to the correct wifi" }
            }
        }
        return { success: true, message: "" }
    }

    async function init() {
        try {
            setCacheLabel(`Clear cache (${await fh.getCacheSize()})`)
            getPathList(setPathList)
            const res = await checkInternet()
            if (!res.success) throw new Error(res.message)
            if (!currentPath) throw new Error("Select a folder")
            if (!await checkServer()) throw new Error("Server is not connected")
            if (!await checkSync()) throw new Error("Backups are not updated")
            setSyncStatus("Everything is up to date")
            ToastAndroid.show("Everything is up to date", ToastAndroid.SHORT)
        } catch (err) {
            console.log(err)
            if (err instanceof Error) {
                ToastAndroid.show(err.message, ToastAndroid.SHORT)
                setSyncStatus(err.message)
            }
        }
    }

    async function updateItemList() {
        if (
            !currentPath ||
            !await FileSystem.exists(currentPath.currentpath) ||
            !await FileSystem.isDir(currentPath.currentpath)) {
            return setItemList([])
        }
        const newitems = (await FileSystem.statDir(currentPath.currentpath)).map((f): CardItem => {
            return {
                basepath: currentPath.basepath,
                currentpath: f.path,
                filename: f.filename,
                type: f.type,
                depth: currentPath.depth + 1,
            }
        });
        const backItem: CardItem = {
            basepath: currentPath.basepath,
            currentpath: currentPath.currentpath.split("/").slice(0, -1).join('/'),
            filename: "..",
            type: "directory",
            depth: currentPath.depth - 1
        }
        const finalList = (currentPath.depth > 0 ? [backItem] : []) as CardItem[];
        setItemList([...finalList, ...newitems])
    }

    return (

        <View style={{height:'100%'}}>
            <Modal
                isVisible={isModalVisible}
                animationIn="fadeInRight"
                animationOut="fadeOutRight"
            >
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: '70%', padding: 20 }}>
                        {
                            Object.entries(FrequencyKey).map(([_, v]) =>
                                <View style={{ margin: 25 }} key={v}>
                                    <Button
                                        title={v}
                                        onPress={() => {
                                            setModalVisible(false)
                                            syncFolder(v)
                                        }}
                                    />
                                </View>
                            )
                        }
                        <View style={{ margin: 25 }}>
                            <Button
                                title="Close"
                                color="#FF0000"
                                onPress={() => {
                                    setModalVisible(false);
                                }}
                            />
                        </View>

                    </View>
                </View>
            </Modal>
            <View style={{margin:15, height:'100%'}}>
                <DropdownComponent
                    data={pathList.map(p => { return { label: decodeURIComponent(p.split("tree/")[1]), value: p } })}
                    defaultValue={currentPath && currentPath.currentpath ? currentPath.currentpath : ""}
                    setCurrentPath={(p: string) => {
                        setCurrentPath({ depth: 0, basepath: p, currentpath: p, filename: "", type: "" })
                    }}
                    label="folder"
                    icon="folder"
                />
                <View style={{
                    marginTop: 10,
                    flexDirection:'row',
                }}>
                    <View style={{ flex:1, marginRight:5}}>
                        <Button
                            title={backupLabel}
                            disabled={backupLabel != defaultBackupLabel}
                            color="#841584"
                            accessibilityLabel="Backup the current folder"
                            onPress={() => { setModalVisible(true) }}
                        />
                    </View>
                    <View style={{flex:1, marginLeft:5}}>
                        <Button
                            title="Check status"
                            color="#841584"
                            accessibilityLabel="Check the current folder status"
                            onPress={init}
                        />
                    </View>
                </View>
                <View style={{marginTop: 5 }}>
                    <Button
                        title={cacheLabel}
                        color="#841584"
                        accessibilityLabel={cacheLabel}
                        onPress={clearCache}
                    />
                </View>
                <Text style={{ marginTop: 10, fontSize: 20, textAlign: 'center' }}>{syncStatus}</Text>
                <View style={{flex:1, marginBottom:20}}>
                    <ItemCardList items={itemList} currentPath={currentPath} setCurrentPath={setCurrentPath} />
                </View>
            </View>
        </View>
    )
}