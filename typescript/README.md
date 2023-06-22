# TypeScript Models

This repository contains TypeScript models that are essential for parsing, sending, and creating data from and to the API used in the DMX LED strip control project.

## Overview

The TypeScript models included in this repository provide a structured representation of the data used within the project. These models enable type safety and enhance code readability and maintainability. By utilizing these models, you can ensure consistent data handling throughout your application.

## Usage

To use the TypeScript models, follow these steps:

1. Import the Models: Incorporate the necessary TypeScript models into your project by importing them into your TypeScript files. These models typically include data structures for DMX channels, color patterns, light show configurations, and other relevant entities.

2. Type Annotations: Utilize the TypeScript models to provide type annotations for variables, function parameters, and return values where appropriate. This helps enforce type safety and improves the overall robustness of your code.

3. Data Manipulation: Leverage the TypeScript models to parse incoming data from the API responses or construct data objects to be sent to the API endpoints. These models serve as a reference for the structure and properties of the data, ensuring accuracy during data manipulation.

## Example

Here's an example of using the TypeScript models for DMX channel configuration:

```typescript
export function scene2a(settings: Settings): SubSequenceOut {
    const timeFactor = settings.timeFactor ?? { factor: 1, type: 'time' };
    const pairs = settings.pairs ?? [
        [Colors.custom.lavender, Colors.custom.seaGreen],
        [Colors.custom.gold, Colors.custom.coral],
        [Colors.custom.lemon, Colors.custom.pink],
    ];
    return {
        type: 'subsequence',
        count: settings.count ?? Random.value(4, 15),
        actions: [
            ...pairs.map((colorPair: [Color, Color]) => [
                Sync.set(
                    teamA.set({ color: colorPair[0] }),
                    teamB.set({ color: colorPair[0] }),
                    middle.blackout(),
                ),
                Wait.time(timeFactor),
                Sync.set(
                    teamA.blackout(),
                    teamB.blackout(),
                    middle.set({ color: colorPair[1] }),
                ),
                Wait.time(timeFactor),
            ]).reduce((a, b) => a.concat(b), []),
        ]
    }
}
```

In the example above, the timeFactor variable reflects the current BPM speed dynamically. It is used as an input for the Wait.bpm function, which waits for a specific amount of time based on the BPM value. Adjusting the timeFactor dynamically based on the BPM allows for synchronized light shows that align with the music tempo. (This requires using the docker containers for the sound analysis service.)