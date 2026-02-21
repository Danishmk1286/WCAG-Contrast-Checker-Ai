/**
 * Train and save the ML color contrast model
 * Run with: node scripts/train-ml-model.js
 */

import * as tf from "@tensorflow/tfjs";
import tinycolor from "tinycolor2";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Get contrast ratio function (simplified version)
const getContrastRatio = (color1, color2) => {
  const getLuminance = (hex) => {
    const rgb = tinycolor(hex).toRgb();
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const createColorModel = () => {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ inputShape: [6], units: 12, activation: "relu" })
  );
  model.add(tf.layers.dense({ units: 12, activation: "relu" }));
  model.add(tf.layers.dense({ units: 3, activation: "sigmoid" }));
  model.compile({ optimizer: "adam", loss: "meanSquaredError" });
  return model;
};

const generateTrainingData = () => {
  const xs = [];
  const ys = [];
  
  console.log("Generating training data...");
  
  for (let i = 0; i < 5000; i++) {
    const user = tinycolor.random();
    const bg = tinycolor.random();
    let target = user.clone();
    
    // Find accessible color by brightening/darkening
    for (let j = 1; j <= 10; j++) {
      const lighter = user.clone().brighten(j * 5);
      const darker = user.clone().darken(j * 5);
      
      if (getContrastRatio(lighter.toHexString(), bg.toHexString()) >= 4.5) {
        target = lighter;
        break;
      }
      if (getContrastRatio(darker.toHexString(), bg.toHexString()) >= 4.5) {
        target = darker;
        break;
      }
    }
    
    xs.push([
      user._r / 255,
      user._g / 255,
      user._b / 255,
      bg._r / 255,
      bg._g / 255,
      bg._b / 255,
    ]);
    
    ys.push([target._r / 255, target._g / 255, target._b / 255]);
    
    if ((i + 1) % 1000 === 0) {
      console.log(`Generated ${i + 1}/5000 samples...`);
    }
  }
  
  return { xs: tf.tensor2d(xs), ys: tf.tensor2d(ys) };
};

const trainAndSaveModel = async () => {
  try {
    console.log("Creating model...");
    const model = createColorModel();
    
    console.log("Generating training data...");
    const { xs, ys } = generateTrainingData();
    
    console.log("Training model (this may take a few minutes)...");
    await model.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if ((epoch + 1) % 10 === 0) {
            console.log(`Epoch ${epoch + 1}/50 - Loss: ${logs?.loss?.toFixed(4) || 'N/A'}`);
          }
        },
      },
    });
    
    // Save to public directory
    const modelDir = path.join(projectRoot, "public", "pretrained-color-model");
    
    // Ensure directory exists
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }
    
    console.log("Saving model to:", modelDir);
    
    // Save model weights and topology
    const modelJson = model.toJSON();
    const weights = model.getWeights();
    
    // Convert weights to a format we can save
    const weightData = [];
    for (const weight of weights) {
      const data = await weight.data();
      weightData.push({
        name: weight.name,
        shape: weight.shape,
        dtype: weight.dtype,
        data: Array.from(data)
      });
    }
    
    // Save model topology
    const modelPath = path.join(modelDir, 'model.json');
    fs.writeFileSync(modelPath, JSON.stringify({
      modelTopology: modelJson,
      format: "layers-model",
      generatedBy: "TensorFlow.js tfjs-layers v4.22.0",
      convertedBy: null,
      weightsManifest: [{
        paths: ['group1-shard1of1.bin'],
        weights: weightData.map(w => ({
          name: w.name,
          shape: w.shape,
          dtype: w.dtype
        }))
      }]
    }, null, 2));
    
    console.log("✅ Model topology saved to:", modelPath);
    
    // Save weights as binary file
    const weightsPath = path.join(modelDir, 'group1-shard1of1.bin');
    
    // Combine all weights into a single Float32Array
    let totalFloats = 0;
    for (const weight of weightData) {
      totalFloats += weight.data.length;
    }
    
    const combinedWeights = new Float32Array(totalFloats);
    let offset = 0;
    for (const weight of weightData) {
      combinedWeights.set(weight.data, offset);
      offset += weight.data.length;
    }
    
    // Convert to Uint8Array (binary)
    const weightsBuffer = new Uint8Array(combinedWeights.buffer);
    fs.writeFileSync(weightsPath, Buffer.from(weightsBuffer));
    
    console.log("✅ Model weights saved to:", weightsPath);
    console.log(`Weights file size: ${weightsBuffer.length} bytes (${totalFloats} floats)`);
    
    console.log("✅ Model trained and saved successfully!");
    console.log(`Model saved to: ${modelDir}`);
    
    // Clean up tensors
    xs.dispose();
    ys.dispose();
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error training model:", error);
    process.exit(1);
  }
};

trainAndSaveModel();



