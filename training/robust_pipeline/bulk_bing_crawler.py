from icrawler.builtin import BingImageCrawler
import os
import shutil
import random

# =========================

# CONFIG

# =========================

BASE_PATH = "dataset_final"

TRAIN_PATH = os.path.join(BASE_PATH, "train", "Others")
VAL_PATH = os.path.join(BASE_PATH, "val", "Others")
TEST_PATH = os.path.join(BASE_PATH, "test", "Others")

TEMP_PATH = "temp_others"

# Ensure directories exist

os.makedirs(TRAIN_PATH, exist_ok=True)
os.makedirs(VAL_PATH, exist_ok=True)
os.makedirs(TEST_PATH, exist_ok=True)

# =========================

# TARGET COUNTS

# =========================

TRAIN_TARGET = 140     # (100–150 range)
VAL_TARGET = 100       # (80–120 range)
TEST_TARGET = 40       # (30–50 range)

TOTAL_IMAGES = TRAIN_TARGET + VAL_TARGET + TEST_TARGET + 50

# extra buffer to avoid duplicates / failures

# =========================

# KEYWORDS (HIGH DIVERSITY)

# =========================

KEYWORDS = [
"person indoor", "people walking street", "human face portrait",
"plastic bottle on table", "glass cup", "books on desk",
"notebook and pen", "clothes hanging wardrobe",
"wooden chair indoor", "study table desk", "sofa living room",
"bedroom interior",
"kitchen utensils", "food plate meal", "knife cutting vegetables",
"street road view", "city buildings", "park trees",
"hammer tool", "screwdriver tool", "wrench tool",
"messy room objects", "random household clutter",
"junk items pile", "storage room clutter",
"forest trees", "mountain landscape",
"car parked street", "bike motorcycle"
]

# =========================

# DOWNLOAD FUNCTION

# =========================

def download_images():
    if os.path.exists(TEMP_PATH):
        shutil.rmtree(TEMP_PATH)
    os.makedirs(TEMP_PATH, exist_ok=True)


    crawler = BingImageCrawler(
        feeder_threads=2,
        parser_threads=2,
        downloader_threads=4,
        storage={"root_dir": TEMP_PATH}
    )

    per_keyword = max(15, TOTAL_IMAGES // len(KEYWORDS))

    for keyword in KEYWORDS:
        print(f"Downloading: {keyword}")
        crawler.crawl(
            keyword=keyword,
            max_num=per_keyword,
            min_size=(200, 200),
            file_idx_offset="auto"
        )


# =========================

# SPLIT FUNCTION

# =========================

def split_data():
    images = os.listdir(TEMP_PATH)
    random.shuffle(images)


    # Take exact required counts
    train_imgs = images[:TRAIN_TARGET]
    val_imgs = images[TRAIN_TARGET:TRAIN_TARGET + VAL_TARGET]
    test_imgs = images[TRAIN_TARGET + VAL_TARGET:
                    TRAIN_TARGET + VAL_TARGET + TEST_TARGET]

    for img in train_imgs:
        shutil.move(
            os.path.join(TEMP_PATH, img),
            os.path.join(TRAIN_PATH, img)
        )

    for img in val_imgs:
        shutil.move(
            os.path.join(TEMP_PATH, img),
            os.path.join(VAL_PATH, img)
        )

    for img in test_imgs:
        shutil.move(
            os.path.join(TEMP_PATH, img),
            os.path.join(TEST_PATH, img)
        )

    shutil.rmtree(TEMP_PATH)

# =========================

# RUN

# =========================

if __name__ == "__main__":
    download_images()
    split_data()
    print("✅ Others dataset created with controlled counts!")
