import threading, time, os, logging,datetime, shutil, json

SIGNATURE : str = "123948759"
BASEDIR : str = "sync"
DATE_DIFFERENCE : int = 15
backup_name_list : list[str] = []

logging.getLogger().setLevel(logging.INFO)

# PARAM: f (str) -> the date to check
# Return: True if f < current_date - DATE_DIFFERENCE else false
check_date = lambda f: datetime.datetime.now() - datetime.timedelta(days=DATE_DIFFERENCE) > \
                    datetime.datetime.fromisoformat(f)

def remove_empty_folders(path):
    folders = list(os.walk(path))[1:]
    for folder in folders:
        if not folder[2]:
            os.rmdir(folder[0])

def move_backup(backup_name, origin, destination):
    starting_path = f"{BASEDIR}/{backup_name}/incremental"
    difference_json : dict = {}
    with open(f"{starting_path}/{destination}/.{SIGNATURE}", "r") as f:
        difference_json = json.load(f)
    print(difference_json)
    for d in difference_json["deleted"]:
        shutil.rmtree(f"{starting_path}/{origin}/{d}")
    remove_empty_folders(f"{starting_path}/{origin}")
    # Merge the two folders
    shutil.copytree(f"{starting_path}/{destination}", f"{starting_path}/{origin}")
    # Clean up the destination
    shutil.rmtree(f"{starting_path}/{destination}")

    # Copy origin into destination
    shutil.copytree(f"{starting_path}/{origin}", f"{starting_path}/{destination}")
    # remove origin
    shutil.rmtree(f"{starting_path}/{origin}")

        

# False -> no dependecies
# True -> dependencies
def check_dependencies(backup_name, date):
    if backup_name not in os.listdir(BASEDIR):
        return False
    if "differential" not in os.listdir(f"{BASEDIR}/{backup_name}"):
        return True
    for differential_date in os.listdir(f"{BASEDIR}/{backup_name}/differential"):
        try:
            with open(f"{BASEDIR}/{backup_name}/differential/{differential_date}/.{SIGNATURE}", "r") as f:
                if date in f.readlines():
                    return False
        except Exception as e:
            logger.error(e)
        return True

def delete_full():
    while True:
        time.sleep(5)
        try:
            for backup_name in backup_name_list:
                dates_list = os.listdir(f"{BASEDIR}/{backup_name}/full")
                dates_list.sort()
                for date in dates_list:
                    if check_date(date) and check_dependencies(backup_name, date):
                        logging.info(f"Removing backup: {backup_name}/full/{date}")
                        shutil.rmtree(f"{BASEDIR}/{backup_name}/full/{date}")
        except Exception as e:
            logging.error(e)
                    


def delete_differential():
    while True:
        time.sleep(5)
        try:
            for backup_name in backup_name_list:
                dates_list = os.listdir(f"{BASEDIR}/{backup_name}/differential")
                dates_list.sort()
                for date in dates_list:
                    if check_date(date):
                        logging.info(f"Removing backup: {backup_name}/differential/{date}")
                        shutil.rmtree(f"{BASEDIR}/{backup_name}/differential/{date}")
        except Exception as e:
            logging.error(e)


def delete_incremental():
    while True:
        try:
            for backup_name in backup_name_list:
                dates_list = os.listdir(f"{BASEDIR}/{backup_name}/incremental")
                dates_list.sort()
                for k, date in enumerate(dates_list):
                    if check_date(date) and k < len(dates_list) - 1:
                        move_backup(backup_name, dates_list[k], dates_list[k+1])
                        logging.info(f"Removing backup: {backup_name}/incremental/{date}")
                        shutil.rmtree(f"{BASEDIR}/{backup_name}/incremental/{date}")
        except Exception as e:
            logging.error(e)
        time.sleep(5)


def main():
    global backup_name_list
    backup_name_list = os.listdir(BASEDIR)
    delete_incremental()

if __name__ == "__main__":
    main()