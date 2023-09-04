import { FileSystem, Dirs } from "react-native-file-access"

interface Stats {
    path: string;
    type: string;
    value: string | StatsDictionary
}

interface StatsDictionary {
    [id:string]:Stats
}

export default class FileHandler {
    constructor() { }

    async clearCache(){
        const ls = await FileSystem.statDir(Dirs.DocumentDir)
        let size = 0
        for (let f of ls) {
            size += f.size/1024
            console.log(f.filename, f.size, f.size / 1024)
            await FileSystem.unlink(f.path)
        }
        console.log("TOTAL SIZE: "+size+"KB")
        return size
    }

    async createLocalPath(type: string, date: string) {
        if (!(await FileSystem.exists(`${Dirs.DocumentDir}/${type}`))) {
            await FileSystem.mkdir(`${Dirs.DocumentDir}/${type}`)
        }
        if (await FileSystem.exists(`${Dirs.DocumentDir}/${type}/${date}`)) {
            await this.delete_folder(`${Dirs.DocumentDir}/${type}/${date}`)
        }
        await FileSystem.mkdir(`${Dirs.DocumentDir}/${type}/${date}`)
    }

    async getLatestFile(path: string) {
        const ls = await FileSystem.statDir(path)
        let max: FileStat = {
            filename: "",
            lastModified: 0,
            path: "",
            size: 0,
            type: 'file'
        }
        for (let f of ls) {
            if (f.type != "directory" && f.lastModified > max.lastModified) {
                max = f
            }
        }
        if (max.lastModified == 0) return null
        return await FileSystem.readFile(max.path)
    }
    async delete_folder(path: string, onlyContent=false) {
        const ls = await FileSystem.statDir(path)
        for (let f of ls) {
            if (f.type == "directory") {
                await this.delete_folder(f.path)
            }
            await FileSystem.unlink(f.path)
        }
        if(!onlyContent) await FileSystem.unlink(path)
    }

    async copy_directory(source: string, target: string) {
        if (await FileSystem.exists(target)) {
            await this.delete_folder(target)
        }
        await FileSystem.mkdir(target)
        const ls = await FileSystem.statDir(source)
        for (let f of ls) {
            if (f.type == "directory") {
                await this.copy_directory(f.path, `${target}/${f.filename}`)
            } else {
                await FileSystem.cp(f.path, `${target}/${f.filename}`)
            }
        }
    }

    async generate_stats(path: string) {
        const ls = await FileSystem.statDir(path)
        let stats: { [id: string]: Stats } = {}
        for (let f of ls) {
            if (f.type == "directory") {
                stats[f.filename] = { value: await this.generate_stats(f.path), type: "directory", path:f.path }
            } else {
                stats[f.filename] = { type: "file", value: await FileSystem.hash(f.path, 'SHA-256'), path:f.path }
            }
        }
        return stats
    }

    async compare_and_copy_difference(startingStats: StatsDictionary, newStats: StatsDictionary, outputpath: string) {
        for (const k of Object.keys(newStats)) {
            if (newStats[k]?.type == 'directory') {
                if (
                    !startingStats[k] || 
                    typeof (startingStats[k].value) == "string" || 
                    typeof (newStats[k].value) == 'string'
                ) {
                    await this.copy_directory(newStats[k].path, `${outputpath}/${encodeURIComponent(k)}`)
                } else {
                    console.log("compare&copy")
                    await FileSystem.mkdir(`${outputpath}/${encodeURIComponent(k)}`)
                    this.compare_and_copy_difference(
                        startingStats[k].value,
                        newStats[k].value,
                        `${outputpath}/${encodeURIComponent(k)}`
                    )
                }
            } else if (!startingStats[k] || startingStats[k].value != newStats[k].value) {
                await FileSystem.cp(newStats[k].path, `${outputpath}/${encodeURIComponent(k)}`)
            }
        }
    }
}