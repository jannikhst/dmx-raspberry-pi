export type ActionOut = FadeActionOut | WaitActionOut | SetActionOut;

export type ActionType = ActionOut | SubSequenceOut | RandomWrapper;

export interface SequenceOut {
    name?: string;
    count?: number;
    endless?: boolean;
    actions: ActionType[];
}

export interface SubSequenceOut {
    type: 'subsequence';
    count: Value;
    actions: ActionType[];
}

export interface FadeActionOut {
    type: 'fade';
    channels: Channels;
    time: Time;
}

export interface WaitActionOut {
    type: 'wait';
    time: Time;
}

export interface SetActionOut {
    type: 'set';
    channels: Channels;
}

export interface RandomWrapper {
    type: 'option';
    options: ActionType[];
}

export type Time = number | TimeWhitespace;

export interface TimeWhitespace {
    type: 'time';
    factor: number;
}

export interface VolumeWhitespace {
    type: 'volume';
    factor: number;
}

export interface RandomValue {
    type: 'random';
    min: number;
    max: number;
}

export type Channels = { [key: string]: ChannelValue };

export type Value = number | RandomValue;
export type ChannelValue = Value | VolumeWhitespace;

export function parseSequence(data: { [key: string]: any }): SequenceOut {
    return {
        count: data.count,
        endless: data.endless,
        actions: data.actions.map((action: any) => recursiveParse(action))
    }
}


function parseValue(data: any): Value {
    if (isRandomValue(data)) {
        return {
            type: 'random',
            min: data.min,
            max: data.max
        }
    }
    return data;
}

function parseChannels(data: { [key: string]: any }): Channels {
    const channels: Channels = {};
    for (const key in data) {
        channels[key] = parseChannelValue(data[key]);
    }
    return channels;
}

function parseChannelValue(data: any): ChannelValue {
    if (isVolumeWhitespace(data)) {
        return {
            type: 'volume',
            factor: data.factor
        }
    }
    return parseValue(data); 
}


function recursiveParse(data: { [key: string]: any }): ActionType {
    if (data.type === 'subsequence') {
        return {
            type: 'subsequence',
            count: parseValue(data.count),
            actions: data.actions.map((action: any) => recursiveParse(action))
        }
    }
    if (data.type === 'option') {
        return {
            type: 'option',
            options: data.options.map((action: any) => recursiveParse(action))
        }
    }
    if (data.type === 'fade') {
        return {
            type: 'fade',
            channels: parseChannels(data.channels),
            time: data.time
        }
    }
    if (data.type === 'wait') {
        return {
            type: 'wait',
            time: data.time
        }
    }
    if (data.type === 'set') {
        return {
            type: 'set',
            channels: parseChannels(data.channels),
        }
    }
    console.log(data);
    throw new Error('Unknown action');
}



export function isSubSequenceOut(action: ActionType): action is SubSequenceOut {
    return action.type === 'subsequence';
}

export function isRandomWrapper(action: ActionType): action is RandomWrapper {
    return action.type === 'option';
}

export function isActionOut(action: ActionType): action is ActionOut {
    return action.type === 'fade' || action.type === 'set' || action.type === 'wait';
}

export function isFadeActionOut(action: ActionType): action is FadeActionOut {
    return action.type === 'fade';
}

export function isSetActionOut(action: ActionType): action is SetActionOut {
    return action.type === 'set';
}

export function isWaitActionOut(action: ActionType): action is WaitActionOut {
    return action.type === 'wait';
}

export function isRandomValue(value: any): value is RandomValue {
    return value !== undefined && typeof value !== 'number' && 'max' in value && 'min' in value;
}

export function isVolumeWhitespace(value: any): value is VolumeWhitespace {
    return value !== undefined && typeof value !== 'number' && 'factor' in value;
}