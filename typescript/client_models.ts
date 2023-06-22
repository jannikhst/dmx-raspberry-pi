import { ActionOut, ActionType, FadeActionOut, RandomWrapper, SequenceOut, SetActionOut, SubSequenceOut, Time, ChannelValue, WaitActionOut, RandomValue, Value, isRandomValue, isVolumeWhitespace } from './out_models';
import axios from 'axios';

export type EditFixture = FadeFixture | SetFixture;

interface FadeFixture {
    color?: Color;
    r?: ChannelValue;
    g?: ChannelValue;
    b?: ChannelValue;
    time: Time;
    push?: boolean;
}

interface SetFixture {
    color?: Color;
    r?: ChannelValue;
    g?: ChannelValue;
    b?: ChannelValue;
    push?: boolean;
}

abstract class Fixture {

    abstract set(data: SetFixture): SetActionOut;

    abstract fade(data: FadeFixture): FadeActionOut;

    blackout(): SetActionOut {
        return this.set({ color: { r: 0, g: 0, b: 0 } });
    }

    fullOn(): SetActionOut {
        return this.set({ color: { r: 255, g: 255, b: 255 } });
    }

    fadeIn(color?: Color, time?: Time): FadeActionOut {
        return this.fade({ color: color ?? { r: 255, g: 255, b: 255 }, time: time ?? 1000 });
    }

    fadeOut(time?: Time): FadeActionOut {
        return this.fade({ color: { r: 0, g: 0, b: 0 }, time: time ?? 1000 });
    }

    strobo(data?: { color?: Color, time?: Time, count?: Value, }): SubSequenceOut {
        const color = data?.color ?? { r: 255, g: 255, b: 255 };
        const time = data?.time ?? 50;
        const count = data?.count ?? 5;
        const actions: ActionOut[] = [];
        actions.push(this.set({ color }));
        actions.push(Wait.time(time));
        actions.push(this.set({ color: { r: 0, g: 0, b: 0 } }));
        actions.push(Wait.time(time));
        return SubSequence.loop(count, ...actions);
    }

    rainbow(data?: { time?: Time, palette?: { [key: string]: Color } }): SubSequenceOut {
        const time = data?.time ?? 1000;
        const colors = Object.values(data?.palette ?? Colors.rainbow);
        const rainbowdata = colors.map(color => this.fade({ color, time }));
        return SubSequence.once(...rainbowdata);
    }

    colorStrobe(data?: { time?: Time, count?: Value, palette?: { [key: string]: Color } }): SubSequenceOut {
        const time = data?.time ?? 75;
        const count = data?.count ?? 5;
        const actions: ActionOut[] = [];
        const colors = Object.values(data?.palette ?? Colors.rainbow);
        for (const color of colors) {
            actions.push(this.set({ color }));
            actions.push(Wait.time(time));
            actions.push(this.set({ color: { r: 0, g: 0, b: 0 } }));
            actions.push(Wait.time(time));
        }
        return SubSequence.loop(count, ...actions);
    }
}

export abstract class SubSequence {
    static loop(count: Value, ...actions: ActionType[]): SubSequenceOut {
        return {
            type: 'subsequence',
            count,
            actions,
        };
    }

    static oneOf(...options: ActionType[]): RandomWrapper {
        return {
            type: 'option',
            options,
        };
    }

    static once(...actions: ActionType[]): SubSequenceOut {
        return this.loop(1, ...actions);
    }
}

class RGBFixture extends Fixture {
    private r: ChannelValue = 0;
    private g: ChannelValue = 0;
    private b: ChannelValue = 0;
    private channelR: number;
    private channelG: number;
    private channelB: number;

    constructor(channelR: number, channelG: number, channelB: number) {
        super();
        this.channelR = channelR;
        this.channelG = channelG;
        this.channelB = channelB;
    }

    set(data: SetFixture): SetActionOut {
        if (data.color) {
            this.setColor(data.color);
        } else {
            const rgb: RGBColor = {
                r: data.r ?? this.r,
                g: data.g ?? this.g,
                b: data.b ?? this.b,
                factor: false,
            };
            this.setColor(rgb);
        }
        const action: SetActionOut = {
            type: 'set',
            channels: this.getChannels(),
        };
        if (data.push) {
            singleAction(action);
        }
        return action;
    }

