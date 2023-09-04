import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dispatch, SetStateAction } from "react";

const validImageExtensions = ["jpg", "jpeg", "png"]

async function getPathList(setter:Dispatch<SetStateAction<string[]>>) {
    try {
        const fl = await AsyncStorage.getItem("folderList")
        if(!fl){
            setter([])
            return
        }
        const folders = JSON.parse(fl)
        if (folders != null) {
            setter(folders)
            return
        }
    } catch (e) {
        console.log(e)
    }
    setter([])
}


export {getPathList, validImageExtensions }