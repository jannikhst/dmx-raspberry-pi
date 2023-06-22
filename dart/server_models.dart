import 'dart:math';

abstract class Mapable {
  Map<String, dynamic> toMap();
}

abstract class ActionOut extends ActionType {}

abstract class ActionType extends Mapable {}

class SequenceOut extends Mapable {
  int? count;
  bool? endless;
  List<ActionType> actions;

  SequenceOut({this.count, this.endless, required this.actions});

  @override
  Map<String, dynamic> toMap() => {
        'count': count ?? 1,
        'endless': endless,
        'actions': actions.map((action) => action.toMap()).toList(),
      };

  static bool fits(Set<String> keys) => keys.containsAll(requiredKeys);

  static Set<String> get requiredKeys => {'actions'};
}

class SubSequenceOut extends ActionType {
  String type = 'subsequence';
  Value count;
  List<ActionType> actions;

  SubSequenceOut({required this.count, required this.actions});

  @override
  Map<String, dynamic> toMap() => {
        'type': type,
        'count': count.toMap(),
        'actions': actions.map((action) => action.toMap()).toList(),
      };

  static bool fits(Set<String> keys) => keys.containsAll(requiredKeys);

  static Set<String> get requiredKeys => {'actions', 'count', 'type'};
}

class FadeActionOut extends ActionOut {
  String type = 'fade';
  Map<String, ChannelValue> channels;
  Time time;

  FadeActionOut({required this.channels, required this.time});

  @override
  Map<String, dynamic> toMap() => {
        'type': type,
        'channels':
            channels.map((channel, value) => MapEntry(channel, value.toMap())),
        'time': time.toMap(),
      };

  static bool fits(Set<String> keys) => keys.containsAll(requiredKeys);

  static Set<String> get requiredKeys => {'channels', 'time', 'type'};
}

class WaitActionOut extends ActionOut {
  String type = 'wait';
  Time time;

  WaitActionOut({required this.time});

  @override
  Map<String, dynamic> toMap() => {
        'type': type,
        'time': time.toMap(),
      };

  static bool fits(Set<String> keys) => keys.containsAll(requiredKeys);

  static Set<String> get requiredKeys => {'time', 'type'};
}

class SetActionOut extends ActionOut {
  String type = 'set';
  Map<String, ChannelValue> channels;

  SetActionOut({required this.channels});

  @override
  Map<String, dynamic> toMap() => {
        'type': type,
        'channels':
            channels.map((channel, value) => MapEntry(channel, value.toMap())),
      };

  static bool fits(Set<String> keys) => keys.containsAll(requiredKeys);

  static Set<String> get requiredKeys => {'channels', 'type'};
}

class RandomWrapper extends ActionType {
  String type = 'option';
  List<ActionType> options;

  RandomWrapper({required this.options});

  @override
  Map<String, dynamic> toMap() => {
        'type': type,
        'options': options.map((option) => option.toMap()).toList(),
      };

  static bool fits(Set<String> keys) => keys.containsAll(requiredKeys);

  static Set<String> get requiredKeys => {'options', 'type'};
}

abstract class Time {
  const Time();

  dynamic toMap();
}

class NumTime extends Time {
  final num value;

  NumTime(this.value);

  const NumTime.ms75() : value = 75;

  const NumTime.ms200() : value = 200;

  const NumTime.ms1000() : value = 1000;

  @override
  toMap() => value;

  static bool fits(dynamic data) => data is num;
}

class TimeWhitespace extends Time {
  String type = 'time';
  num factor;

  TimeWhitespace({required this.factor});

  @override
  toMap() => {
        'type': type,
        'factor': factor,
      };

  static bool fits(Set<String> keys) => keys.containsAll(requiredKeys);

  static Set<String> get requiredKeys => {'type', 'factor'};
}

class VolumeWhitespace extends ChannelValue {
  String type = 'volume';
  double factor;

  VolumeWhitespace({required this.factor});

  @override
  toMap() => {
        'type': type,
        'factor': factor,
      };

  static bool fits(Set<String> keys) => keys.containsAll(requiredKeys);

  static Set<String> get requiredKeys => {'type', 'factor'};
}

class RandomValue extends Value {
  String type = 'random';
  int min;
  int max;

  RandomValue({required this.min, required this.max});

  int get value => min + Random().nextInt(max - min);

  @override
  toMap() => {
        'type': type,
        'min': min,
        'max': max,
      };

  static bool fits(Set<String> keys) => keys.containsAll(requiredKeys);

  static Set<String> get requiredKeys => {'type', 'min', 'max'};
}

typedef Channels = Map<String, ChannelValue>;

