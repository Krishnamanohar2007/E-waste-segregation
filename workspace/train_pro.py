import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout, BatchNormalization
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

# ======================
# CONFIGURATION
# ======================
IMG_SIZE = (224, 224)
BATCH_SIZE = 28          # CPU safe
EPOCH_HEAD = 10          # reduced for strong augmentation noise
EPOCH_FINE = 8

TRAIN_DIR = "final_dataset/train"
VAL_DIR = "final_dataset/val"

# ======================
# DATA AUGMENTATION (ROBUSTNESS ENGINEERING)
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
# MODEL BACKBONE
# ======================
base = MobileNetV2(
    weights='imagenet',
    include_top=False,
    input_shape=(224, 224, 3)
)

base.trainable = False

# ======================
# CLASSIFICATION HEAD (IMPROVED SEPARATION CAPACITY)
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
    loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
    metrics=['accuracy']
)

callbacks = [
    EarlyStopping(patience=4, restore_best_weights=True),
    ReduceLROnPlateau(patience=2, factor=0.25, min_lr=1e-6)
]

print("\n🚀 Phase-1: Training classifier head")
model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCH_HEAD,
    callbacks=callbacks
)

# ======================
# FINE-TUNING PHASE
# ======================
print("\n🔥 Phase-2: Fine-tuning deeper backbone layers")

for layer in base.layers[-60:]:   # deeper domain adaptation
    layer.trainable = True

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-5),
    loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
    metrics=['accuracy']
)

model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCH_FINE,
    callbacks=callbacks
)

# ======================
# SAVE MODEL
# ======================
model.save("ewaste_model_robust_v1.keras")

print("\n✅ Robust professional training completed")