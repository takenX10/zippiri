import os, tarfile, json, shutil
import zipfile

BASEDIR: str = "sync"
SIGNATURE: str = "123948759"


def check_finish(path: str):
    errormsg = f"The backup: {path} is broken, unable to continue"
    try:
        ls = os.listdir(path)
        if len(ls) < 2 or SIGNATURE in ls or f".{SIGNATURE}" not in ls:
            print(errormsg)
            exit()
    except:
        print(errormsg)
        exit()


def get_compression(path: str) -> str:
    return get_stats(path)["compression"]


def extract_tar(inputpath: str, outputpath: str, type: str):
    with tarfile.open(inputpath, type) as tar:
        tar.extractall(path=outputpath)


def extract_zip(inputpath: str, outputpath: str):
    with zipfile.ZipFile(inputpath, "r") as zip_ref:
        zip_ref.extractall(outputpath)


def get_stats(path: str) -> str:
    with open(path, "r") as f:
        parsed_stats = json.load(f)
        if "compression" not in parsed_stats:
            print("Stats are broken")
            exit()
        return parsed_stats


def move_first(source, dest, date, stats):
    shutil.rmtree(source)
    os.makedirs(source, exist_ok=True)
    os.makedirs(dest, exist_ok=True)
    if stats["compression"] == "tar":
        shutil.rmtree(dest + "/upload")
        extract_tar(f"{source}/{date}.tar", dest, "r:")
    elif stats["compression"] == "gzip":
        extract_tar(f"{source}/{date}.tar.gz", dest, "r:gz")
    elif stats["compression"] == "zip":
        os.makedirs(f"{dest}/upload", exist_ok=True)
        extract_zip(f"{source}/{date}.zip", f"{dest}/upload")
    outputbase = dest + "/output"
    os.makedirs(outputbase, exist_ok=True)
    for file in stats["currentList"]:
        print("FILE", file)
        os.makedirs(f"{outputbase}/{file['foldertree']}", exist_ok=True)
        shutil.move(
            f"{dest}/upload/{file['keyName']}",
            f"{outputbase}/{file['foldertree']}{file['filename']}",
        )


def merge(source, dest, date):
    check_finish(source)
    stats = get_stats(f"{source}/.{SIGNATURE}")
    os.makedirs(source, exist_ok=True)
    os.makedirs(dest, exist_ok=True)
    if os.path.isdir(f"{dest}/upload"):
        shutil.rmtree(dest + "/upload")
    if stats["compression"] == "tar":
        extract_tar(f"{source}/{date}.tar", dest, "r:")
    elif stats["compression"] == "gzip":
        extract_tar(f"{source}/{date}.tar.gz", dest, "r:gz")
    elif stats["compression"] == "zip":
        os.makedirs(f"{dest}/upload", exist_ok=True)
        extract_zip(f"{source}/{date}.zip", f"{dest}/upload")
    outputbase = dest + "/output"
    os.makedirs(outputbase, exist_ok=True)
    for file in stats["removed"]:
        print("Remove", file["filename"])
        os.remove(f"{outputbase}/{file['foldertree']}{file['filename']}")
        if len(os.listdir(f"{outputbase}/{file['foldertree']}")) == 0:
            os.rmdir(f"{outputbase}/{file['foldertree']}")
    for file in stats["added"]:
        print("add", file["filename"])
        os.makedirs(f"{outputbase}/{file['foldertree']}", exist_ok=True)
        shutil.move(
            f"{dest}/upload/{file['keyName']}",
            f"{outputbase}/{file['foldertree']}{file['filename']}",
        )


def get_user_input(
    thislist: list[str], initialtext: str, inputtext: str, errortext: str
) -> int:
    if len(thislist) == 0:
        print(errortext)
        return
    thislist.sort()
    while True:
        print(initialtext + "\n")
        for k, b in enumerate(thislist):
            print(f"{k+1}- {b}")
        print()
        userinput = input(inputtext)
        print()
        userinput = int(userinput) - 1
        if userinput >= 0 and userinput < len(thislist):
            return thislist[userinput]


def main():
    name = get_user_input(
        os.listdir(BASEDIR),
        "Choose the backup folder you want to extract",
        "Insert backup number: ",
        "No backups available",
    )
    type = get_user_input(
        os.listdir(f"{BASEDIR}/{name}"),
        "Choose the backup type",
        "Insert type number: ",
        f"No backup types of {name} available",
    )
    date = get_user_input(
        os.listdir(f"{BASEDIR}/{name}/{type}"),
        "Choose the backup date",
        "Insert date number: ",
        f"No backup dates of {name} - {type} available",
    )
    output_path = input("Insert output folder: ")
    if type == "full":
        merge(f"{BASEDIR}/{name}/full/{date}", output_path, date)
    elif type == "incremental":
        ls = os.listdir(f"{BASEDIR}/{name}/incremental")
        ls.sort()
        for f in ls:
            if f <= date:
                merge(f"{BASEDIR}/{name}/incremental/{f}", output_path, f)
    elif type == "differential":
        ls = os.listdir(f"{BASEDIR}/{name}/full")
        max = None
        for v in ls:
            if v < date and (max == None or v > max):
                max = v
        if max != None:
            merge(f"{BASEDIR}/{name}/full/{max}", output_path, max)

        merge(f"{BASEDIR}/{name}/differential/{date}", output_path, date)


if __name__ == "__main__":
    main()