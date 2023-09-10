export const toSeconds: { [id: string]: number } = {
    "none": 0,
    "hourly": 60 * 60,
    "daily": 60 * 60 * 24,
    "weekly": 60 * 60 * 24 * 7,
    "monthly": 60 * 60 * 24 * 30,
}

export const sourceFromDest = {
    incremental: 'incremental',
    differential: 'full',
    full: ''
}

export const validImageExtensions = ["jpg", "jpeg", "png"]

export const frequencyList = [ 
    { label: 'none', value: 'none' },
    { label: 'hourly', value: 'hourly' },
    { label: 'daily', value: 'daily' },
    { label: 'weekly', value: 'weekly' },
    { label: 'monthly', value: 'monthly' }
];

export const compressionList = [
    { label: 'zip', value: 'zip' },
    { label: 'tar', value: 'tar' },
    { label: 'gzip', value: 'gzip' },
]