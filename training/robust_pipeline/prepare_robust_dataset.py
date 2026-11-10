import os
import shutil
import random
from pathlib import Path

random.seed(42)

OLD_DATASET = "../../workspace/final_dataset/train"
NEW_DATASET = "bing_dataset"

OUTPUT = "robust_dataset_v2"

TRAIN_SPLIT = 0.75
VAL_SPLIT = 0.15
TEST_SPLIT = 0.10

classes = os.listdir(OLD_DATASET)

def ensure_dir(path):
    Path(path).mkdir(parents=True, exist_ok=True)

for cls in classes:

    old_path = os.path.join(OLD_DATASET, cls)
    new_path = os.path.join(NEW_DATASET, cls)

    images = []

    if os.path.exists(old_path):
        images += [os.path.join(old_path, x) for x in os.listdir(old_path)]

    if os.path.exists(new_path):
        images += [os.path.join(new_path, x) for x in os.listdir(new_path)]

    random.shuffle(images)

    n = len(images)
    n_train = int(n * TRAIN_SPLIT)
    n_val = int(n * VAL_SPLIT)

    train_imgs = images[:n_train]
    val_imgs = images[n_train:n_train+n_val]
    test_imgs = images[n_train+n_val:]

    for split, split_imgs in zip(
        ["train", "val", "test"],
        [train_imgs, val_imgs, test_imgs]
    ):
        out_dir = os.path.join(OUTPUT, split, cls)
        ensure_dir(out_dir)

        for img in split_imgs:
            shutil.copy(img, out_dir)

    print(f"{cls} → {n} images merged")

print("\n✅ Robust dataset V2 created")