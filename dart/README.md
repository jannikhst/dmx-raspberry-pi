# Dart Models for Flutter Apps

This repository contains Dart models that can be used in Flutter apps to communicate with the DMX API server. These models facilitate the building of complex sequences and provide an interface for interacting with the server. Additionally, a `ProxyRequest` handler is included to enable multiple connection options for the client.

## Live Demo

A live demo showcasing the usage of these Dart models can be found at [https://yucca.pro](https://yucca.pro). You can explore the demo to see how the models are utilized in a real-world scenario.

## Usage

To use the Dart models for DMX LED strip control in your Flutter app, follow these steps:

1. Import the Models: Incorporate the necessary Dart models into your Flutter project by importing them into your code files. These models typically include data structures for sequences, fade effects, timing, and other relevant entities.

2. API Communication: Utilize the Dart models to communicate with the DMX API server. Use the provided methods and properties to send requests, retrieve data, and control the DMX LED strips. The models act as a bridge between your Flutter app and the server, ensuring seamless integration.

3. Building Sequences: Construct complex sequences using the Dart models. Utilize the provided methods and properties to define actions, fades, timing, and other parameters required for creating dynamic light shows. The models provide a structured representation of the sequences, enhancing code readability and maintainability.

4. ProxyRequest Handler: If needed, use the `ProxyRequest` handler to establish different connection options for your Flutter app. This handler allows you to connect via the local network (using SSL redirection) or through the proxy WebSocket server. Modify the handler based on your specific requirements.

## Example

Here's an example of using the Dart models to define a sequence:

```dart
sequence: (colors) => SequenceOut(
  endless: true,
  actions: [
    Subsequence.loop(RandomValue(min: 2, max: 4), [
      all.fadeBlackout(time: time05),
      teamA.fade(color: colors[0], time: time05),
      middle.fade(color: colors[1], time: time05),
      teamB.fade(color: colors[2], time: time05),
      Wait.time(time025),
    ]),
    all.fadeBlackout(time: time10),
    Subsequence.loop(RandomValue(min: 2, max: 4), [
      all.fadeBlackout(time: time05),
      teamB.fade(color: colors[0], time: time05),
      middle.fade(color: colors[1], time: time05),
      teamA.fade(color: colors[2], time: time05),
      Wait.time(time025),
    ]),
    all.fadeBlackout(time: time10),
  ],
)
```

In the example above, the `SequenceOut` model is used to define a sequence that fades between three colors. The `Subsequence` model is used to define a subsequence that loops a random number of times between 2 and 4. The `RandomValue` model is used to generate a random number between 2 and 4. The `Wait` model is used to define a wait time of 0.25 seconds. The `time05` and `time10` variables are defined as `Time` models with values of 0.5 and 1.0 seconds, respectively. The `time025` variable is defined as a `Time` model with a value of 0.25 seconds.