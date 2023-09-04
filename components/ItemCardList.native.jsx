import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import ItemCard from './ItemCard.native';

export default function ItemCardList({ items, currentPath, setCurrentPath }) {
    return (
        <ScrollView style={{
            marginTop: 10
        }}>
            {
                currentPath == null ?
                    <></> :
                    (
                        items.length == 0 ?
                            <Text style={{ marginTop: 25, fontSize: 15, textAlign: 'center' }}>
                                The folder is empty or you don't have permission to open this folder, reset the folder on settings.
                            </Text>
                            :
                            [...Array(items.length).keys()].reduce( // Transform in groups of 2 elements
                                (myarray, newvalue, index) => {
                                    if (index % 2 == 0) {
                                        myarray.push([items[newvalue]])
                                    } else {
                                        myarray[myarray.length - 1].push(items[newvalue])
                                    }
                                    return myarray
                                },
                                []
                            ).map(i =>
                                <View key={i[0].filename} style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                    {
                                        i.map((value) =>
                                            <ItemCard
                                                key={value.filename}
                                                item={value}
                                                setCurrent={(v) => {
                                                    setCurrentPath(c => {
                                                        return {
                                                            depth: c["depth"] + (v.filename == ".." ? -1 : +1),
                                                            path: v.path
                                                        }
                                                    })
                                                }}
                                            />
                                        )

                                    }
                                </View>
                            )
                    )
            }
        </ScrollView>
    )
}