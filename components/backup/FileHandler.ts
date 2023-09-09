import { FileSystem, Dirs } from "react-native-file-access"
import { AddedFileStat, Stats, compareStats } from "../utils";

export default class FileHandler {
    constructor() { }

    async folderTree(path: string, basedir:string): Promise<AddedFileStat[]> {
        if (!await FileSystem.exists(path) || !await FileSystem.isDir(path)) return [] as AddedFileStat[]
        let filesList: AddedFileStat[] = [];
        for (const f of await FileSystem.statDir(path)) {
            if (f.type == 'directory') {
                filesList = [...filesList, ...(await this.folderTree(f.path, basedir+f.filename+"/"))]
            } else {
                filesList.push({baseStat:f, foldertree:basedir})
            }
        }
        return filesList
    }

    async findClearableCacheFiles() {
        const cachableList: string[] = []
        for (const base of await FileSystem.statDir(Dirs.DocumentDir)) {
            for (const type of ["incremental", "full", "differential"]) {
                if (await FileSystem.exists(`${base.path}/${type}`)) {
                    const ls = await FileSystem.statDir(`${base.path}/${type}`)
                    const latest = (await this.findLatestFile(`${base.path}/${type}`)) || ""
                    for (let f of ls) {
                        if (f.path != latest) cachableList.push(f.path)
                    }
                }
            }
        }
        return cachableList
    }
    async getCacheSize() {
        let size = 0;
        for (const f of await this.findClearableCacheFiles()) {
            size += await this.findFolderSize(f)
        }
        return this.formatByteSize(size)
    }
    async clearCache() {
        const size = await this.getCacheSize()
        for (const f of await this.findClearableCacheFiles()) {
            await FileSystem.unlink(f)
        }
        console.log("TOTAL CACHE CLEARED: " + size)
        return size
    }

    formatByteSize(size: number): string {
        const ranges = [
            { size: 1024 * 1024 * 1024, tag: "GB" },
            { size: 1024 * 1024, tag: "MB" },
            { size: 1024, tag: "KB" },
        ]
        for (const r of ranges) {
            if (size > r.size) {
                return (size / r.size).toFixed(2) + r.tag
            }
        }
        return size + 'B'
    }

    async findFolderSize(path: string): Promise<number> {
        if (!await FileSystem.exists(path)) return 0
        if (!await FileSystem.isDir(path)) return (await FileSystem.stat(path))?.size || 0
        const ls = await FileSystem.statDir(path)
        let size = 0
        for (const f of ls) {
            size += (f.type == 'directory' ? await this.findFolderSize(f.path) : f.size)
        }
        return size
    }

    async createLocalPath(name: string, type: string, date: string) {
        const basepath = `${Dirs.DocumentDir}/${name}`
        if (!(await FileSystem.exists(`${basepath}`))) {
            await FileSystem.mkdir(`${basepath}`)
        }
        if (!(await FileSystem.exists(`${basepath}/${type}`))) {
            await FileSystem.mkdir(`${basepath}/${type}`)
        }
        if (await FileSystem.exists(`${basepath}/${type}/${date}`)) {
            await this.delete_folder(`${basepath}/${type}/${date}`)
        }
        await FileSystem.mkdir(`${basepath}/${type}/${date}`)
    }

    async findLatestFile(path: string) {
        if (!await FileSystem.exists(path) || !await FileSystem.isDir(path)) return null
        const ls = await FileSystem.statDir(path)
        let max = 0
        let maxpath = "";
        for (let f of ls) {
            
            if (f.type != "directory" && f.lastModified > max) {
                max = f.lastModified
                maxpath = f.path
            }
        }
        if(max==0 || maxpath=="") return null
        return maxpath
    }

    async getLatestFile(path: string) {
        const p = await this.findLatestFile(path)
        if (!p) return null
        return await FileSystem.readFile(p)
    }
    async delete_folder(path: string, onlyContent = false) {
        const ls = await FileSystem.statDir(path)
        for (let f of ls) {
            if (f.type == "directory") {
                await this.delete_folder(f.path)
            }
            await FileSystem.unlink(f.path)
        }
        if (!onlyContent) await FileSystem.unlink(path)
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
        const ls = await this.folderTree(path, "")
        let stats: Stats[] = []
        for (let i in ls) {
            stats.push({
                value: await FileSystem.hash(ls[i].baseStat.path, 'SHA-256'),
                keyName: i.toString(),
                type: ls[i].baseStat.type,
                path: ls[i].baseStat.path,
                filename: ls[i].baseStat.filename,
                lastModified: ls[i].baseStat.lastModified,
                size: ls[i].baseStat.size,
                foldertree: ls[i].foldertree
            })
        }
        return stats
    }
    isString(x: any): x is string {
        return typeof x === "string";
    }

    // returns all stats that are in newStat & not in initialStat
    statsDelta(initialStat: Stats[], newStat: Stats[]): Stats[] {
        let finalList = [] as Stats[]
        for (const a of newStat) {
            if (!initialStat.filter((b: Stats) => compareStats(a, b)).length) {
                finalList.push(a)
            }
        }
        return finalList
    }

    async moveStat(stats: Stats[], outputpath: string) {
        if (!await FileSystem.exists(outputpath) || !await FileSystem.isDir(outputpath))
            await FileSystem.mkdir(outputpath)
        for (const s of stats) {
            await FileSystem.cp(s.path, `${outputpath}/${s.keyName}`)
        }
    }
}