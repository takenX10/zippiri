import os, tarfile, json, shutil
import zipfile

BASEDIR: str = "sync"
SIGNATURE: str = "123948759"


def is_dir(path: str):
    return os.path.exists(path) and os.path.isdir(path)


def is_file(path: str):
    return os.path.exists(path) and os.path.isfile(path)

def remove_backup(path:str, printlog=True):
    flag = False
    if(is_dir(path)):
        flag = True
        shutil.rmtree(path)
    elif(is_file(path)):
        flag = True
        os.remove(path)
    if(printlog and flag):
        print(f"Removing {path}")
    if(not flag):
        print(f"Unable to remove {path}")

def check_finish(path: str) -> bool:
    if (
        not is_dir(path)
        or not is_file(f"{path}/.{SIGNATURE}")
        or is_file(f"{path}/{SIGNATURE}")
        or len(os.listdir(path))<2
    ):
        return False
    return True

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


def find_dependant_full(full_dir: str, differential_date: str) -> str | None:
    if not is_dir(full_dir):
        return None
    ls = os.listdir(full_dir)
    max = None
    for f in ls:
        if f < differential_date and (max == None or f > max):
            max = f
    return max


def get_dependents_differential(backup_name: str, backup_date: str) -> list[str]:
    differential_dir = f"{BASEDIR}/{backup_name}/differential"
    full_dir = f"{BASEDIR}/{backup_name}/full"
    if not is_dir(differential_dir):
        return []  # should never reach this point
    ls = os.listdir(differential_dir)
    retlist: list[str] = []
    for f in ls:
        full = find_dependant_full(full_dir, f)
        if full == backup_date:
            retlist.append(f)
    return retlist


def main():
    os.makedirs(BASEDIR, exist_ok=True)
    options = [
        "Clear all broken backups",
        "delete a specific backup",
    ]

    selected = get_user_input(
        options, "What do you want to do", "Insert option number:", ""
    )

    if selected == options[0]:
        for name in os.listdir(BASEDIR):
            for type in os.listdir(f"{BASEDIR}/{name}"):
                if is_dir(f"{BASEDIR}/{name}/{type}"):
                    for date in os.listdir(f"{BASEDIR}/{name}/{type}"):
                        p = f"{BASEDIR}/{name}/{type}/{date}"
                        if not check_finish(p):
                            remove_backup(p)
        print("Done!")
    elif selected == options[1]:
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
        if type == "differential":
            remove_backup(f"{BASEDIR}/{name}/{type}/{date}")
        elif type == "incremental":
            answer = input(
                "Every backup from that date until today will be removed, continue (y/n)?"
            )
            if answer.lower() == "y":
                ls = os.listdir(f"{BASEDIR}/{name}/incremental")
                ls.sort()
                for f in ls:
                    if f >= date:
                        remove_backup(f"{BASEDIR}/{name}/incremental/{f}")
            else:
                print("Deletion aborted")
        elif type == "full":
            differential_list = get_dependents_differential(name, date)
            answer = "y"
            if len(differential_list) > 0:
                print("By removing this backup you are going to remove also:")
                for f in differential_list:
                    print(f"- {name}/differential/{f}")
                answer = input(
                    "Every backup from that date until today will be removed, continue (y/n)?"
                )
            if answer.lower() == "y":
                for f in differential_list:
                    remove_backup(f"{BASEDIR}/{name}/differential/{f}")
                remove_backup(f"{BASEDIR}/{name}/full/{date}")
            else:
                print("Deletion aborted")

if __name__ == "__main__":
    main()
