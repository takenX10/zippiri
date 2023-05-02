import requests
import datetime
import time

SIGNATURE = "123948759"
USERNAME : str = "admin"
PASSWORD : str = "idk"
URL = "http://127.0.0.1:5000"

s = requests.session()


def login():
    r = s.post(f"{URL}/{SIGNATURE}/login", headers={'Content-Type':'application/json'}, json={"username":USERNAME, "password":PASSWORD})
    print(r.headers)
    return r.text


r = s.get(f"{URL}/{SIGNATURE}")
print(r.text)

login()

r = s.get(f"{URL}/{SIGNATURE}")
print(r.text)


files = {'file': open('test.txt','rb')}
values = {'DB': 'photcat', 'OUT': 'csv', 'SHORT': 'short'}

r = s.post(f"{URL}/{SIGNATURE}/upload", files=files)