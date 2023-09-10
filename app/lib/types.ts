

export type SettingKey = 
"folderList"|"full"|"compression"|"folderList"|
"phonedata"|"address"|"signature"|"username"|
"password"|"wifissid"|"wifi"|'incremental'|'differential';

export interface ZippiriFileStat {
    path: string;
    type: 'directory'|'file';
    value: string;
    keyName: string;
    filename: string;
    lastModified: number;
    size: number;
    foldertree: string;
}

export interface SavedStats {
    date: string;
    added: ZippiriFileStat[];
    removed: ZippiriFileStat[];
    currentList: ZippiriFileStat[];
    compression: string;
}

export interface BackupStatus {
    full: boolean;
    differential: boolean;
    incremental: boolean;
}

export interface InternetStatus {
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