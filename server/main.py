import re, os, secrets
import datetime
from functools import wraps
from flask import Flask, request, make_response

app = Flask(__name__)

SIGNATURE : str = "123948759"
USERNAME : str = "admin"
PASSWORD : str = "idk"
COOKIE_NAME : str = "AUTHTOKEN"

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
            token = request.cookies.get(COOKIE_NAME)
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

@app.route(f"/{SIGNATURE}", methods=["GET"])
@check_token()
def get_signature():
    return SIGNATURE

@app.route(f"/{SIGNATURE}/login", methods=["POST"])
def login():
    usr : str = request.json.get("username")
    psw :str= request.json.get("password")
    if usr == USERNAME and psw == PASSWORD:
        t = get_token()
        authorized_tokens[t] = datetime.datetime.now()
        res = make_response("", 200)
        res.set_cookie(COOKIE_NAME, t)
        return res
    else:
        return make_response("",403)

@app.route(f"/{SIGNATURE}/upload", methods = ['POST'])  
@check_token()
def success():  
    if request.method == 'POST':  
        f = request.files['file']
        f.save("tmp/"+f.filename)
        return make_response("",200)


def main():
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)

if __name__ == "__main__":
    main()