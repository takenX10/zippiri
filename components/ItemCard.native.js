import React, { useState, useEffect } from 'react';
import { Image, Text, TouchableOpacity } from 'react-native';
import { FileSystem } from 'react-native-file-access';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function ItemCard({ item, setCurrent }) {
    const [imageData, setImageData] = useState("")
    async function getdata(){
        setImageData("data:image/png;base64,"+(await FileSystem.readFile(item.path, 'base64')))
    }
    useEffect(() => {
        if(item.type != "directory"){
            getdata()
        }
    }, [])
    return (
        <TouchableOpacity
            style={{
                borderColor: 'black',
                borderWidth: 1,
                borderStyle: 'solid',
                borderRadius: 5,
                margin: 10,
                flex: 1,
                alignItems: 'center',
                maxWidth: '50%',
            }}
            onPress={() => { if (item.type == "directory") setCurrent(item) }}
        >
            {
                item.type == "directory" ?
                    <Icon
                        name="folder"
                        color="black"
                        size={50}
                        style={{ padding: 10 }}
                    /> :
                    (
                        imageData != "" ?
                            <Image
                                style={{
                                    width:100,
                                    height:200
                                }}
                                source={{
                                    uri: imageData,
                                }}
                            /> :
                            <></>
                    )
            }
            <Text style={{ textAlign: 'center', paddingBottom: 5 }}> {item?.filename}</Text>
            {/*<Text style={{ textAlign: 'center', paddingBottom:5 }}> {item?.status}</Text>*/}
        </TouchableOpacity>
    );
}