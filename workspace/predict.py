import tensorflow as tf
import numpy as np
from PIL import Image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

model = tf.keras.models.load_model("ewaste_model_robust_v1.keras")

class_names = [
    'Battery','Keyboard','Microwave','Mobile',
    'Mouse','PCB','Player','Printer','Television','Washing Machine'
]

IMG_SIZE = (224,224)

path = input("Enter image path: ")

img = Image.open(path).convert("RGB")
img = img.resize(IMG_SIZE)

arr = np.array(img)
arr = preprocess_input(arr)
arr = np.expand_dims(arr,0)

pred = model.predict(arr)[0]

for i in pred.argsort()[-3:][::-1]:
    print(class_names[i], ":", float(pred[i]))