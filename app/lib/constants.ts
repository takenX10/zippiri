export const toSeconds:{[key in FrequencyValue]?:number} = {
    none:0,
    hourly:60*60,
    daily:60*60*24,
    weekly:60*60*24*7,
    monthly:60*60*24*30,

}

export enum Compression {
    zip='zip',
    tar='tar',
    gzip='gzip'
}

export enum FrequencyKey {
    incremental = 'incremental',
    differential = 'differential',
    full = 'full'
}

export enum FrequencyValue {
    none='none',
    hourly='hourly',
    daily='daily',
    weekly='weekly',
    monthly='monthly'
}

export const validImageExtensions = ["jpg", "jpeg", "png"]

export const byteRanges = [
    { size: 1024 * 1024 * 1024, tag: "GB" },
    { size: 1024 * 1024, tag: "MB" },
    { size: 1024, tag: "KB" },
]