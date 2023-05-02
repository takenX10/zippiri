import React from 'react';
import { View, Text, TextInput } from 'react-native';

export default function ZippiriInput({item, value, updateText, wifi}) {
    return (
        <View style={{ margin: 10 }}>
            <Text>{`${item[0].toUpperCase()}${item.substr(1, item.length - 1)}`}</Text>
            <TextInput
                style={{
                    backgroundColor: "white",
                    height: 60,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'gray',
                    borderRadius: 5,
                    padding: 10,
                }}
                value={value}
                editable={item != "wifi SSID" || wifi}
                secureTextEntry={item == "password"}
                onChangeText={text =>updateText(text)}
                placeholder={`Insert ${item}`}
            />
        </View>
    );
}