    fade(data: FadeFixture): FadeActionOut {
        if (data.color) {
            this.setColor(data.color);
        } else {
            const rgb: RGBColor = {
                r: data.r ?? this.r,
                g: data.g ?? this.g,
                b: data.b ?? this.b,
            };
            this.setColor(rgb);
        }
        const action: FadeActionOut = {
            type: 'fade',
            channels: this.getChannels(),
            time: data.time,
        };
        if (data.push) {
            singleAction(action);
        }
        return action;
    }


    private setColor(color: Color) {
        const rgb = 'hex' in color ? hexColorToRgb(color) : color;
        this.r = rgb.r;
        this.g = rgb.g;
        this.b = rgb.b;
    }

    getChannels(): { [key: string]: ChannelValue } {
        return {
            [this.channelR]: this.r,
            [this.channelG]: this.g,
            [this.channelB]: this.b,
        };
    }
}

async function singleAction(action: ActionOut) {
    const sequence: SequenceOut = {
        count: 1,
        endless: false,
        actions: [action],
    };
    await executeSequence(sequence);
}

const baseurl = 'http://pipong.local:8000/';
// const baseurl = 'http://localhost:8000/';


export async function executeSequence(sequence: SequenceOut) {
    const url = baseurl + 'dmx';
    // const actions = sequence.actions.map(action => {
    //     if ('channels' in action) {
    //         // round all values to integers
    //         const channels: { [key: string]: ChannelValue } = {};
    //         for (const [key, value] of Object.entries(action.channels)) {
    //             if (typeof value === 'number') {
    //                 channels[key] = Math.round(value);
    //             } else { 
    //                 channels[key] = value;
    //             }
    //         }
    //         return { ...action, channels };
    //     }
    //     if ('time' in action && typeof action.time === 'number') {
    //         return { ...action, time: Math.round(action.time) };
    //     }
    //     return action;
    // });
    // sequence.actions = actions;
    const json = JSON.stringify(sequence);
    console.log(json);
    const headers = {
        'Content-Type': 'application/json',
        'Content-Length': json.length,
        'Accept': '*/*',
    };
    await axios.post(url, json, { headers }).catch((err) => {
        console.log(err.message, url);
    });
}

export type Channel = 'r' | 'g' | 'b';

export type Color = HexColor | RGBColor;

function hexColorToRgb(hexColor: HexColor): RGBColor {
    const hex = hexColor.hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (hexColor.factor) {
        return {
            r: { factor: r / 255, type: 'volume' },
            g: { factor: g / 255, type: 'volume' },
            b: { factor: b / 255, type: 'volume' },
        };
    }
    return { r, g, b };
}


interface HexColor {
    hex: string;
    factor?: boolean;
}

interface RGBColor {
    r: ChannelValue;
    g: ChannelValue;
    b: ChannelValue;
    factor?: boolean;
}

export const middle = new RGBFixture(1, 0, 2);

export const teamA = new RGBFixture(4, 3, 5);

export const teamB = new RGBFixture(7, 6, 8);

export const stripes = new RGBFixture(10, 9, 11);



export class Universe {
    private range: [number, number];
    private _time?: Time;
    private ignoreFixtures: RGBFixture[] = [];
    private _value?: ChannelValue;
    private type: 'set' | 'fade' = 'set';

    constructor(start?: number, end?: number) {
        this.range = [start ?? 0, end ?? 512];
    }

    blackout(): ActionOut {
        const channels: { [key: string]: ChannelValue } = {};
        // fill channels in range with value
        for (let i = this.range[0]; i <= this.range[1]; i++) {
            channels[i] = 0;
        }
        const action: SetActionOut = {
            type: 'set',
            channels,
        };
        return action;
    }

    ignore(...fixtures: RGBFixture[]): this {
        this.ignoreFixtures = fixtures;
        return this;
    }

    time(time: Time): this {
        this._time = time;
        return this;
    }

    value(value: ChannelValue): this {
        this._value = value;
        return this;
    }

