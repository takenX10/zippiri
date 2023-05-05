import threading, time, os, logging,datetime, shutil

SIGNATURE : str = "123948759"
BASEDIR : str = "sync"
DATE_DIFFERENCE : int = 30
backup_name_list : list[str] = []

logging.getLogger().setLevel(logging.INFO)

# PARAM: f (str) -> the date to check
# Return: True if f < current_date - DATE_DIFFERENCE else false
check_date = lambda f: datetime.datetime.now() - datetime.timedelta(days=DATE_DIFFERENCE) > \
                    datetime.datetime.fromisoformat(f)


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
        for backup_name in backup_name_list:
            dates_list = os.listdir(f"{BASEDIR}/{backup_name}/full")
            dates_list.sort()
            for date in dates_list:
                if check_date(date) and check_dependencies(backup_name, date):
                    logging.info(f"Removing backup: {backup_name}/full/{date}")
                    shutil.rmtree(f"{BASEDIR}/{backup_name}/full/{date}")
                    
        time.sleep(5)



def main():
    global backup_name_list
    backup_name_list = os.listdir(BASEDIR)
    delete_full()

if __name__ == "__main__":
    main()