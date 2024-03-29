import React from 'react';
import { View, Text, TextInput } from 'react-native';

interface InputProps {
    item: string;
    value: string;
    updateText: React.Dispatch<React.SetStateAction<string>>;
    wifi:boolean;
}
export default function ZippiriInput({item, value, updateText, wifi}: InputProps) {
    return (
        <View style={{ margin: 10 }}>
            <Text>{`${item[0].toUpperCase()}${item.substring(1, item.length )}`}</Text>
            <TextInput
                style={{
                    backgroundColor: "white",
                    height: 60,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'gray',
                    borderRadius: 5,
                    padding: 10,
                    color:'black',
                }}
                value={value}
                editable={item != "wifi SSID" || wifi}
                secureTextEntry={item == "password"}
                onChangeText={text =>updateText(text)}
                placeholder={`Insert ${item}`}
                placeholderTextColor="#000000"
            />
        </View>
    );
}
