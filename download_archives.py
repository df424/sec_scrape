# %%
import os
import time
import requests
from tqdm import tqdm

BASE_OUTPUT_PATH = "/data2/scratch/sec_data/filings/"


# %%
def download_file(sec_path, save_path):
    headers = {
        "User-Agent": "Ghost2.0 Incoporated ghost@ghost2.0.com"
    }

    try:
        # Might need to make the directory
        if not os.path.exists(os.path.dirname(save_path)):
            os.makedirs(os.path.dirname(save_path))

        response = requests.get(sec_path, allow_redirects=True, headers=headers)
        if(response.status_code != 200):
            print("FAILED:", response.status_code, response.reason)
            return
        
        with open(save_path, 'wb') as f:
            f.write(response.content)

    except Exception as e:
        print("FAILED", e)
        return

# %%
with(open("./archive_links.txt", "r")) as f:
    links = [f.strip() for f in f.readlines() if f.strip().endswith(".nc.tar.gz")]


new_links = []
for link in tqdm(list(reversed(links))):
    path = os.path.join(BASE_OUTPUT_PATH, link.split("/")[-1])
    if os.path.exists(path):
        pass
        #print("Skipping {path} as it already exists".format(path=path))
    else:
        new_links.append(link)
        

for link in tqdm(list(reversed(sorted(new_links)))):
    path = os.path.join(BASE_OUTPUT_PATH, link.split("/")[-1])
    if os.path.exists(path):
        print("Skipping {path} as it already exists".format(path=path))
    else:
        print("Downloading {path}...".format(path=path))
        download_file(link, os.path.join(BASE_OUTPUT_PATH, link.split("/")[-1]))
        time.sleep(10)

# %%
