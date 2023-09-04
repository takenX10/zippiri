import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, StyleSheet } from "react-native";
import DropdownComponent from '../components/DropdownComponent.native';
import ZippiriInput from '../components/ZippiriInput';
import ZippiriHeader from '../components/ZippiriHeader';
import { ScrollView } from 'react-native-gesture-handler';
import ZippiriCheckbox from '../components/ZippiriCheckbox';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dirs, FileSystem } from 'react-native-file-access';

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

export default function Settings() {

    const [folderList, setFolderList] = useState([])
    const [frequency, setFrequency] = useState({ "incremental": "none", "differential": "none", "full": "none" })
    const [compression, setCompression] = useState(null)
    const [phonedata, setPhonedata] = useState(false);
    const [address, setAddress] = useState("");
    const [signature, setSignature] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [wifiSSID, setWifiSSID] = useState("");
    const [wifi, setWifi] = useState(false);

    const settings = {
        "folderList": { value: folderList, setter: setFolderList },
        "frequency": { value: frequency, setter: setFrequency },
        "compression": { value: compression, setter: setCompression },
        "folderList": { value: folderList, setter: setFolderList },
        "phonedata": { value: phonedata, setter: setPhonedata },
        "address": { value: address, setter: setAddress },
        "signature": { value: signature, setter: setSignature },
        "username": { value: username, setter: setUsername },
        "password": { value: password, setter: setPassword },
        "wifissid": { value: wifiSSID, setter: setWifiSSID },
        "wifi": { value: wifi, setter: setWifi }
    }

    async function loadSettings() {
        for (let s in settings) {
            let v = JSON.parse(await AsyncStorage.getItem(s))
            if (v != null) {
                settings[s].setter(v)
            }
        }
    }

    useEffect(() => {
        loadSettings()
    }, [])

    async function saveSettings() {
        for (let s in settings) {
            AsyncStorage.setItem(s, JSON.stringify(settings[s].value))
        }
    }

    const handleDocumentSelection = useCallback(async () => {
        try {
            const response = await DocumentPicker.pickDirectory({
                presentationStyle: 'fullScreen',
            });
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
                    return (
                        <DropdownComponent
                            key={item}
                            icon="clock-o"
                            data={frequencyList}
                            label={`${item} frequency`}
                            setCurrentPath={(v) => setFrequency((f) => { f[item] = v; return f })}
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
                            <Button style={{ flex: 4 }} title="X" color="red" accessibilityLabel="remove folder"
                                onPress={() => {

                                    setFolderList((f) => {
                                        const newlist = []
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
                icon="file-zip-o"
                data={compressionList}
                label="compression algorithm"
                setCurrentPath={(v) => setCompression(v)}
            />
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