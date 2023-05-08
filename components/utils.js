import { FileSystem, Dirs } from "react-native-file-access";
import { zip } from 'react-native-zip-archive';
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    console.log(`COPYING ${source} ${target}`)
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
        let d = new Date();
        d = d.toISOString()
        const date = d.substring(0, d.length - 2);
        let n = path.split("%3A");
        const name = n[n.length - 1]
        console.log(date, name)
        let status = await start_upload(name, "full", date, c)
        console.log(status)
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

        console.log("made the directory")
        await copy_directory(path, `${Dirs.DocumentDir}/full/${date}/tmp`)
        console.log("Directory copied")
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