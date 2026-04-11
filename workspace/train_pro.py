import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout, BatchNormalization
from tensorflow.keras.models import Model
import json
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend (safe for servers)
import matplotlib.pyplot as plt

# ======================
# CONFIGURATION
# ======================

IMG_SIZE = (224, 224)
BATCH_SIZE = 28
EPOCH_HEAD = 10
EPOCH_FINE = 10  # increased

TRAIN_DIR = "robust_pipeline/dataset_final/train"
VAL_DIR = "robust_pipeline/dataset_final/val"

# ======================
# DATA AUGMENTATION
# ======================

train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    rotation_range=25,
    width_shift_range=0.15,
    height_shift_range=0.15,
    zoom_range=0.25,
    shear_range=0.15,
    brightness_range=[0.6, 1.4],
    horizontal_flip=True,
    fill_mode="nearest"
)

val_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input
)

train_gen = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical'
)

val_gen = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical'
)

# ======================
# CLASS WEIGHTS & MAPPING
# ======================

# Save class mapping to JSON for the ML server
with open("class_mapping.json", "w") as f:
    json.dump(train_gen.class_indices, f)
print("✅ Saved class mapping to class_mapping.json")

class_weights = {i: 1.0 for i in range(train_gen.num_classes)}
others_index = train_gen.class_indices['Others']
class_weights[others_index] = 2.5

# ======================
# MODEL BACKBONE
# ======================

base = MobileNetV2(
    weights='imagenet',
    include_top=False,
    input_shape=(224, 224, 3)
)

base.trainable = False

# ======================
# CLASSIFICATION HEAD
# ======================

x = base.output
x = GlobalAveragePooling2D()(x)

x = BatchNormalization()(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.4)(x)

x = Dense(128, activation='relu')(x)
x = BatchNormalization()(x)
x = Dropout(0.3)(x)

out = Dense(train_gen.num_classes, activation='softmax')(x)

model = Model(inputs=base.input, outputs=out)

# ======================
# COMPILE PHASE-1
# ======================

model.compile(
    optimizer=tf.keras.optimizers.Adam(0.001),
    loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.15),
    metrics=['accuracy']
)

callbacks = [
    EarlyStopping(patience=4, restore_best_weights=True),
    ReduceLROnPlateau(patience=2, factor=0.25, min_lr=1e-6)
]

print("\n🚀 Phase-1: Training classifier head")
history1 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCH_HEAD,
    callbacks=callbacks,
    class_weight=class_weights
)

# ======================
# FINE-TUNING PHASE
# ======================

print("\n🔥 Phase-2: Fine-tuning deeper backbone layers")

for layer in base.layers[-60:]:
    layer.trainable = True

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-5),
    loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
    metrics=['accuracy']
)

history2 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCH_FINE,
    callbacks=callbacks,
    class_weight=class_weights
)

# ======================
# SAVE MODEL
# ======================

model.save("ewaste_model_robust_v2.keras")
print("\n✅ Robust professional training completed")

# ======================
# TRAINING VISUALIZATION
# ======================

# Merge history from both phases
acc      = history1.history['accuracy']      + history2.history['accuracy']
val_acc  = history1.history['val_accuracy']  + history2.history['val_accuracy']
loss     = history1.history['loss']          + history2.history['loss']
val_loss = history1.history['val_loss']      + history2.history['val_loss']
epochs_range = range(1, len(acc) + 1)

# Add a vertical line to mark the phase boundary
phase_boundary = len(history1.history['accuracy'])

# ---- Accuracy Plot ----
plt.figure(figsize=(10, 5))
plt.plot(epochs_range, acc,     label='Train Accuracy',      color='royalblue',   linewidth=2)
plt.plot(epochs_range, val_acc, label='Val Accuracy',        color='darkorange',  linewidth=2, linestyle='--')
plt.axvline(x=phase_boundary, color='gray', linestyle=':', linewidth=1.5, label='Fine-tuning Start')
plt.title('Model Accuracy', fontsize=15, fontweight='bold')
plt.xlabel('Epoch', fontsize=12)
plt.ylabel('Accuracy', fontsize=12)
plt.legend(fontsize=11)
plt.grid(True, linestyle='--', alpha=0.6)
plt.tight_layout()
plt.savefig('accuracy_plot.png', dpi=150)
print("📊 Saved: accuracy_plot.png")

# ---- Loss Plot ----
plt.figure(figsize=(10, 5))
plt.plot(epochs_range, loss,     label='Train Loss',   color='crimson',      linewidth=2)
plt.plot(epochs_range, val_loss, label='Val Loss',     color='mediumseagreen', linewidth=2, linestyle='--')
plt.axvline(x=phase_boundary, color='gray', linestyle=':', linewidth=1.5, label='Fine-tuning Start')
plt.title('Model Loss', fontsize=15, fontweight='bold')
plt.xlabel('Epoch', fontsize=12)
plt.ylabel('Loss', fontsize=12)
plt.legend(fontsize=11)
plt.grid(True, linestyle='--', alpha=0.6)
plt.tight_layout()
plt.savefig('loss_plot.png', dpi=150)
print("📊 Saved: loss_plot.png")

plt.show()
