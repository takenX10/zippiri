import React from 'react';
import { View, Text } from 'react-native';
import CheckBox from '@react-native-community/checkbox';


export default function ZippiriCheckbox({value, onValueChange, text, disabled}){
    return (
        <View style={{ margin: 10, flexDirection: 'row' }}>
            <CheckBox
                disabled={disabled}
                style={{ width: 23, height: 23 }}
                value={value}
                onValueChange={onValueChange}
            />
            <Text style={{ marginLeft: 10 }}>{text}</Text>
        </View>
    );
}