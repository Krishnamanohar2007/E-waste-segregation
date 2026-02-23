import os
import json

dataset_path = r"C:\chestbox\modified-dataset"

metal_mapping = {
    "battery": {"metal": "Lead", "recyclable": False, "hazardLevel": "High"},
    "keyboard": {"metal": "Aluminum", "recyclable": True, "hazardLevel": "Low"},
    "microwave": {"metal": "Iron", "recyclable": True, "hazardLevel": "Medium"},
    "mobile": {"metal": "Copper", "recyclable": True, "hazardLevel": "Medium"},
    "mouse": {"metal": "Copper", "recyclable": True, "hazardLevel": "Low"},
    "pcb": {"metal": "Copper", "recyclable": True, "hazardLevel": "Low"},
    "player": {"metal": "Aluminum", "recyclable": True, "hazardLevel": "Low"},
    "printer": {"metal": "Iron", "recyclable": True, "hazardLevel": "Medium"},
    "television": {"metal": "Aluminum", "recyclable": True, "hazardLevel": "Medium"},
    "washing machine": {"metal": "Iron", "recyclable": True, "hazardLevel": "Low"}
}

data = []

for split in ["train", "val", "test"]:
    split_path = os.path.join(dataset_path, split)

    if not os.path.exists(split_path):
        continue

    for class_name in os.listdir(split_path):
        class_path = os.path.join(split_path, class_name)

        if not os.path.isdir(class_path):
            continue

        mapping = metal_mapping.get(class_name.lower(), {})

        for image_name in os.listdir(class_path):
            if not image_name.lower().endswith((".jpg", ".jpeg", ".png")):
                continue

            data.append({
                "fileName": image_name,
                "filePath": f"{split}/{class_name}/{image_name}",
                "datasetLabel": class_name,
                "dataSplit": split,
                "dominantMetal": mapping.get("metal"),
                "recyclable": mapping.get("recyclable"),
                "hazardLevel": mapping.get("hazardLevel")
            })

with open("final_dataset.json", "w") as f:
    json.dump(data, f, indent=4)

print("✅ JSON created with train/val/test splits")