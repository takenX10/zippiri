import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dispatch, SetStateAction } from "react";

const validImageExtensions = ["jpg", "jpeg", "png"]

async function getPathList(setter:Dispatch<SetStateAction<string[]>>) {
    try {
        const fl = await AsyncStorage.getItem("folderList")
        if(!fl){
            setter([])
            return
        }
        const folders = JSON.parse(fl)
        if (folders != null) {
            setter(folders)
            return
        }
    } catch (e) {
        console.log(e)
    }
    setter([])
}

export interface Stats {
    path: string;
    type: string;
    value: string;
    keyName: string;
    filename: string;
    lastModified: number;
    size: number;
}

export interface StatsDictionary {
    [id: string]: Stats
}

export interface BackupStatus {
    full: boolean;
    differential: boolean;
    incremental: boolean;
}

export interface CardItem {
    basepath: string;
    currentpath: string;
    filename: string;
    type: string;
    depth: number;
}

//true -> they are equal, false otherwise
function compareStats(a:Stats,b:Stats):boolean{
    return a.path==b.path && a.value==b.value
}


export {getPathList, validImageExtensions, compareStats }