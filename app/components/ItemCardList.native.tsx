import React from 'react';
import { View, Text } from 'react-native';
import ItemCard from './ItemCard.native';
import { CardItem } from '../lib/types';
import { FlatList } from 'react-native-gesture-handler';

interface ItemCardListProps {
    items: CardItem[];
    currentPath: CardItem | null;
    setCurrentPath: React.Dispatch<React.SetStateAction<CardItem | null>>;
}


export default function ItemCardList({ items, currentPath, setCurrentPath }: ItemCardListProps) {

    function renderItemCardRow({ i }: { i: CardItem[] }) {
        return (
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                {
                    i && i.map((value) =>
                        <ItemCard
                            key={value.filename}
                            item={value}
                            setCurrent={(v: CardItem) => {
                                if (v.type != 'directory') return
                                setCurrentPath(v)
                            }}
                        />
                    )

                }
            </View>
        )
    }

    return (
        <>
            {
                currentPath != null &&
                (
                    items.length == 0 ?
                        <Text style={{ marginTop: 25, fontSize: 15, textAlign: 'center' }}>
                            The folder is empty or you don't have permission to open this folder, reset the folder on settings.
                        </Text> :
                        <>
                            <FlatList
                                style={{
                                    marginTop: 10,
                                }}
                                data={
                                    [...Array(items.length).keys()].reduce( // Transform in groups of 2 elements
                                        (myarray: CardItem[][], newvalue, index) => {
                                            if (index % 2 == 0) {
                                                myarray.push([items[newvalue]])
                                            } else {
                                                myarray[myarray.length - 1].push(items[newvalue])
                                            }
                                            return myarray
                                        },
                                        []
                                    ).map((i) => {
                                        console.log(i[0].currentpath)
                                        return i
                                    })
                                }
                                keyExtractor={(d) => d[0].currentpath}
                                renderItem={(v) => { return renderItemCardRow({ i: v.item }) }}
                                contentContainerStyle={{}}
                            />
                        </>
                )
            }
        </>
    )
}