import React, { useState, useEffect } from 'react';
import { View, Text, ToastAndroid, ScrollView, Button } from 'react-native';
import DropdownComponent from '../components/DropdownComponent.native';
import ItemCard from '../components/ItemCard.native';
import { FileSystem } from 'react-native-file-access';
import AsyncStorage from '@react-native-async-storage/async-storage';


async function checkServer(){
    try{
        let url = await AsyncStorage.getItem("address")
        let signature = await AsyncStorage.getItem("signature")
        url = url.substring(1, url.length-1)
        signature = signature.substring(1, signature.length-1)
        let res = await fetch(url);
        if(!res.ok){
            return false
        }
        res = await fetch(url+"/"+signature);
        if(!res.ok){
            return false;
        }
        res = await res.text()
        return res==`ok:${signature}`
    }catch(e){
        console.log("ERROR: ", e)
    }
    return false
}

async function getPathList(setter) {
    try{
        const v = JSON.parse(await AsyncStorage.getItem("folderList"))
        if(v != null){
            setter(v)
            return
        }
    }catch(e){
        console.warn(e)
    }
    setter([])
}

async function getItems(path) {
    try{
        let res = await FileSystem.statDir(path)
        return res.map((v)=>{return {path:v.path, filename:v.filename, type:v.type, status:"TODO"}})
    }catch(e){
        console.warn(e)
    }
    return []
}

export default function Home() {
    const [itemList, setItemList] = useState([]);
    const [pathList, setPathList] = useState([]);
    const [serverStatus, setServerStatus] = useState(false)
    const [currentPath, setCurrentPath] = useState(null);
    const [syncStatus, setSyncStatus] = useState('TODO....');
    
    useEffect(()=>{
        ToastAndroid.show(serverStatus ? "Server connected" : "The server is not connected", ToastAndroid.SHORT)
        if(serverStatus){
            getSyncStatus()
        }
    }, [serverStatus])

    useEffect(() => {
        init()
    }, [])

    async function init(){
        getPathList(setPathList)
        setServerStatus(await checkServer());
    }

    // -1: no files to check
    // 0: server out of sync
    // 1: server in sync
    async function getSyncStatus() {
        if(currentPath == null){
            return -1;
        }
        

    }

    async function updateItems(){
        if(currentPath != null && currentPath["depth"] != null && currentPath["path"] !=null){
            let newitems = await getItems(currentPath['path']);
            const backItem={path:currentPath['path'].split("/").slice(0,-1).join('/'), filename:"..", type:"directory", status:"TODO"}
            let finalList = (currentPath['depth']>0 ? [backItem]:[]);
            if(newitems.length > 0){
                setItemList([...finalList, ...newitems])
            }else{
                setItemList(finalList)
            }
        }
    }


    useEffect(()=>{
        updateItems()
    }, [currentPath])

    return (
        <ScrollView style={{
            margin: 20,
        }}>
            <DropdownComponent 
                data={pathList.map(p=>{return {label:p,value:p}})} 
                setCurrentPath={(p)=>{
                    setCurrentPath({depth:0, path:p})
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
                        onPress={async()=>{
                            if(!serverStatus){
                                ToastAndroid.show("The server is not connected", ToastAndroid.SHORT)
                                return
                            }
                            let s = await getSyncStatus()
                            if(!s){
                                ToastAndroid.show("The server is out of sync, syncing...", ToastAndroid.SHORT)
                            }
                        }}
                    />
                </View>
                <View style={{ flex: 1, marginleft: 10 }}>
                    <Button
                        title="check server"
                        color="#841584"
                        accessibilityLabel="Check the current folder status"
                        onPress={async()=>{
                            let s = await checkServer();
                            if(s == serverStatus){
                                ToastAndroid.show(s ? "Server connected" : "The server is not connected", ToastAndroid.SHORT)
                            }
                            setServerStatus(s)
                        }}
                    />
                </View>
            </View>
            <Text style={{ marginTop: 10, fontSize: 20, textAlign: 'center' }}>Status: {syncStatus}</Text>
            <ScrollView style={{
                marginTop: 10
            }}>
                {
                    itemList.reduce(
                        (myarray, newvalue, index) => {
                            if (index % 2 == 0) {
                                myarray.push([newvalue])
                            } else {
                                myarray[myarray.length - 1].push(newvalue)
                            }
                            return myarray
                        },
                        []
                    ).map(i =>
                        <View style={{ flexDirection: 'row', justifyContent: 'center' }} key={i[0].path}>
                            <ItemCard
                                item={i[0]}
                                setCurrent={(v)=>{
                                    setCurrentPath(c=>{
                                        return {
                                            depth: c["depth"] + (v.filename==".."?-1:+1),
                                            path:v.path
                                        }
                                    })
                                }}
                            />
                            {
                                i[1] ?
                                    <ItemCard
                                        item={i[1]}
                                        setCurrent={(v)=>{
                                            setCurrentPath(c=>{
                                                return {
                                                    depth: c["depth"] + 1,
                                                    path:v
                                                }
                                            })
                                        }}
                                    /> : <></>
                            }
                        </View>
                    )
                }
            </ScrollView>

        </ScrollView>
    )
}