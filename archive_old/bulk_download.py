import os
from icrawler.builtin import BingImageCrawler

classes = {
    "Keyboard": ["old keyboard", "broken keyboard", "computer keyboard"],
    "Mobile": ["old mobile phone", "smartphone device", "damaged mobile"],
    "Mouse": ["computer mouse device", "wired mouse", "old mouse"],
    "Battery": ["AA battery", "laptop battery pack", "used battery"],
    "PCB": ["printed circuit board", "motherboard", "electronic pcb"],
    "Printer": ["office printer", "home printer machine", "inkjet printer"],
    "Television": ["lcd tv", "crt television", "flat screen tv"],
    "Microwave": ["microwave oven appliance", "kitchen microwave"],
    "Washing Machine": ["front load washing machine", "top load washing machine"],
    "Player": ["dvd player device", "set top box", "media player electronic"]
}

BASE_DIR = "raw_additional"
os.makedirs(BASE_DIR, exist_ok=True)

for cls, keywords in classes.items():
    class_path = os.path.join(BASE_DIR, cls)
    os.makedirs(class_path, exist_ok=True)

    crawler = BingImageCrawler(storage={'root_dir': class_path})

    for kw in keywords:
        print(f"Downloading {kw}")
        crawler.crawl(keyword=kw, max_num=40)