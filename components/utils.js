import { FileSystem, Dirs } from "react-native-file-access";
import { zip } from 'react-native-zip-archive';
import { encode} from 'base-64'
import AsyncStorage from "@react-native-async-storage/async-storage";


async function generate_stats(path){
    const ls = await FileSystem.statDir(path)
    let stats = {}
    for(let f of ls){
        if (f.type=="directory"){
            stats[f.filename] = {value: await generate_stats(f.path), type:"directory" }
        }else{
            stats[f.filename] = {type:"file", value: await FileSystem.hash(f.path, 'SHA-256')}
        }
    }
    return stats
}

// deleted -> everything that's in source and not in target
// added -> everything that's in target and not in source
function compare_stats(before_stats, after_stats){
    let final_stats = {added:{}, deleted:{}, files:after_stats}
    for(let file in before_stats){
        if(after_stats[file] != before_stats[file]){
            if(after_stats[file]["type"] == "directory"){
                compare_stats() // TODO: FINISH THIS
            }else{
                final_stats["deleted"][file] = before_stats[file]
            }
        }
    }
    for(let files in after_stats){
        if(after_stats[files] != before_stats[files]){
            final_stats["added"][files] = after_stats[files]
        }
    }
    return final_stats
}

async function get_server_url() {
    let url = await AsyncStorage.getItem("address")
    let signature = await AsyncStorage.getItem("signature")
    url = url.substring(1, url.length - 1)
    signature = signature.substring(1, signature.length - 1)
    return `${url}/${signature}`
}

async function login() {
    let username = await AsyncStorage.getItem("username");
    let password = await AsyncStorage.getItem("password");
    username = username.substring(1, username.length - 1)
    password = password.substring(1, password.length - 1)
    const url = await get_server_url()
    let res = await fetch(`${url}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: username, password: password })
    })
    if (!res.ok) {
        return ""
    }
    return await res.text()
}

async function start_upload(name, type, date, cookie) {
    const server_url = await get_server_url()
    let res = await fetch(`${server_url}/start/${name}/${type}/${date}`, {
        headers: {
            "Authorization": `Basic ${cookie}`
        }
    })

    return res.ok;
}

async function end_upload(name, type, date, cookie) {
    const server_url = await get_server_url()
    let res = await fetch(`${server_url}/end/${name}/${type}/${date}`, {
        headers: {
            "Authorization": `Basic ${cookie}`
        }
    })
    return res.ok;
}

async function upload(name, type, date, content_base64, filename, cookie) {
    const server_url = await get_server_url()
    let res = await fetch(`${server_url}/upload/${name}/${type}/${date}`, {
        "method": "POST",
        "headers": {
            "Authorization": `Basic ${cookie}`,
            "Content-Type": "application/json"
        },
        "body": JSON.stringify({ filename: filename, file: content_base64 })
    })
    return res.ok
}

async function delete_folder(path) {
    const ls = await FileSystem.statDir(path)
    for (let f of ls) {
        if (f.type == "directory") {
            await delete_folder(f.path)
        }
        await FileSystem.unlink(f.path)
    }
}

async function copy_directory(source, target) {
    if (await FileSystem.exists(target)) {
        await delete_folder(target)
    }
    await FileSystem.mkdir(target)
    const ls = await FileSystem.statDir(source)
    for (let f of ls) {
        if (f.type == "directory") {
            await copy_directory(f.path, target + "/" + f.filename)
        } else {
            await FileSystem.cp(f.path, target + "/" + f.filename)
        }
    }
}

async function upload_full(path) {
    try {
        const c = await login()
        let signature = await AsyncStorage.getItem("signature")
        signature = signature.substring(1, signature.length - 1)
        let d = new Date();
        d = d.toISOString()
        const date = d.substring(0, d.length - 2);
        let n = path.split("%3A");
        const name = n[n.length - 1]
        let status = await start_upload(name, "full", date, c)
        if (!status) {
            return false;
        }
        if (!(await FileSystem.exists(`${Dirs.DocumentDir}/full`))) {
            await FileSystem.mkdir(`${Dirs.DocumentDir}/full`)
        }
        if (await FileSystem.exists(`${Dirs.DocumentDir}/full/${date}`)) {
            await delete_folder(`${Dirs.DocumentDir}/full/${date}`)
        }
        await FileSystem.mkdir(`${Dirs.DocumentDir}/full/${date}`)
        console.log("GENSTATUS")
        const stats = await generate_stats(path)
        console.log(stats)
        let base64_stats = encode(JSON.stringify(stats))
        let upload_stats_res = await upload(name, "full", date, base64_stats, `.${signature}`, c)
        if (!upload_stats_res) {
            return false;
        }
        await copy_directory(path, `${Dirs.DocumentDir}/full/${date}/tmp`)
        await zip(`${Dirs.DocumentDir}/full/${date}/tmp`, `${Dirs.DocumentDir}/full/${date}/${date}.zip`)
        let f = await FileSystem.readFile(`${Dirs.DocumentDir}/full/${date}/${date}.zip`, 'base64')
        let res_upload = await upload(name, "full", date, f, `${date}.zip`, c)
        if (!res_upload) {
            return false;
        }

        return await end_upload(name, "full", date, c)

    } catch (e) {
        console.warn(e)
    }
    return false
}

export { upload_full }