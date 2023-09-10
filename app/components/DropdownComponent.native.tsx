import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';

interface DropdownProps {
    data:{label:string;value:string}[];
    setCurrentPath:(v:any)=>void;
    label: string;
    icon: string;
    defaultValue:string;
}
const DropdownComponent = ({data, setCurrentPath, label, icon, defaultValue}:DropdownProps) => {
    const [isFocus, setIsFocus] = useState(false);

    const renderLabel = () => {
        if (defaultValue || isFocus) {
            return (
                <Text style={[styles.label, isFocus && { color: 'blue' }]}>
                    {label}
                </Text>
            );
        }
        return null;
    };

    return (
        <View style={styles.container}>
            {renderLabel()}
            <Dropdown
                style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={data}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={!isFocus ? "Select " + label : ''}
                searchPlaceholder="Search..."
                value={defaultValue}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                onChange={item => {
                    setIsFocus(false);
                    setCurrentPath(item.value);
                }}
                renderLeftIcon={() => (
                    <Icon 
                        name={icon}
                        color={isFocus ? 'blue' : 'black'} 
                        size={20}
                        style={{paddingRight: 10}}
                    />
                )}

            />
        </View>
    );
};

export default DropdownComponent;

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        margin: 10,
        borderColor: 'gray',
        borderWidth: 0.5,
        borderRadius: 8,
    },
    dropdown: {
        height: 70,
        paddingHorizontal: 8,
    },
    Icon: {
        marginRight: 20,
    },
    label: {
        position: 'absolute',
        backgroundColor: 'white',
        left: 22,
        top: 8,
        zIndex: 999,
        paddingHorizontal: 8,
        fontSize: 12,
    },
    placeholderStyle: {
        fontSize: 16,
    },
    selectedTextStyle: {
        fontSize: 20,
        color:'black'
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
        color:'black'
    },
});