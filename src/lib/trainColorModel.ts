import * as tf from "@tensorflow/tfjs-node"; // Use tfjs-node for faster training
import tinycolor from "tinycolor2";
import { getContrastRatio } from "./colorUtils";

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
  const xs: number[][] = [];
  const ys: number[][] = [];
  for (let i = 0; i < 5000; i++) {
    const user = tinycolor.random();
    const bg = tinycolor.random();
    let target = user.clone();
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
  }
  return { xs: tf.tensor2d(xs), ys: tf.tensor2d(ys) };
};

const trainAndSaveModel = async () => {
  const model = createColorModel();
  const { xs, ys } = generateTrainingData();
  await model.fit(xs, ys, { epochs: 50, batchSize: 32, shuffle: true });
  await model.save("file://./pretrained-color-model"); // Save to local folder
  console.log("Model trained and saved!");
};

trainAndSaveModel();
