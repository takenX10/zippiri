import { FileSystem, Dirs, Util } from "react-native-file-access";
import { zip } from 'react-native-zip-archive';
import { encode } from "base-64";
import ServerInteractor from "./ServerInteractor";
import FileHandler from "./FileHandler";
import { getStorage } from "./utils";
import { BackupStatus, SavedStats, ZippiriFileStat } from "./types";
import { FrequencyKey } from "./constants";

export default class BackupLogic {
    constructor() { }

    async getServerInteractor(name: string = "", type: string = "", date: string = "") {
        const addr = await this.address();
        const sig = await this.signature();
        const usr = await this.username();
        const psw = await this.password();
        if (!addr || !sig || !usr || !psw) return null
        const s = new ServerInteractor(
            addr,
            sig,
            usr,
            psw,
            date,
            name,
            type
        )
        await s.login()
        return s
    }

    generateBackupName(path: string) {
        return encodeURIComponent(Util.basename(path))
    }

    generateBackupDate() {
        const date = new Date();
        const dateString = date.toISOString()
        return dateString.substring(0, dateString.length - 2);
    }

    async address() {
        const addr = await getStorage("address", "")
        if(addr=="") return null
        return addr
    }
    async signature() {
        const sig = await getStorage("signature", "")
        if(sig=="") return null
        return sig
    }
    async username() {
        const usr = await getStorage("username", "")
        if(usr=="") return null
        return usr
    }
    async password() {
        const psw = await getStorage("password", "")
        if(psw=="") return null
        return psw
    }
    async compression() {
        const comp = await getStorage("compression", "")
        if(comp=="") return null
        return comp
    }

    async getSyncStatus(path: string): Promise<BackupStatus> {
        let status: BackupStatus = {
            differential: false,
            incremental: false,
            full: false
        }
        try {
            const fh = new FileHandler()
            const stats = await fh.generate_stats(path)
            const backupName = this.generateBackupName(path)
            if (!stats) throw new Error("Unable to generate stats of path")
            for (const [_, type] of Object.entries(FrequencyKey)) {
                const srv = await this.getServerInteractor(backupName, type)
                if(!srv) continue
                const latestFile = await srv.getStats()
                if(!latestFile) continue
                const parsed = latestFile as SavedStats
                if (!fh.statsDelta(parsed.currentList, stats).length || !fh.statsDelta(stats, parsed.currentList)) {
                    status[type] = true
                }
            }
        } catch (err) {
            console.log(err)
        }
        return status

    }
    // destFolder -> folder where you handle file creation & create your stats
    async startBackup(path: string, backupType: FrequencyKey) {
        try {
            console.log("Start backup")
            const backupName = this.generateBackupName(path)
            const date = this.generateBackupDate()
            const signature = await this.signature()
            if (!signature) throw new Error('Unable to get signature')
            const compression = await this.compression()
            if (!compression) throw new Error('Unable to get compression type')

            const startingPath = `${Dirs.DocumentDir}/${backupName}`

            const fh = new FileHandler()
            await fh.createLocalPath(backupName, backupType, date)
            const s = await this.getServerInteractor(backupName, backupType, date)
            if (!s) throw new Error("Unable to get server interactor")

            const currentFiles = await fh.generate_stats(path)
            const latestFile = await s.getStats()
            let addedList = [] as ZippiriFileStat[]
            let removedList = [] as ZippiriFileStat[]
            if (!latestFile || backupType == 'full') {
                addedList = currentFiles
            } else {
                addedList = fh.statsDelta(latestFile.currentList, currentFiles)
                removedList = fh.statsDelta(currentFiles, latestFile.currentList)
            }
            const stats: SavedStats = {
                date: date,
                added: addedList,
                removed: removedList,
                currentList: currentFiles,
                compression: compression
            }
            const base64_stats = encode(JSON.stringify(stats))
            for (const f of addedList) {
                await FileSystem.cp(f.path, `${startingPath}/${backupType}/${date}/${f.keyName}`)
            }
            if (!await s.start_upload()) return false
            if (!await s.upload(base64_stats, `.${signature}`, `.${signature}`)) return false
            if (addedList.length) {
                switch (compression) {
                    case 'zip':
                        await zip(`${startingPath}/${backupType}/${date}`, `${startingPath}/${backupType}/${date}.zip`)
                        const f = await FileSystem.readFile(`${startingPath}/${backupType}/${date}.zip`, 'base64')
                        if (!await s.upload(f, `${date}.zip`, `${date}.zip`)) return false
                        await FileSystem.unlink(`${startingPath}/${backupType}/${date}.zip`)
                        break
                    default:
                        for (const f of await FileSystem.statDir(`${startingPath}/${backupType}/${date}`)) {
                            const content = await FileSystem.readFile(`${f.path}`, 'base64')
                            if (!await s.upload(content, f.filename, `upload/${f.filename}`)) return false
                        }
                        break
                }
            }
            console.log("End upload")
            if (!await s.end_upload()) return false
            await FileSystem.unlink(`${startingPath}/${backupType}`)
            return true
        } catch (e) {
            console.log(e)
        }
        return false
    }
}