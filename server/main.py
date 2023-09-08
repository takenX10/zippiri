import re, os, secrets, shutil, logging, base64
import datetime
from functools import wraps
from flask import Flask, request, make_response

logging.getLogger().setLevel(logging.INFO)

app = Flask(__name__)

SIGNATURE : str = "123948759"
USERNAME : str = "admin"
PASSWORD : str = "idk"
COOKIE_NAME : str = "AUTHTOKEN"
BASEDIR : str = "sync"

authorized_tokens = {}

checkdate = lambda before: datetime.datetime.now() - before < datetime.timedelta(hours=24)

valid_token = lambda t: t != None and t in authorized_tokens.keys()

def clean_tokens():
    for k in authorized_tokens.keys():
        if not valid_token(authorized_tokens[k]):
            authorized_tokens[k] = None

def check_token():
    def _check_token(f):
        @wraps(f)
        def __check_token(*args, **kwargs):
            token = request.headers.get("Authorization").split(" ")[1]
            print(token)
            if valid_token(token):
                if checkdate(authorized_tokens[token]):
                    return f(*args, **kwargs)
                else:
                    clean_tokens()
            resp = make_response("WRONG COOKIE", 400)
            resp.set_cookie(COOKIE_NAME, '')
            return resp

        return __check_token
    return _check_token

def get_token() -> str:
    return secrets.token_hex(16)

@app.route(f"/", methods=["GET"])
def simple_ping():
    return ""

@app.route(f"/{SIGNATURE}", methods=["GET"])
def get_signature():
    return "ok:"+SIGNATURE

@app.route(f"/{SIGNATURE}/login", methods=["POST"])
def login():
    usr : str = request.json.get("username")
    psw :str= request.json.get("password")
    if usr == USERNAME and psw == PASSWORD:
        t = get_token()
        authorized_tokens[t] = datetime.datetime.now()
        res = make_response("", 200)
        res.set_cookie(COOKIE_NAME, t)
        return make_response(t, 200)
    else:
        return make_response("",403)

@app.route(f"/{SIGNATURE}/start/<backup_name>/<backup_type>/<date>", methods = ['GET'])
@check_token()
def start_upload(backup_name, backup_type, date):
    start_backup_dir = f"{BASEDIR}/{backup_name}/{backup_type}/{date}"
    os.makedirs(start_backup_dir, exist_ok=True)
    l = os.listdir(start_backup_dir)
    if SIGNATURE in l:
        logging.info("directory was not empty, restarting")
        shutil.rmtree(start_backup_dir)
        os.makedirs(start_backup_dir)
    with open(f"{start_backup_dir}/{SIGNATURE}", "w") as f:
        f.write("")
    return ""

@app.route(f"/{SIGNATURE}/end/<backup_name>/<backup_type>/<date>", methods = ['GET'])
@check_token()
def end_upload(backup_name, backup_type, date):
    end_backup_dir = f"{BASEDIR}/{backup_name}/{backup_type}/{date}"
    try:
        l = os.listdir(end_backup_dir)
        if SIGNATURE in l:
            os.remove(f"{end_backup_dir}/{SIGNATURE}")
    except Exception as e:
        logging.error(e)
    return ""

@app.route(f"/{SIGNATURE}/upload/<backup_name>/<backup_type>/<date>", methods = ['POST'])
@check_token()
def upload(backup_name, backup_type, date):
    try:
        upload_backup_dir = f"{BASEDIR}/{backup_name}/{backup_type}/{date}"
        file_base64 : str = request.json.get("file")
        filename : str = request.json.get("filename")
        path : str = request.json.get("path")
        if path == None or file_base64 == None or filename == None or file_base64=="" or filename == "":
            return make_response("WRONG PARAMETERS", 400)
        decoded = base64.b64decode(file_base64)
        
        if(filename != path):
            path = path.replace("/"+filename, "")
            os.makedirs(f"{upload_backup_dir}/{path}",exist_ok=True)
            path = path+"/"+filename
        
        with open(f"{upload_backup_dir}/{path}", 'wb') as f:
            f.write(decoded)
        return make_response("",200)
    except Exception as e:
        logging.error(e)
    return make_response("ERROR", 400)

@app.route(f"/{SIGNATURE}/status/<backup_name>/<backup_type>/<date>", methods = ['GET'])
@check_token()
def status(backup_name, backup_type, date):
    try:
        upload_backup_dir = f"{BASEDIR}/{backup_name}/{backup_type}/{date}"
        l = os.listdir(upload_backup_dir)
        if SIGNATURE in l:
            return make_response("NOT ENDED", 400)
        return make_response("",200)
    except Exception as e:
        logging.error(e)
    return make_response("ERROR", 400)

def main():
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)

if __name__ == "__main__":
    main()