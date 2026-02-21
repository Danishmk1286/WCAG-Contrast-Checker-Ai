import * as tf from "@tensorflow/tfjs";

// Tiny model: 6 inputs -> 12 hidden -> 3 outputs (RGB)
export const createColorModel = () => {
  const model = tf.sequential();

  // Input layer: userColor (RGB) + backgroundColor (RGB)
  model.add(
    tf.layers.dense({ inputShape: [6], units: 12, activation: "relu" })
  );

  // Hidden layer
  model.add(tf.layers.dense({ units: 12, activation: "relu" }));

  // Output layer: suggested accessible color (RGB normalized 0-1)
  model.add(tf.layers.dense({ units: 3, activation: "sigmoid" }));

  // Compile the model
  model.compile({ optimizer: "adam", loss: "meanSquaredError" });

  return model;
};

export const trainColorModel = async () => {
  const model = createColorModel();
  const { xs, ys } = generateTrainingData();
  await model.fit(xs, ys, { epochs: 50, batchSize: 32, shuffle: true });
  return model;
};
