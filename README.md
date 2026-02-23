# E-Waste Classification System

Deep learning model for classifying electronic waste devices and identifying their dominant metals for recycling purposes.

## Dataset Structure

```
modified-dataset/
├── train/          # Training images
├── val/            # Validation images
├── test/           # Test images
└── [10 device categories in each split]
```

### Device Categories
- Battery
- Keyboard
- Microwave
- Mobile
- Mouse
- PCB
- Player
- Printer
- Television
- Washing Machine

## Features

- **Image Classification**: MobileNetV2-based CNN for device recognition
- **Metal Detection**: Maps devices to dominant recyclable metals
- **Hazard Assessment**: Identifies hazard levels for safe disposal
- **JSON Dataset**: Structured metadata for all images

## Requirements

```bash
pip install tensorflow numpy
```

## Usage

### 1. Train Model
```bash
python train_model.py
```
- Uses MobileNetV2 with transfer learning
- Data augmentation for robustness
- Early stopping to prevent overfitting
- Saves model as `ewaste_model.keras`

### 2. Predict Device
```bash
python predict.py
```
Enter image path when prompted. Returns:
- Device classification
- Confidence score
- Dominant metal
- Recyclability status
- Hazard level

### 3. Generate Dataset JSON
```bash
python generate_json.py
```
Creates `final_dataset.json` with metadata for all images.

## Model Architecture

- Base: MobileNetV2 (ImageNet pretrained)
- Input: 224x224 RGB images
- Output: 10 device classes
- Optimizer: Adam (lr=0.0003)
- Loss: Categorical crossentropy

## Metal Mapping

| Device | Metal | Recyclable | Hazard Level |
|--------|-------|------------|--------------|
| Battery | Lead | No | High |
| Keyboard | Aluminum | Yes | Low |
| Microwave | Iron | Yes | Medium |
| Mobile | Copper | Yes | Medium |
| Mouse | Copper | Yes | Low |
| PCB | Copper | Yes | Low |
| Player | Aluminum | Yes | Low |
| Printer | Iron | Yes | Medium |
| Television | Aluminum | Yes | Medium |
| Washing Machine | Iron | Yes | Low |
