import React from 'react';
import {Text} from 'react-native';

export default function ZippiriHeader({title}){
    return (
        <Text style={{
            padding: 10,
            marginTop: 20,
            marginBottom: 10,
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 'bold',
            backgroundColor: 'white',
        }}>{title}</Text>
    );
}