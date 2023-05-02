import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Button } from 'react-native';
import DropdownComponent from '../components/DropdownComponent.native';
import ItemCard from '../components/ItemCard.native';
import { FileSystem } from 'react-native-file-access';
import AsyncStorage from '@react-native-async-storage/async-storage';


async function getPathList(setter) {
    try{
        const v = JSON.parse(await AsyncStorage.getItem("folderList"))
        console.log("PATH LIST:", v)
        if(v != null){
            setter(v)
            return
        }
    }catch(e){
        console.warn(e)
    }
    setter([])
}

function getSyncStatus() {
    // TODO: implement
}

async function getItems(path) {
    try{
        console.log("PATH SEARCH: ", path)
        let res = await FileSystem.statDir(path)
        console.log("ITEMS FOUND:", res);
        return res.map((v)=>{return {path:v.path, filename:v.filename, type:v.type, status:"TODO"}})
    }catch(e){
        console.warn(e)
    }
    return []
}

export default function Home() {
    const [itemList, setItemList] = useState([]);
    const [pathList, setPathList] = useState([])
    const [currentPath, setCurrentPath] = useState(null);
    const [syncStatus, setSyncStatus] = useState('TODO....');
    
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

    useEffect(() => {
        getSyncStatus();
        getPathList(setPathList)
    }, [])

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
                    />
                </View>
                <View style={{ flex: 1, marginleft: 10 }}>
                    <Button
                        title="check status"
                        color="#841584"
                        accessibilityLabel="Check the current folder status"
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
                                        console.log(v)
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