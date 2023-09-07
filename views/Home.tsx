import React, { useState, useEffect } from 'react';
import { View, Text, ToastAndroid, ScrollView, Button } from 'react-native';
import { FileSystem } from 'react-native-file-access';
import DropdownComponent from '../components/DropdownComponent.native';
import ItemCardList from '../components/ItemCardList.native';
import { CardItem, getPathList } from '../components/utils';
import BackupLogic from '../components/backup/backup';
import FileHandler from '../components/backup/FileHandler';
import { useIsFocused } from '@react-navigation/native';

export default function Home() {
    const BL = new BackupLogic()
    const fh = new FileHandler()
    const isFocused = useIsFocused()
    const [itemList, setItemList] = useState([] as CardItem[]);
    const [pathList, setPathList] = useState([] as string[]);
    const [cacheLabel, setCacheLabel] = useState("Clear cache (0B)")
    const [currentPath, setCurrentPath] = useState(null as CardItem | null);
    const [syncStatus, setSyncStatus] = useState('Loading current app state');

    useEffect(() => {init()}, [])
    useEffect(() => {if (isFocused) init()}, [isFocused])
    useEffect(() => {updateItemList(); if(currentPath && currentPath.filename=="") init()}, [currentPath])

    async function syncFolder() {
        try{
            if(!currentPath) throw new Error("Select a folder")
            if(!await checkServer()) throw new Error("Server not connected")
            if(await checkSync()) throw new Error("Server already in sync")
            if(!await BL.startBackup(currentPath.basepath, "", "full")) throw new Error("Something went wrong...")
            init()
        }catch(err){
            console.log(err)
            if(err instanceof Error){
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

    async function clearCache(){
        await fh.clearCache()
        ToastAndroid.show("Cache cleared", ToastAndroid.SHORT)
        setCacheLabel(`Clear cache (${await fh.getCacheSize()})`)
    }


    async function init() {
        try{
            setCacheLabel(`Clear cache (${await fh.getCacheSize()})`)
            getPathList(setPathList)
            if(!currentPath) throw new Error("Select a folder")
            if(!await checkServer()) throw new Error("Server is not connected")
            if(!await checkSync()) throw new Error("Backups are not updated")
            setSyncStatus("Everything is up to date")
            ToastAndroid.show("Everything is up to date", ToastAndroid.SHORT)
        }catch(err){
            console.log(err)
            if(err instanceof Error){
                ToastAndroid.show(err.message, ToastAndroid.SHORT)
                setSyncStatus(err.message)
            }
        }
    }

    async function updateItemList() {
        if(
            !currentPath ||
            !await FileSystem.exists(currentPath.currentpath) || 
            !await FileSystem.isDir(currentPath.currentpath)){
                return setItemList([])
        }
        const newitems = (await FileSystem.statDir(currentPath.currentpath)).map((f):CardItem=>{
            return {
                basepath: currentPath.basepath,
                currentpath: f.path,
                filename: f.filename,
                type: f.type,
                depth: currentPath.depth+1,
            }
        });
        const backItem:CardItem = {
            basepath: currentPath.basepath,
            currentpath: currentPath.currentpath.split("/").slice(0, -1).join('/'),
            filename: "..",
            type: "directory",
            depth: currentPath.depth-1
        }
        const finalList = (currentPath.depth > 0 ? [backItem] : []) as CardItem[];
        setItemList([...finalList, ...newitems])
    }

    return (
        <ScrollView style={{
            margin: 20,
        }}>
            <DropdownComponent
                data={pathList.map(p => { return { label: decodeURIComponent(p.split("tree/")[1]), value: p } })}
                setCurrentPath={(p: string) => {
                    setCurrentPath({ depth: 0, basepath: p, currentpath:p, filename: "", type: "" })
                }}
                label="folder"
                icon="folder"
            />
            <View style={{ flex: 1, justifyContent: 'space-evenly', alignItems: 'stretch', flexDirection: 'row', marginTop: 10 }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <Button
                        title="Backup"
                        color="#841584"
                        accessibilityLabel="Backup the current folder"
                        onPress={syncFolder}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Button
                        title="Check status"
                        color="#841584"
                        accessibilityLabel="Check the current folder status"
                        onPress={init}
                    />
                </View>
            </View>
            <View style={{ flex: 1, marginTop: 5 }}>
                <Button
                    title={cacheLabel}
                    color="#841584"
                    accessibilityLabel={cacheLabel}
                    onPress={clearCache}
                />
            </View>
            <Text style={{ marginTop: 10, fontSize: 20, textAlign: 'center' }}>{syncStatus}</Text>
            <ItemCardList items={itemList} currentPath={currentPath} setCurrentPath={setCurrentPath} />

        </ScrollView>
    )
}