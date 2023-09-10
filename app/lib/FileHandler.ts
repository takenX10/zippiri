import { FileSystem, Dirs } from "react-native-file-access"
import { compareStats } from "./utils";
import {ZippiriFileStat } from "./types";
import { FrequencyKey, byteRanges } from "./constants";

export default class FileHandler {
    constructor() { }

    // Returns a list of File stats from a folder
    async recursiveListFiles(path: string, basedir:string = ""): Promise<ZippiriFileStat[]> {
        if (!await FileSystem.exists(path) || !await FileSystem.isDir(path)) return [] as ZippiriFileStat[]
        let filesList: ZippiriFileStat[] = [];
        for (const f of await FileSystem.statDir(path)) {
            if (f.type == 'directory') {
                filesList = [...filesList, ...(await this.recursiveListFiles(f.path, basedir+f.filename+"/"))]
            } else {
                filesList.push({...f, foldertree:basedir, value:"", keyName:""})
            }
        }
        return filesList
    }

    async findClearableCacheFiles() {
        const cachableList: string[] = []
        for (const base of await FileSystem.statDir(Dirs.DocumentDir)) {
            for (const [k, type] of Object.entries(FrequencyKey)) {
                if (await FileSystem.exists(`${base.path}/${type}`) && await FileSystem.isDir(`${base.path}/${type}`)) {
                    const ls = await FileSystem.statDir(`${base.path}/${type}`)
                    for (let f of ls) {
                        cachableList.push(f.path)
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
        for (const r of byteRanges) {
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

    async createLocalPath(name: string, type: FrequencyKey, date: string) {
        const basepath = `${Dirs.DocumentDir}/${name}`
        if (!(await FileSystem.exists(`${basepath}`))) {
            await FileSystem.mkdir(`${basepath}`)
        }
        if (!(await FileSystem.exists(`${basepath}/${type}`))) {
            await FileSystem.mkdir(`${basepath}/${type}`)
        }
        if (await FileSystem.exists(`${basepath}/${type}/${date}`)) {
            await FileSystem.unlink(`${basepath}/${type}/${date}`)
        }
        await FileSystem.mkdir(`${basepath}/${type}/${date}`)
    }

    async generate_stats(path: string) {
        const ls = await this.recursiveListFiles(path)
        let stats: ZippiriFileStat[] = []
        for (let i in ls) {
            stats.push({
                value: await FileSystem.hash(ls[i].path, 'SHA-256'),
                keyName: i.toString(),
                type: ls[i].type,
                path: ls[i].path,
                filename: ls[i].filename,
                lastModified: ls[i].lastModified,
                size: ls[i].size,
                foldertree: ls[i].foldertree
            })
        }
        return stats
    }

    // returns all stats that are in newStat & not in initialStat
    statsDelta(initialStat: ZippiriFileStat[], newStat: ZippiriFileStat[]): ZippiriFileStat[] {
        let finalList = [] as ZippiriFileStat[]
        for (const a of newStat) {
            if (!initialStat.filter((b: ZippiriFileStat) => compareStats(a, b)).length) {
                finalList.push(a)
            }
        }
        return finalList
    }
}