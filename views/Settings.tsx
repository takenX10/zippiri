import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, StyleSheet, ToastAndroid } from "react-native";
import DropdownComponent from '../components/DropdownComponent.native';
import ZippiriInput from '../components/ZippiriInput';
import ZippiriHeader from '../components/ZippiriHeader';
import { ScrollView } from 'react-native-gesture-handler';
import ZippiriCheckbox from '../components/ZippiriCheckbox';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FileSystem } from 'react-native-file-access';
import { FrequencyValueEnum } from '../components/utils';

const settingsStyle = StyleSheet.create({
    folders: {
        borderWidth: 1,
        borderColor: "gray",
        borderRadius: 5,
        borderStyle: 'solid',
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        margin: 10,
    }
})

const frequencyList = [ 
    { label: 'none', value: 'none' },
    { label: 'hourly', value: 'hourly' },
    { label: 'daily', value: 'daily' },
    { label: 'weekly', value: 'weekly' },
    { label: 'monthly', value: 'monthly' }
];

const compressionList = [
    { label: 'zip', value: 'zip' },
    { label: 'tar', value: 'tar' },
    { label: 'gzip', value: 'gzip' },
]

type CompressionEnum =  'zip'|'tar'|'gzip'

type SettingEnum = 
    "folderList"|"full"|"compression"|"folderList"|
    "phonedata"|"address"|"signature"|"username"|
    "password"|"wifissid"|"wifi"|'incremental'|'differential';

export default function Settings() {

    const [folderList, setFolderList] = useState([] as string[])
    const [full, setFull] = useState('none' as FrequencyValueEnum)
    const [differential, setDifferential] = useState('none' as FrequencyValueEnum)
    const [incremental, setIncremental] = useState('none' as FrequencyValueEnum)
    const [compression, setCompression] = useState('zip' as CompressionEnum)
    const [phonedata, setPhonedata] = useState(false);
    const [address, setAddress] = useState("");
    const [signature, setSignature] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [wifiSSID, setWifiSSID] = useState("");
    const [wifi, setWifi] = useState(false);

    const settings = {
        "folderList": { value: folderList, setter: setFolderList },
        "signature": { value: signature, setter: setSignature },
        "full": { value: full, setter: setFull },
        "incremental": { value: incremental, setter: setIncremental },
        "differential": { value: differential, setter: setDifferential },
        "compression": { value: compression, setter: setCompression },
        "phonedata": { value: phonedata, setter: setPhonedata },
        "address": { value: address, setter: setAddress },
        "username": { value: username, setter: setUsername },
        "password": { value: password, setter: setPassword },
        "wifissid": { value: wifiSSID, setter: setWifiSSID },
        "wifi": { value: wifi, setter: setWifi }
    }

    function setter<Type>(value:Type, setter:any){
        setter(value)
    }
    async function loadSettings() {
        for (const k of Object.keys(settings)) {
            let v = await AsyncStorage.getItem(k)
            if(!v) continue
            v = JSON.parse(v)
            if(v) setter(v,settings[k as SettingEnum].setter)
        }
    }

    useEffect(() => {
        loadSettings()
    }, [])

    async function saveSettings() {
        for (const s of Object.keys(settings)) {
            await AsyncStorage.setItem(s, JSON.stringify(settings[s as SettingEnum].value))
        }
        ToastAndroid.show("Settings saved", ToastAndroid.SHORT)
    }

    const handleDocumentSelection = useCallback(async () => {
        try {
            const response = await DocumentPicker.pickDirectory({
                presentationStyle: 'fullScreen',
            });
            if(!response) return
            let res = await FileSystem.statDir(response.uri)
            setFolderList((f) => [...f, response.uri])
        } catch (err) {
            console.log(err);
        }
    }, []);

    useEffect(() => {
        if (phonedata || !wifi) {
            setWifi(false);
            setWifiSSID("");
        }
    }, [phonedata, wifi])

    return (
        <ScrollView style={{
            margin: 20,
        }}>
            <ZippiriHeader title="Backup Frequency" />
            {
                ["incremental", "full", "differential"].map((item) => {
                    let val, setter:any;
                    switch(item){
                        case 'incremental':
                            val = incremental; setter = setIncremental;
                            break
                        case 'full':
                            val = full; setter = setFull;
                            break
                        case 'differential':
                            val = differential; setter = setDifferential;
                            break
                    }
                    return (
                        <DropdownComponent
                            key={item} 
                            icon="clock-o"
                            defaultValue={
                                val
                            }
                            data={frequencyList}
                            label={`${item} frequency`}
                            setCurrentPath={(v:string) => {setter(v)}}
                        />
                    )
                })
            }
            <ZippiriHeader title="Folders" />
            {
                folderList.map((foldertext) => {
                    return (
                        <View style={settingsStyle.folders} key={foldertext} >
                            <Text style={{ flex: 1 }}>{foldertext}</Text>
                            <Button 
                                title="X" 
                                color="red" 
                                accessibilityLabel="remove folder"
                                onPress={() => {
                                    setFolderList((f) => {
                                        const newlist = [] as string[]
                                        f.forEach((v) => {
                                            if (v != foldertext) {
                                                newlist.push(v)
                                            }
                                        })
                                        return newlist
                                    })
                                }}
                            />
                        </View>
                    );
                })
            }
            <View style={{ margin: 10 }}>
                <Button
                    title="Add a folder"
                    color="#841584"
                    accessibilityLabel="Add a folder"
                    onPress={handleDocumentSelection}
                />
            </View>
            <ZippiriHeader title="Server" />
            <ZippiriInput item={"address"} value={address} updateText={setAddress} wifi={wifi} />
            <ZippiriInput item={"signature"} value={signature} updateText={setSignature} wifi={wifi} />
            <ZippiriInput item={"username"} value={username} updateText={setUsername} wifi={wifi} />
            <ZippiriInput item={"password"} value={password} updateText={setPassword} wifi={wifi} />
            <ZippiriCheckbox value={phonedata} onValueChange={setPhonedata} text="Use phone data connection?" disabled={false} />
            <ZippiriCheckbox value={wifi} onValueChange={setWifi} text="Use a specific wifi SSID?" disabled={phonedata} />
            <ZippiriInput item={"wifi SSID"} value={wifiSSID} updateText={setWifiSSID} wifi={wifi} />
            <ZippiriHeader title="Other" />
            <DropdownComponent
                defaultValue={compression}
                icon="file-zip-o"
                data={compressionList}
                label="compression algorithm"
                setCurrentPath={(v:CompressionEnum) => setCompression(v)}
            />
            <View style={{height:100}}></View>
            <View style={{ margin: 10 }}>
                <Button
                    title="Test server"
                    color="#841584"
                    accessibilityLabel="Sync the current folder"
                />
            </View>
            <View style={{ margin: 10 }}>
                <Button
                    title="Save settings"
                    color="#841584"
                    accessibilityLabel="Save settings"
                    onPress={saveSettings}
                />
            </View>

        </ScrollView>
    );
}