    fade(): this {
        this.type = 'fade';
        return this;
    }

    set(): this {
        this.type = 'set';
        return this;
    }

    action(): ActionOut {
        const channels: { [key: string]: ChannelValue } = {};
        // fill channels in range with value
        for (let i = this.range[0]; i <= this.range[1]; i++) {
            channels[i] = this._value ?? 0;
        }
        // set channels to channel for ignored fixtures
        for (const fixture of this.ignoreFixtures) {
            const fixtureChannels = fixture.getChannels();
            for (const channel in fixtureChannels) {
                channels[channel] = fixtureChannels[channel];
            }
        }

        if (this.type === 'fade') {
            const action: FadeActionOut = {
                type: 'fade',
                channels,
                time: this._time ?? 0,
            };
            return action;
        } else {
            const action: SetActionOut = {
                type: 'set',
                channels,
            };
            return action;
        }
    }

    async execute() {
        const action = this.action();
        await singleAction(action);
    }
}


export abstract class Wait {
    static ms(ms: number): WaitActionOut {
        return {
            type: 'wait',
            time: ms,
        };
    }

    static time(time: Time): WaitActionOut {
        return {
            type: 'wait',
            time,
        };
    }
}

export async function setCompensation(compensation: number) {
    const url = baseurl + 'compensation';
    const json = JSON.stringify({ compensation });
    const headers = {
        'Content-Type': 'application/json',
        'Content-Length': json.length,
        'Accept': '*/*',
    };
    await axios.post(url, json, { headers }).catch((err) => {
        console.log(err.message, url);
    });
}

export class Group extends Fixture {

    RGBFixtures: Fixture[] = [];

    constructor(...fixtures: Fixture[]) {
        super();
        this.RGBFixtures = fixtures;
    }

    set(data: SetFixture): SetActionOut {
        const actions: SetActionOut[] = [];
        for (const fixture of this.RGBFixtures) {
            actions.push(fixture.set(data));
        }
        return {
            type: 'set',
            channels: actions.map((action) => action.channels).reduce((acc, channels) => {
                for (const channel in channels) {
                    acc[channel] = channels[channel];
                }
                return acc;
            }, {}),
        };
    }

    fade(data: FadeFixture): FadeActionOut {
        const actions: FadeActionOut[] = [];
        for (const fixture of this.RGBFixtures) {
            actions.push(fixture.fade(data));
        }
        return {
            type: 'fade',
            channels: actions.map((action) => action.channels).reduce((acc, channels) => {
                for (const channel in channels) {
                    acc[channel] = channels[channel];
                }
                return acc;
            }, {}),
            time: data.time,
        };
    }

    static fadeActions(...actions: FadeActionOut[]): FadeActionOut {
        return {
            type: 'fade',
            time: actions.filter(action => typeof action.time === 'number').reduce((acc, action) => Math.max(acc, action.time as number), 0),
            channels: actions.map((action) => action.channels).reduce((acc, channels) => {
                for (const channel in channels) {
                    acc[channel] = channels[channel];
                }
                return acc;
            }
                , {}),
        }
    }

    static setActions(...actions: SetActionOut[]): SetActionOut {
        return {
            type: 'set',
            channels: actions.map((action) => action.channels).reduce((acc, channels) => {
                for (const channel in channels) {
                    acc[channel] = channels[channel];
                }
                return acc;
            }
                , {}),
        }
    }
}


export abstract class Sync {
    static set(...actions: SetActionOut[]): SetActionOut {
        return {
            type: 'set',
            channels: actions.map((action) => action.channels).reduce((acc, channels) => {
                for (const channel in channels) {
                    acc[channel] = channels[channel];
                }
                return acc;
            }
                , {}),
        }
    }

