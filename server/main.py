import os, secrets, shutil, logging, base64, json
import datetime
from functools import wraps
import tarfile
from flask import Flask, request, make_response, jsonify

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


def is_dir(path: str):
    return os.path.exists(path) and os.path.isdir(path)


def is_file(path: str):
    return os.path.exists(path) and os.path.isfile(path)

def check_finish(path: str) -> bool:
    if (
        not is_dir(path)
        or not is_file(f"{path}/.{SIGNATURE}")
        or is_file(f"{path}/{SIGNATURE}")
        or len(os.listdir(path))<2
    ):
        return False
    return True

def make_tarfile(output_filename, source_dir, taropen):
    with tarfile.open(output_filename, taropen) as tar:
        tar.add(source_dir, arcname=os.path.basename(source_dir))


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
        if(f".{SIGNATURE}" not in l):
            return make_response("Missing stats", 400)
        os.makedirs(f"{end_backup_dir}/upload", exist_ok=True)
        with open(f"{end_backup_dir}/.{SIGNATURE}", "r") as f:
            parsed_stats = json.load(f)
            if("compression" not in parsed_stats):
                return make_response("Missing compression in stats", 400)
            if(parsed_stats["compression"] != "zip"):
                if(parsed_stats["compression"] == "tar"):
                    make_tarfile(f"{end_backup_dir}/{date}.tar",f"{end_backup_dir}/upload", "x")
                elif(parsed_stats["compression"] == "gzip"):
                    make_tarfile(f"{end_backup_dir}/{date}.tar.gz", f"{end_backup_dir}/upload", "x:gz")
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

def get_latest_date(path:str) -> str|None:
    print(path)
    if(not os.path.exists(path) or not os.path.isdir(path)):
        return None
    max = None
    for f in os.listdir(path):
        if is_dir(f"{path}/{f}") and check_finish(f"{path}/{f}") and (max ==None or max < f):
           max = f
    return max

@app.route(f"/{SIGNATURE}/stats/<backup_name>/<backup_type>", methods = ['GET'])
@check_token()
def stats(backup_name, backup_type):
    try:
        basepath = f"{BASEDIR}/{backup_name}/{backup_type if backup_type != 'differential' else 'full'}"
        latest = get_latest_date(basepath)
        if(latest == None):
            return make_response("No old backup of this type", 400)
        with open(f"{basepath}/{latest}/.{SIGNATURE}", "r") as f:
            j = json.load(f)
            return jsonify(j)
    except Exception as e:
        logging.error(e)
    return make_response("ERROR", 400)

def main():
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)

if __name__ == "__main__":
    main()