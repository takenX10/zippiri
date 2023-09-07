

export default class ServerInteractor {
    url:string;
    username:string;
    server_url:string;
    password:string;
    signature:string;
    date:string;
    name:string;
    type:string;
    cookie:string;
    constructor(url:string, signature:string, username:string, password:string, date:string, name:string, type:string) {
        this.server_url = `${url}/${signature}`
        this.cookie =""
        this.url = url
        this.username = username
        this.password = password
        this.signature = signature
        this.date = date
        this.name = name
        this.type = type
        this.login()
    }
    async checkServer (){
        try {
            const res = await fetch(this.server_url);
            if (!res.ok) {
                return false
            }
            const j = await res.text()
            return j == `ok:${this.signature}`
        } catch (e) {
            console.log(e)
            return false
        }
    }
    async login() {
        try{
            const res = await fetch(`${this.server_url}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username: this.username, password: this.password })
            })
            if (res.ok) {
                this.cookie = await res.text()
            }
        }catch(err){
            console.log(err)
            return
        }
    }

    async start_upload() {
        try{
            let res = await fetch(`${this.server_url}/start/${this.name}/${this.type}/${this.date}`, {
                headers: {
                    "Authorization": `Basic ${this.cookie}`
                }
            })
            return res.ok;
        }catch(err){
            console.log(err)
            return false;
        }
    }

    async end_upload() {
        try{
            const res = await fetch(`${this.server_url}/end/${this.name}/${this.type}/${this.date}`, {
                headers: {
                    "Authorization": `Basic ${this.cookie}`
                }
            })
            return res.ok;
        }catch(err){
            console.log(err)
            return false;
        }
    }

    async upload(content_base64:string, filename:string) {
        try{
            const res = await fetch(`${this.server_url}/upload/${this.name}/${this.type}/${this.date}`, {
                "method": "POST",
                "headers": {
                    "Authorization": `Basic ${this.cookie}`,
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({ filename: filename, file: content_base64 })
            })
            return res.ok
        }catch(err){
            console.log(err);
            return false;
        }
    }
}