    static fade(...actions: FadeActionOut[]): FadeActionOut {
        // assert all actions have the same time or all actions have TimeWhitespace
        const firstTime = actions[0].time;
        for (const action of actions) {
            const condition1 = typeof action.time === 'number' && typeof firstTime === 'number' && action.time === firstTime;
            const condition2 = typeof action.time !== 'number' && typeof firstTime !== 'number';
            // one of the two conditions must be true, else throw error
            if (!(condition1 || condition2)) {
                throw new Error('All actions must have the same time or all actions must have TimeWhitespace');
            }
        }
        return {
            type: 'fade',
            time: firstTime,
            channels: actions.map((action) => action.channels).reduce((acc, channels) => {
                for (const channel in channels) {
                    acc[channel] = channels[channel];
                }
                return acc;
            }
                , {}),
        }
    }

    static subSequence(...subsequences: SubSequenceOut[]): SubSequenceOut {
        // the resulting subsequence will have the length of the longest subsequence
        const length = subsequences.map((subsequence) => subsequence.actions.length).reduce((acc, length) => Math.max(acc, length), 0);
        const actions: ActionOut[] = [];
        for (let i = 0; i < length; i++) {
            const partialActions: ActionOut[] = [];
            for (const subsequence of subsequences) {
                if (subsequence.actions[i] && subsequence.actions[i].type !== 'option' && subsequence.actions[i].type !== 'subsequence') {
                    partialActions.push(subsequence.actions[i] as ActionOut);
                }
            }
            actions.push(this.mergeActions(...partialActions));
        }
        return {
            count: 1,
            type: 'subsequence',
            actions,
        }
    }

    private static mergeActions(...actions: ActionOut[]): ActionOut {
        const containsFade = actions.some((action) => action.type === 'fade');
        const containsWait = actions.some((action) => action.type === 'wait');
        if (!containsFade && !containsWait) {
            return Sync.set(...actions as SetActionOut[]);
        }
        const containsTimeWhitespace = actions.some((action) => 'time' in action && typeof action.time !== 'number');
        if (!containsTimeWhitespace) {
            const maxTime = actions.filter((action) => 'time' in action)
                .map(action => action as ExposeTime)
                .map((action: ExposeTime) => action.time)
                .reduce((acc, time) => Math.max(acc, time as number), 0);
            const result: FadeActionOut[] = [];
            for (const action of actions) {
                if (action.type === 'fade') {
                    result.push({
                        ...action,
                        time: maxTime,
                    });
                }
                if (action.type === 'set') {
                    result.push({
                        type: 'fade',
                        time: maxTime,
                        channels: action.channels,
                    });
                }
            }
            if (result.length === 0) {
                return {
                    type: 'wait',
                    time: 0,
                }
            }
            return Sync.fade(...result);
        }
        const result: FadeActionOut[] = [];
        const maxTime = (actions.filter((action) => 'time' in action && typeof action.time !== 'number')[0] as any).time;
        for (const action of actions) {
            if (action.type === 'fade') {
                result.push(action);
            }
            if (action.type === 'set') {
                result.push({
                    type: 'fade',
                    time: maxTime,
                    channels: action.channels,
                });
            }
        }
        if (result.length === 0) {
            return {
                type: 'wait',
                time: 0,
            }
        }
        return Sync.fade(...result);
    }
}

interface ExposeTime {
    time: number;
}

export function opacity(color: Color, opacity: number): Color {
    const rgb = 'hex' in color ? hexColorToRgb(color) : color;
    return {
        r: multiplyChannelValue(rgb.r, opacity),
        g: multiplyChannelValue(rgb.g, opacity),
        b: multiplyChannelValue(rgb.b, opacity),
    };
}

function multiplyChannelValue(channelValue: ChannelValue, multiplier: number): ChannelValue {
    if (isRandomValue(channelValue)) {
        return {
            type: 'random',
            min: channelValue.min,
            max: channelValue.max * multiplier,
        }
    }
    if (isVolumeWhitespace(channelValue)) {
        return {
            type: 'volume',
            factor: channelValue.factor * multiplier,
        }
    }
    return channelValue * multiplier;
}

export abstract class Colors {
    static custom = {
        orange: { r: 255, g: 50, b: 0 },
        gold: { r: 255, g: 115, b: 0 },
        seaGreen: { r: 0, g: 255, b: 55 },
        lavender: { r: 255, g: 0, b: 255 },
        lilac: { r: 192, g: 128, b: 255 },
        indigo: { r: 75, g: 0, b: 130 },
        lemon: { r: 55, g: 175, b: 0 },
        babyBlue: { r: 122, g: 250, b: 255 },
        pink: { r: 255, g: 0, b: 35 },
        mint: { r: 50, g: 255, b: 90 },
        peach: { r: 255, g: 100, b: 0 },
        coral: { r: 255, g: 64, b: 64 },
    }


