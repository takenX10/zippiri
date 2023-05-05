import requests
import datetime
import time

SIGNATURE = "123948759"
USERNAME : str = "admin"
PASSWORD : str = "idk"
URL = "http://127.0.0.1:5000"

DATE = "2023-05-05:17:02"
s = requests.session()


def login():
    r = s.post(f"{URL}/{SIGNATURE}/login", headers={'Content-Type':'application/json'}, json={"username":USERNAME, "password":PASSWORD})
    return r.text


login()

### status
r = s.get(f"{URL}/{SIGNATURE}/status/{USERNAME}/full/{DATE}")
print("STATUS: ", r.status_code, r.text)

### start upload
r = s.get(f"{URL}/{SIGNATURE}/start/{USERNAME}/full/{DATE}")
print("START: ", r.status_code, r.text)

### status
r = s.get(f"{URL}/{SIGNATURE}/status/{USERNAME}/full/{DATE}")
print("STATUS: ", r.status_code, r.text)

### upload
files = {'file': open('test.txt','rb')}
values = {'DB': 'photcat', 'OUT': 'csv', 'SHORT': 'short'}
r = s.post(f"{URL}/{SIGNATURE}/upload/{USERNAME}/full/{DATE}", files=files)
print("FILE UPLOAD RESPONSE: ", r.status_code, r.text)

### status
r = s.get(f"{URL}/{SIGNATURE}/status/{USERNAME}/full/{DATE}")
print("STATUS: ", r.status_code, r.text)

### end upload
r = s.get(f"{URL}/{SIGNATURE}/end/{USERNAME}/full/{DATE}")
print("END: ", r.status_code, r.text)

### status
r = s.get(f"{URL}/{SIGNATURE}/status/{USERNAME}/full/{DATE}")
print("STATUS: ", r.status_code, r.text)