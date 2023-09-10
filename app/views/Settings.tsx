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
import BackupLogic from '../lib/BackupLogic';
import { SettingKey } from '../lib/types';
import { Compression, FrequencyKey, FrequencyValue } from '../lib/constants';
import { getStorage } from '../lib/utils';

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

export default function Settings() {

    const [folderList, setFolderList] = useState([] as string[])
    const [full, setFull] = useState(FrequencyValue.none)
    const [differential, setDifferential] = useState(FrequencyValue.none)
    const [incremental, setIncremental] = useState(FrequencyValue.none)
    const [compression, setCompression] = useState(Compression.zip)
    const [phonedata, setPhonedata] = useState(false);
    const [address, setAddress] = useState("");
    const [signature, setSignature] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [wifiSSID, setWifiSSID] = useState("");
    const [wifi, setWifi] = useState(false);

    const settings: { [key in SettingKey]: {
        value: any,
        setter: React.Dispatch<React.SetStateAction<any>>
    } } = {
        folderList: { value: folderList, setter: setFolderList },
        signature: { value: signature, setter: setSignature },
        full: { value: full, setter: setFull },
        incremental: { value: incremental, setter: setIncremental },
        differential: { value: differential, setter: setDifferential },
        compression: { value: compression, setter: setCompression },
        phonedata: { value: phonedata, setter: setPhonedata },
        address: { value: address, setter: setAddress },
        username: { value: username, setter: setUsername },
        password: { value: password, setter: setPassword },
        wifissid: { value: wifiSSID, setter: setWifiSSID },
        wifi: { value: wifi, setter: setWifi }
    }
    
    useEffect(() => {
        loadSettings()
    }, [])

    useEffect(() => {
        if (phonedata || !wifi) {
            setWifi(false);
            setWifiSSID("");
        }
    }, [phonedata, wifi])
    
    const handleDocumentSelection = useCallback(async () => {
        try {
            const response = await DocumentPicker.pickDirectory({
                presentationStyle: 'fullScreen',
            });
            if (!response) return
            setFolderList((f) => [...f, response.uri])
        } catch (err) {
            console.log(err);
        }
    }, []);
    
    async function loadSettings() {
        for (const [k, v] of Object.entries(settings)) {
            v.setter(await getStorage(k, v.value))
        }
    }


    async function saveSettings() {
        for (const [k, v] of Object.entries(settings)) {
            await AsyncStorage.setItem(k, JSON.stringify(v.value))
        }
        ToastAndroid.show("Settings saved", ToastAndroid.SHORT)
    }



    return (
        <ScrollView style={{
            margin: 20,
        }}>
            <ZippiriHeader title="Backup Frequency" />
            <DropdownComponent
                key="full"
                icon="clock-o"
                defaultValue={full}
                data={Object.entries(FrequencyValue).map(([_, v]) => { return { label: v, value: v } })}
                label="full frequency"
                setCurrentPath={(v: FrequencyValue) => { setFull(v) }}
            />
            <DropdownComponent
                key="differential"
                icon="clock-o"
                defaultValue={differential}
                data={Object.entries(FrequencyValue).map(([_, v]) => { return { label: v, value: v } })}
                label="differential frequency"
                setCurrentPath={(v: FrequencyValue) => { setDifferential(v) }}
            />
            <DropdownComponent
                key="incremental"
                icon="clock-o"
                defaultValue={incremental}
                data={Object.entries(FrequencyValue).map(([_, v]) => { return { label: v, value: v } })}
                label="Incremental frequency"
                setCurrentPath={(v: FrequencyValue) => { setIncremental(v) }}
            />
            <ZippiriHeader title="Folders" />
            {
                folderList.map((foldertext) => {
                    return (
                        <View style={settingsStyle.folders} key={foldertext} >
                            <Text style={{ flex: 1 }}>{foldertext}</Text>
                            <Button
                                title="X"
                                color="black"
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
            <ZippiriCheckbox
                value={phonedata}
                onValueChange={setPhonedata}
                text="Use phone data connection?"
                disabled={false}
            />
            <ZippiriCheckbox value={wifi} onValueChange={setWifi} text="Use a specific wifi SSID?" disabled={phonedata} />
            <ZippiriInput item={"wifi SSID"} value={wifiSSID} updateText={setWifiSSID} wifi={wifi} />
            <ZippiriHeader title="Other" />
            <DropdownComponent
                defaultValue={compression}
                icon="file-zip-o"
                data={Object.entries(Compression).map(([_, v]) => {
                    return { label: v, value: v }
                })}
                label="compression algorithm"
                setCurrentPath={(v: Compression) => { setCompression(v) }}
            />
            <View style={{ height: 100 }}></View>
            <View style={{ margin: 10 }}>
                <Button
                    title="Test server"
                    color="#841584"
                    accessibilityLabel="Sync the current folder"
                    onPress={async () => {
                        const BL = new BackupLogic();
                        const srv = await BL.getServerInteractor()
                        if (!srv) return ToastAndroid.show("Something went wrong", ToastAndroid.SHORT)
                        const msg = await srv.checkServer() ? "The server works" : "Unable to connect to server"
                        ToastAndroid.show(msg, ToastAndroid.SHORT)
                    }}
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