    static neon = {
        pink: { hex: "#FF6EC7", },
        blue: { hex: "#00E2FF", },
        green: { hex: "#00FFA3", },
        yellow: { hex: "#FFFF66", },
        orange: { hex: "#FFB347", },
        purple: { hex: "#BF00FF", },
        red: { hex: "#FF355E", },
    };

    static pastels = {
        apricot: { hex: "#FFB347" },
        lavender: { hex: "#B19CD9" },
        lemon: { hex: "#FFF44F" },
        mint: { hex: "#98FB98" },
        peach: { hex: "#FFE5B4" },
        periwinkle: { hex: "#C5D0E6" },
        pink: { hex: "#FFC0CB" },
        sky: { hex: "#87CEEB" }
    };

    static material = {
        red: { hex: "#F44336" },
        pink: { hex: "#E91E63" },
        purple: { hex: "#9C27B0" },
        deepPurple: { hex: "#673AB7" },
        indigo: { hex: "#3F51B5" },
        blue: { hex: "#2196F3" },
        lightBlue: { hex: "#03A9F4" },
        cyan: { hex: "#00BCD4" },
        teal: { hex: "#009688" },
        green: { hex: "#4CAF50" },
        lightGreen: { hex: "#8BC34A" },
        lime: { hex: "#CDDC39" },
        yellow: { hex: "#FFEB3B" },
        amber: { hex: "#FFC107" },
        orange: { hex: "#FF9800" },
        deepOrange: { hex: "#FF5722" },
        brown: { hex: "#795548" },
        gray: { hex: "#9E9E9E" },
    };

    static rainbow = {
        r: { r: 255, g: 0, b: 0 },
        rg: { r: 255, g: 128, b: 0 },
        gr: { r: 128, g: 255, b: 0 },
        g: { r: 0, g: 255, b: 0 },
        gb: { r: 0, g: 255, b: 128 },
        bg: { r: 0, g: 128, b: 255 },
        b: { r: 0, g: 0, b: 255 },
        br: { r: 128, g: 0, b: 255 },
        rb: { r: 255, g: 0, b: 128 },
    };

    static flatUI = {
        turquoise: { hex: "#1abc9c", },
        emerald: { hex: "#2ecc71", },
        peterRiver: { hex: "#3498db", },
        amethyst: { hex: "#9b59b6", },
        wetAsphalt: { hex: "#34495e", },
        greenSea: { hex: "#16a085", },
        nephritis: { hex: "#27ae60", },
        belizeHole: { hex: "#2980b9", },
        wisteria: { hex: "#8e44ad", },
        midnightBlue: { hex: "#2c3e50", },
        sunFlower: { hex: "#f1c40f", },
        carrot: { hex: "#e67e22", },
        alizarin: { hex: "#e74c3c", },
        clouds: { hex: "#ecf0f1", },
        concrete: { hex: "#95a5a6", },
        orange: { hex: "#f39c12", },
        pumpkin: { hex: "#d35400", },
        pomegranate: { hex: "#c0392b", },
        silver: { hex: "#bdc3c7", },
        asbestos: { hex: "#7f8c8d", },
    };

    static vintage = {
        dustyRose: { hex: "#a1887f", },
        antiquePink: { hex: "#b67e7e", },
        sageGreen: { hex: "#8b9862", },
        taupe: { hex: "#6d4c41", },
        paleBlue: { hex: "#a2c1cf", },
        peach: { hex: "#f5cba7", },
        champagne: { hex: "#f3e0ac", },
        oldLavender: { hex: "#867ba9", },
        burntSienna: { hex: "#ec6d51", },
        oliveGreen: { hex: "#8a8666", },
    };
}


export abstract class Random {

    static value(min: number, max: number): RandomValue {
        return {
            type: 'random',
            min,
            max,
        };
    }
}