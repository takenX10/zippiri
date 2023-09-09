import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dispatch, SetStateAction } from "react";
import FileHandler from "./backup/FileHandler";
import { Dirs, FileStat, FileSystem, Util } from "react-native-file-access";
import BackupLogic from "./backup/backup";

const validImageExtensions = ["jpg", "jpeg", "png"]

async function getPathList(setter: Dispatch<SetStateAction<string[]>>) {
    try {
        const fl = await AsyncStorage.getItem("folderList")
        if (!fl) {
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
    foldertree: string;
}

export interface AddedFileStat {
    baseStat: FileStat;
    foldertree: string;
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
function compareStats(a: Stats, b: Stats): boolean {
    return a.path == b.path && a.value == b.value
}


async function getStorage<Type>(key: string, defval: Type): Promise<Type> {
    const storage = await AsyncStorage.getItem(key)
    let value = defval
    if (storage) value = JSON.parse(storage) as Type
    return value
}

const toSeconds: { [id: string]: number } = {
    "none": 0,
    "hourly": 60 * 60,
    "daily": 60 * 60 * 24,
    "weekly": 60 * 60 * 24 * 7,
    "monthly": 60 * 60 * 24 * 30,
}

type FrequencyKeys = 'incremental' | 'differential' | 'full'

export type FrequencyValueEnum = 'none' | 'hourly' | 'daily' | 'weekly' | 'monthly'

const sourceFromDest = {
    incremental: 'incremental',
    differential: 'full',
    full: ''
}

async function backgroundBackupCheck() {
    console.log("BACKGROUND BACKUP CHECK")
    const fh = new FileHandler()
    const BL = new BackupLogic()
    let keys = {} as { [id: string]: number }
    for (const freq of ['differential', 'incremental', 'full']) {
        const storageFreq = await getStorage(freq, 'none')
        if (storageFreq != 'none') keys[freq] = toSeconds[storageFreq]
    }
    const folderList = await getStorage("folderList", [] as string[])
    const currentDate = new Date()
    for (const path of folderList) {
        const name = BL.generateBackupName(path)
        const pathwithname = `${Dirs.DocumentDir}/${name}`
        //if(await FileSystem.exists(name)) await FileSystem.unlink(name)
        //continue
        for (const type of Object.keys(keys)) {
            const srv = await BL.getServerInteractor(name, type, "")
            if (!srv) continue
            const stats = await srv.getStats()
            if (stats) {
                const latest = stats.date as string
                let sd = Util.basename(latest)
                sd = sd.substring(1, sd.length - 4)
                const startDate = new Date(Date.parse(sd + '000Z'))
                const deadline = new Date(startDate.getTime() + keys[type] * 1000)
                if (currentDate.getTime() <= deadline.getTime()) continue
                console.log(`
Starting backup ${name} ${type} ${currentDate > deadline}
(start: ${startDate.toISOString()} - deadline: ${deadline.toISOString()})
                `)
            }
            await BL.startBackup(path, sourceFromDest[type as FrequencyKeys], type)
        }
    }
}


export {
    getPathList,
    validImageExtensions,
    compareStats,
    backgroundBackupCheck,
    getStorage,
}