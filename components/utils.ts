import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dispatch, SetStateAction } from "react";
import FileHandler from "./backup/FileHandler";
import { Dirs, FileSystem, Util } from "react-native-file-access";
import BackupLogic from "./backup/backup";

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

export interface Status {
    success: boolean;
    message: string;
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


async function getStorage<Type>(key: string, defval: Type): Promise<Type> {
    const storage = await AsyncStorage.getItem(key)
    let value = defval
    if (storage) value = JSON.parse(storage) as Type
    return value
}

async function setStorage<Type>(key: string, val: Type) {
    return AsyncStorage.setItem(key, JSON.stringify(val))
}

const toSeconds:{[id:string]:number} = {
    "none":0,
    "hourly":60*60,
    "daily":60*60*24,
    "weekly":60*60*24*7,
    "monthly":60*60*24*30,
}

type FrequencyKeys = 'incremental'|'differential'|'full'

async function backgroundBackupCheck(){
    console.log("BACKGROUND BACKUP CHECK")
    const fh = new FileHandler()
    const BL = new BackupLogic()
    const freq = await getStorage("freq", {incremental:'none',differential:'none',full:'none'})
    let keys = Object.keys(freq) as FrequencyKeys[]
    keys = keys.filter((v)=>freq[v]!='none')
    console.log(freq)
    for(const path of (await FileSystem.statDir(Dirs.DocumentDir)).map((v)=>v.path)){
        for(const type of keys){
            const latest = await fh.findLatestFile(`${path}/${type}`)
            if(!latest) continue
            let d = Util.basename(latest)
            d = d.substring(1,d.length-4)
            console.log(d, path, type)
            console.log(new Date(Date.parse(d) + toSeconds[freq[type]]*1000).toLocaleString())
        }
    }
}


export {getPathList, validImageExtensions, compareStats, backgroundBackupCheck, getStorage }