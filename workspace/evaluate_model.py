import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from sklearn.metrics import confusion_matrix, classification_report

IMG_SIZE = (224,224)
BATCH_SIZE = 32

TEST_DIR = "final_dataset/test"

datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input
)

test_gen = datagen.flow_from_directory(
    TEST_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

model = tf.keras.models.load_model("ewaste_model_robust_v1.keras")

print("\n🔍 Evaluating ROBUST V1 model...\n")

loss, acc = model.evaluate(test_gen)
print(f"\n✅ Test Accuracy: {acc*100:.2f}%")

pred = model.predict(test_gen)
y_pred = np.argmax(pred, axis=1)
y_true = test_gen.classes

cm = confusion_matrix(y_true, y_pred)

plt.figure(figsize=(11,9))
sns.heatmap(cm, annot=True, fmt="d",
            xticklabels=test_gen.class_indices.keys(),
            yticklabels=test_gen.class_indices.keys(),
            cmap="Blues")

plt.title("Confusion Matrix — Robust V1")
plt.xlabel("Predicted")
plt.ylabel("Actual")

plt.savefig("confusion_matrix_robust_v1.png", dpi=300, bbox_inches="tight")
plt.show()

print("\n📊 Classification Report:\n")
print(classification_report(
    y_true,
    y_pred,
    target_names=list(test_gen.class_indices.keys())
))