abstract class Value extends ChannelValue {
  const Value();
}

class NumValue extends Value {
  final int value;

  NumValue(this.value);

  const NumValue.zero() : value = 0;

  const NumValue.full() : value = 255;

  @override
  toMap() => value;

  static bool fits(dynamic data) => data is num;
}

abstract class ChannelValue {
  const ChannelValue();
  dynamic toMap();
}

bool isActionOut(Map<String, dynamic> map) {
  final keys = map.keys.toSet();
  if (SetActionOut.fits(keys)) return true;
  if (FadeActionOut.fits(keys)) return true;
  if (WaitActionOut.fits(keys)) return true;
  return false;
}

bool isSubSequenceOut(Map<String, dynamic> map) {
  final keys = map.keys.toSet();
  if (SubSequenceOut.fits(keys)) return true;
  return false;
}

bool isActionType(Map<String, dynamic> map) {
  final keys = map.keys.toSet();
  if (isActionOut(map)) return true;
  if (SubSequenceOut.fits(keys)) return true;
  if (SequenceOut.fits(keys)) return true;
  if (RandomWrapper.fits(keys)) return true;
  return false;
}

bool isChannelValue(dynamic data) {
  if (data is Map) {
    final keys = data.keys.map((e) => e.toString()).toSet();
    if (RandomValue.fits(keys)) return true;
    if (VolumeWhitespace.fits(keys)) return true;
  }
  if (NumValue.fits(data)) return true;
  return false;
}

bool isTime(dynamic data) {
  if (data is Map) {
    final keys = data.keys.map((e) => e.toString()).toSet();
    if (TimeWhitespace.fits(keys)) return true;
  }
  if (NumTime.fits(data)) return true;
  return false;
}

bool isValue(dynamic data) {
  if (data is Map) {
    final keys = data.keys.map((e) => e.toString()).toSet();
    if (RandomValue.fits(keys)) return true;
  }
  if (NumValue.fits(data)) return true;
  return false;
}

SequenceOut parseSequenceOut(Map<String, dynamic> map) {
  return SequenceOut(
    endless: map['endless'],
    count: map['count'],
    actions: List.from(map['actions'])
        .map<ActionType>((action) => parseActions(action))
        .toList(),
  );
}

ActionType parseActions(dynamic data) {
  final map = Map<String, dynamic>.from(data);
  final type = map['type'];
  if (type == 'option') {
    return RandomWrapper(
      options: List.from(map['options'])
          .map<ActionType>((option) => parseActions(option))
          .toList(),
    );
  }
  if (type == 'subsequence') {
    return SubSequenceOut(
      count: parseValue(data['count']),
      actions: List.from(map['actions'])
          .map<ActionType>((action) => parseActions(action))
          .toList(),
    );
  }
  if (type == 'fade') {
    return FadeActionOut(
      channels: parseChannels(map['channels']),
      time: parseTime(map['time']),
    );
  }
  if (type == 'wait') {
    return WaitActionOut(
      time: parseTime(map['time']),
    );
  }
  if (type == 'set') {
    return SetActionOut(
      channels: parseChannels(map['channels']),
    );
  }
  throw Exception('Could not parse action: $type');
}

Channels parseChannels(Map<String, dynamic> map) {
  return map.map(
    (channel, value) => MapEntry(channel, parseChannelValue(value)),
  );
}

Time parseTime(dynamic data) {
  if (data is Map) {
    final keys = data.keys.map((e) => e.toString()).toSet();
    if (TimeWhitespace.fits(keys)) {
      return TimeWhitespace(
        factor: data['factor'],
      );
    }
  }
  if (NumTime.fits(data)) {
    return NumTime(data);
  }
  throw Exception('Could not parse time');
}

Value parseValue(dynamic data) {
  if (data is Map) {
    final keys = data.keys.map((e) => e.toString()).toSet();
    if (RandomValue.fits(keys)) {
      return RandomValue(
        min: data['min'],
        max: data['max'],
      );
    }
  }
  if (NumValue.fits(data)) {
    return NumValue(data);
  }
  throw Exception('Could not parse value: $data');
}

ChannelValue parseChannelValue(dynamic data) {
  if (data is Map) {
    final keys = data.keys.map((e) => e.toString()).toSet();
    if (RandomValue.fits(keys)) {
      return RandomValue(
        min: data['min'],
        max: data['max'],
      );
    }
    if (VolumeWhitespace.fits(keys)) {
      return VolumeWhitespace(
        factor: data['factor'],
      );
    }
  }
  if (NumValue.fits(data)) {
    return NumValue(data);
  }
  throw Exception('Could not parse channel value');
}
