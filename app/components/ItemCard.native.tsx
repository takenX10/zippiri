import React, { useState, useEffect } from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import { FileSystem, Util } from 'react-native-file-access';
import Icon from 'react-native-vector-icons/FontAwesome';
import { CardItem } from '../lib/types';
import { validImageExtensions } from '../lib/constants';

interface ItemCardProp {
    item: CardItem;
    setCurrent: (item:CardItem)=>void
}

export default function ItemCard({ item, setCurrent }: ItemCardProp) {
    const [imageData, setImageData] = useState("")
    useEffect(() => {
        if (item.type != "directory") {
            getdata()
        }
    }, [])

    async function getdata() {
        setImageData("data:image/png;base64," + (await FileSystem.readFile(item.currentpath, 'base64')))
    }

    function getItemPreview(item:CardItem) {
        if (item.type == "directory") {
            return (
                <Icon
                    name={item.filename == ".." ? "arrow-left":"folder"}
                    color="black"
                    size={50}
                    style={{
                        padding: 10
                    }}
                />
            )
        } else if (item.currentpath && validImageExtensions.includes(Util.extname(item.currentpath)) && imageData != '') {
            return (
                <Image
                    style={{
                        maxWidth: '100%',
                        width: '100%',
                        height: 200
                    }}
                    source={{
                        uri: imageData,
                    }}
                />
            )
        } else {
            return (
                <Icon
                    name="file"
                    color="black"
                    size={50}
                    style={{
                        padding: 10
                    }}
                />
            )
        }
    }

    return (
        <TouchableOpacity
            style={{
                borderColor: 'black',
                borderWidth: 1,
                borderStyle: 'solid',
                borderRadius: 4,
                margin: 10,
                flex: 1,
                alignItems: 'center',
                maxWidth: '50%',
            }}
            onPress={() => { if (item.type == "directory") setCurrent(item) }}
        >
            <View
                style={{
                    alignItems: 'center',
                    maxWidth: '100%',
                    width: '100%',
                    height: 200,
                    justifyContent: 'center'
                }}
            >
                {getItemPreview(item)}
            </View>
            <Text style={{ textAlign: 'center', paddingBottom: 5 }}> {item?.filename == ".."?"back":item?.filename}</Text>
            {/*<Text style={{ textAlign: 'center', paddingBottom:5 }}> {item?.status}</Text>*/}
        </TouchableOpacity>
    );
}