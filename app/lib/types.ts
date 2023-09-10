import { FileStat } from "react-native-file-access";

export type FrequencyKeys = 'incremental' | 'differential' | 'full'

export type FrequencyValueEnum = 'none' | 'hourly' | 'daily' | 'weekly' | 'monthly'

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

export type CompressionEnum =  'zip'|'tar'|'gzip'

export type SettingEnum = 
"folderList"|"full"|"compression"|"folderList"|
"phonedata"|"address"|"signature"|"username"|
"password"|"wifissid"|"wifi"|'incremental'|'differential';

export interface SavedStats {
    date: string;
    added: Stats[];
    removed: Stats[];
    currentList: Stats[];
    compression: string;
}