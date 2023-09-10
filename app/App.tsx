import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import Home from './views/Home'
import Settings from './views/Settings'
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import BackgroundFetch from "react-native-background-fetch";
import { backgroundBackupCheck } from './lib/utils';

const Drawer = createDrawerNavigator();

export default function App() {
    useEffect(() => {
        (async () => {
            const onEvent = async (taskId:string) => {
                console.log('[BackgroundFetch] task: ', taskId);
                await backgroundBackupCheck()
                BackgroundFetch.finish(taskId);
            }
            const onTimeout = async (taskId:string) => {
                console.warn('[BackgroundFetch] TIMEOUT task: ', taskId);
                BackgroundFetch.finish(taskId);
            }
            let status = await BackgroundFetch.configure(
                { 
                    minimumFetchInterval: 15, 
                    stopOnTerminate:false
                }, 
                onEvent, 
                onTimeout
            );
            console.log('[BackgroundFetch] configure status: ', status)
        })()
    }, [])
    return (
        <NavigationContainer>
            <Drawer.Navigator
                initialRouteName="Home"
                screenOptions={{
                }}
            >
                <Drawer.Screen name="Home" component={Home} />
                <Drawer.Screen name="Settings" component={Settings} />
            </Drawer.Navigator>
        </NavigationContainer>
    );
}