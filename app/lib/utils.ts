import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dispatch, SetStateAction } from "react";
import BackupLogic from "./backup";
import { sourceFromDest, toSeconds } from "./constants";
import { FrequencyKeys, Stats } from "./types";

export async function getPathList(setter: Dispatch<SetStateAction<string[]>>) {
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

//true -> they are equal, false otherwise
export function compareStats(a: Stats, b: Stats): boolean {
    return a.path == b.path && a.value == b.value
}


export async function getStorage<Type>(key: string, defval: Type): Promise<Type> {
    const storage = await AsyncStorage.getItem(key)
    let value = defval
    if (storage) value = JSON.parse(storage) as Type
    return value
}

export async function backgroundBackupCheck() {
    console.log("#### Start background backup check")
    const BL = new BackupLogic()
    let keys = {} as { [id: string]: number }
    for (const freq of ['differential', 'incremental', 'full']) {
        const storageFreq = await getStorage(freq, 'none')
        if (storageFreq != 'none') keys[freq] = toSeconds[storageFreq]
    }
    const folderList = await getStorage("folderList", [] as string[])
    const currentDate = new Date()
    for (const path of folderList) {
        console.log(`- Checking folder ${path}`)
        const name = BL.generateBackupName(path)
        for (const type of Object.keys(keys)) {
            console.log(`\t- Checking backup type ${type}`)
            const srv = await BL.getServerInteractor(name, type, "")
            if (!srv) continue
            const stats = await srv.getStats()
            if (stats) {
                let sd = stats.date as string
                const startDate = new Date(Date.parse(sd + '000Z'))
                const deadline = new Date(startDate.getTime() + keys[type] * 1000)
                console.log(`\t\tLast backup: ${startDate.toISOString()}`)
                console.log(`\t\tDeadline: ${deadline.toISOString()}`)
                console.log(`\t\tNow: ${currentDate.toISOString()}`)
                if (currentDate.getTime() <= deadline.getTime()) continue
            }
            console.log(`\t* Starting background backup ${name} ${type}`)
            await BL.startBackup(path, sourceFromDest[type as FrequencyKeys], type)
        }
    }
}