import { FileSystem, Dirs, Util } from "react-native-file-access";
import { zip } from 'react-native-zip-archive';
import { encode } from "base-64";
import ServerInteractor from "./ServerInteractor";
import { storageGetter } from "./backupUtils";
import FileHandler from "./FileHandler";
import { BackupStatus, Stats, compareStats } from "../utils";

interface SavedStats{
    date: string;
    added: Stats[];
    removed: Stats[];
    currentList: Stats[];
}

export default class BackupLogic {
    constructor() { }

    async getServerInteractor(name: string = "", type: string = "") {
        const addr = await this.address();
        const sig = await this.signature();
        const usr = await this.username();
        const psw = await this.password();
        if (addr && sig && usr && psw) return new ServerInteractor(
            addr,
            sig,
            usr,
            psw,
            this.generateBackupDate(),
            name,
            type
        )
        return null
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
        return await storageGetter("address")
    }
    async signature() {
        return await storageGetter("signature")
    }
    async username() {
        return await storageGetter("username")
    }
    async password() {
        return await storageGetter("password")
    }

    async getSyncStatus(path:string):Promise<BackupStatus> {
        let status:BackupStatus= {
            differential:false,
            incremental:false,
            full:false
        }
        try{
            const fh = new FileHandler()
            const stats = await fh.generate_stats(path)
            const backupName = this.generateBackupName(path)
            if(!stats) throw new Error("Unable to generate stats of path")
            for(const type of ["full","differential","incremental"]){
                const latestFile = await fh.getLatestFile(`${Dirs.DocumentDir}/${backupName}/${type}`)
                if(latestFile!=""){
                    const parsed = JSON.parse(latestFile) as SavedStats
                    if(fh.statsDelta(parsed.currentList, stats).length || fh.statsDelta(stats, parsed.currentList)){
                        switch(type){
                            case "full":
                                status.full = true
                                break;
                            case "incremental":
                                status.incremental=true;
                                break;
                            case "differential":
                                status.differential = true;
                                break;
                        }
                    }
                }    
            }
        }catch(err){
            console.log(err)
        }
        return status

    }

    // sourceFolder -> folder where you search latest stats
    // destFolder -> folder where you handle file creation & create your stats
    async startBackup(path: string, sourceFolder:string, destFolder:string) {
        try {
            //console.log(await FileSystem.statDir(`${Dirs.DocumentDir}`))
            //return await FileSystem.unlink(`${Dirs.DocumentDir}/${sourceFolder}`)
            const date = this.generateBackupDate()
            const backupName = this.generateBackupName(path)
            const signature = await this.signature()
            if(!signature) throw new Error('Unable to get signature')
            
            const startingPath = `${Dirs.DocumentDir}/${backupName}`

            const fh = new FileHandler()
            await fh.createLocalPath(backupName, destFolder, date)

            const s = await this.getServerInteractor(backupName, destFolder)
            if (!s) throw new Error("Unable to get server interactor")
            
            const currentFiles = await fh.generate_stats(path)
            const latestFile = sourceFolder==""?"":await fh.getLatestFile(`${startingPath}/${sourceFolder}`)
            let addedList = [] as Stats[]
            let removedList = [] as Stats[]
            if(latestFile == ""){
                addedList = currentFiles
            }else{
                const oldFilesList = JSON.parse(latestFile) as SavedStats
                addedList = fh.statsDelta(oldFilesList.currentList, currentFiles)
                removedList = fh.statsDelta(currentFiles, oldFilesList.currentList)
            }
            const stats: SavedStats= {
                date: date,
                added: addedList,
                removed: removedList,
                currentList: currentFiles
            }
            const base64_stats = encode(JSON.stringify(stats))
            for(const f of addedList){
                await FileSystem.cp(f.path, `${startingPath}/${destFolder}/${date}/${f.keyName}`)
            }
            if (!await s.start_upload()) return false
            if (!await s.upload(base64_stats, `.${signature}`)) return false
            if(addedList.length){
                // TODO: Add different encodings
                await zip(`${startingPath}/${destFolder}/${date}`, `${startingPath}/${destFolder}/${date}.zip`)
                
                const f = await FileSystem.readFile(`${startingPath}/${destFolder}/${date}.zip`, 'base64')
                if (!await s.upload(f, `${date}.zip`)) return false
                await FileSystem.unlink(`${startingPath}/${destFolder}/${date}.zip`)
            }

            if (!await s.end_upload()) return false
            await FileSystem.unlink(`${startingPath}/${destFolder}/${date}`)
            await FileSystem.writeFile(`${startingPath}/${destFolder}/.${date}.txt`, JSON.stringify(stats))
            return true
        } catch (e) {
            console.log(e)
        }
        return false
    }
}