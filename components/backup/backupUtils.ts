import AsyncStorage from '@react-native-async-storage/async-storage';


async function storageGetter(itemTag:string): Promise<string | null>{
    const i = await AsyncStorage.getItem(itemTag)
    if(!i) return null
    return i.substring(1, i.length -1)
}
/*
// deleted -> everything that's in source and not in target
// added -> everything that's in target and not in source
function compare_stats(before_stats, after_stats) {
    let final_stats = { added: {}, deleted: {}, files: after_stats }
    for (let file in before_stats) {
        if (after_stats[file] != before_stats[file]) {
            if (after_stats[file]["type"] == "directory") {
                compare_stats() // TODO: FINISH THIS
            } else {
                final_stats["deleted"][file] = before_stats[file]
            }
        }
    }
    for (let files in after_stats) {
        if (after_stats[files] != before_stats[files]) {
            final_stats["added"][files] = after_stats[files]
        }
    }
    return final_stats
}

*/


export {
    storageGetter
}