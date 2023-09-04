import { FileSystem, Dirs } from "react-native-file-access";
import { zip } from 'react-native-zip-archive';
import { encode } from "base-64";
import ServerInteractor from "./ServerInteractor";
import { storageGetter } from "./backupUtils";
import FileHandler from "./FileHandler";

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
        let n = path.split("%3A");
        return n[n.length - 1]
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


    async upload_full(path: string) {
        try {
            const date = this.generateBackupDate()
            const signature = await this.signature()
            const fh = new FileHandler()
            await fh.createLocalPath("full", date)
            const s = await this.getServerInteractor(this.generateBackupName(path), "full")
            if (!s) throw new Error("Unable to get server interactor")

            const stats = await fh.generate_stats(path)
            let base64_stats = encode(JSON.stringify(stats))
            
            await fh.copy_directory(path, `${Dirs.DocumentDir}/full/${date}/tmp`)
            
            if (!await s.start_upload()) return false
            if (!await s.upload(base64_stats, `.${signature}`)) return false

            // TODO: Add different encodings
            await zip(`${Dirs.DocumentDir}/full/${date}/tmp`, `${Dirs.DocumentDir}/full/${date}/${date}.zip`)

            let f = await FileSystem.readFile(`${Dirs.DocumentDir}/full/${date}/${date}.zip`, 'base64')
            if (!await s.upload(f, `${date}.zip`)) return false

            if (!await s.end_upload()) return false
            await FileSystem.writeFile(`${Dirs.DocumentDir}/full/.${date}.txt`, JSON.stringify(stats))
            await FileSystem.unlink(`${Dirs.DocumentDir}/full/${date}/tmp`)
            await FileSystem.unlink(`${Dirs.DocumentDir}/full/${date}/${date}.zip`)
            return true
        } catch (e) {
            console.log(e)
            return false
        }
    }

    async upload_differential(path: string) {
        try {
            const date = this.generateBackupDate()
            const signature = await this.signature()

            const fh = new FileHandler()
            await fh.createLocalPath("differential", date)

            const s = await this.getServerInteractor(this.generateBackupName(path), "differential")
            if (!s) throw new Error("Unable to get server interactor")

            const stats = await fh.generate_stats(path)
            const base64_stats = encode(JSON.stringify(stats))

            const fullBackupStartingPath = await fh.getLatestFile(`${Dirs.DocumentDir}/full`)
            if (!fullBackupStartingPath) throw new Error("No full backup available")

            await fh.compare_and_copy_difference(
                JSON.parse(fullBackupStartingPath),
                stats,
                `${Dirs.DocumentDir}/differential/${date}/tmp`
            )

            if (!await s.start_upload()) return false
            if (!await s.upload(base64_stats, `.${signature}`)) return false

            // TODO: Add different encodings
            await zip(`${Dirs.DocumentDir}/differential/${date}/tmp`, `${Dirs.DocumentDir}/differential/${date}/${date}.zip`)
            
            let f = await FileSystem.readFile(`${Dirs.DocumentDir}/differential/${date}/${date}.zip`, 'base64')
            if (!await s.upload(f, `${date}.zip`)) return false

            if (!await s.end_upload()) return false
            await FileSystem.writeFile(`${Dirs.DocumentDir}/differential/.${date}.txt`, JSON.stringify(stats))
            await FileSystem.unlink(`${Dirs.DocumentDir}/differential/${date}/tmp`)
            await FileSystem.unlink(`${Dirs.DocumentDir}/differential/${date}/${date}.zip`)
            return true
        } catch (e) {
            console.log(e)
        }
        return false
    }
}