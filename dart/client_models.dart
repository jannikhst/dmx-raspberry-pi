import 'dart:convert';

import 'server_models.dart';
import 'proxy_requests.dart';

class LColor {
  final ChannelValue r;
  final ChannelValue g;
  final ChannelValue b;

  //TODO: enable this when using flutter framework
  // LColor.fromColor(Color color)
  //     : r = NumValue(color.red),
  //       g = NumValue(color.green),
  //       b = NumValue(color.blue);

  LColor.intRGB(int r, int g, int b)
      : r = NumValue(r),
        g = NumValue(g),
        b = NumValue(b);

  LColor.rgb({required this.r, required this.g, required this.b});

  LColor.hex(String hex)
      : r = int.parse(hex.substring(1, 3), radix: 16).value,
        g = int.parse(hex.substring(3, 5), radix: 16).value,
        b = int.parse(hex.substring(5, 7), radix: 16).value;

  const LColor.black()
      : r = const NumValue.zero(),
        g = const NumValue.zero(),
        b = const NumValue.zero();

  const LColor.white()
      : r = const NumValue.full(),
        g = const NumValue.full(),
        b = const NumValue.full();

  String toHex() {
    final red = _channelValueToNum(r).toInt();
    final green = _channelValueToNum(g).toInt();
    final blue = _channelValueToNum(b).toInt();

    final hexR = red.toRadixString(16).padLeft(2, '0');
    final hexG = green.toRadixString(16).padLeft(2, '0');
    final hexB = blue.toRadixString(16).padLeft(2, '0');
    return '#$hexR$hexG$hexB';
  }

  double _channelValueToNum(ChannelValue value) {
    if (value is VolumeWhitespace) {
      return value.factor * 255;
    }
    return _valueToInt(value as Value).toDouble();
  }

  int _valueToInt(Value value) {
    if (value is NumValue) {
      return value.value;
    }
    if (value is RandomValue) {
      return value.value;
    }
    return 0;
  }
  //TODO: enable this when using flutter framework
  // Color toColor() {
  //   return Color.fromRGBO(
  //     _channelValueToNum(r).toInt(),
  //     _channelValueToNum(g).toInt(),
  //     _channelValueToNum(b).toInt(),
  //     1,
  //   ).toLED;
  // }

  @override
  int get hashCode => r.hashCode ^ g.hashCode ^ b.hashCode;

  @override
  bool operator ==(Object other) {
    if (other is LColor) {
      return other.r == r && other.g == g && other.b == b;
    }
    return false;
  }
}

abstract class Wait {
  static WaitActionOut time(Time time) => WaitActionOut(time: time);
}

abstract class Fixture extends Mapable {
  Fixture();

  static Fixture fromMap(Map<String, dynamic> map) {
    if (map.containsKey('fixtures')) {
      return Group.fromMap(map);
    } else {
      return RGBFixture.fromMap(map);
    }
  }

  SetActionOut set({required LColor color});
  FadeActionOut fade({required LColor color, required Time time});

  SetActionOut blackout() => set(color: LColors.black);

  SetActionOut full() => set(color: LColors.white);

  FadeActionOut fadeBlackout({required Time time}) =>
      fade(color: LColors.black, time: time);

  SubSequenceOut strobo({
    LColor color = const LColor.white(),
    Time time = const NumTime.ms75(),
    int count = 10,
  }) {
    final actions = <ActionOut>[];
    for (var i = 0; i < count; i++) {
      actions.add(set(color: color));
      actions.add(Wait.time(time));
      actions.add(set(color: LColors.black));
      actions.add(Wait.time(time));
    }
    return SubSequenceOut(count: count.value, actions: actions);
  }

  SubSequenceOut stroboFade({
    LColor color = const LColor.white(),
    Time time = const NumTime.ms200(),
    int count = 10,
  }) {
    final actions = <ActionOut>[];
    for (var i = 0; i < count; i++) {
      actions.add(fade(color: color, time: time));
      actions.add(Wait.time(time));
      actions.add(fade(color: LColors.black, time: time));
      actions.add(Wait.time(time));
    }
    return SubSequenceOut(count: count.value, actions: actions);
  }

  SubSequenceOut rainbow({
    Time time = const NumTime.ms1000(),
    int count = 5,
    required List<LColor> colors,
  }) {
    final actions = <ActionOut>[];
    for (var color in colors) {
      actions.add(fade(color: color, time: time));
    }
    return SubSequenceOut(count: count.value, actions: actions);
  }

  SubSequenceOut colorStrobe({
    required List<LColor> colors,
    Time time = const NumTime.ms75(),
    int count = 10,
  }) {
    final actions = <ActionOut>[];
    for (var color in colors) {
      actions.add(set(color: color));
      actions.add(Wait.time(time));
    }
    return SubSequenceOut(count: count.value, actions: actions);
  }
}

extension IntToValue on int {
  Value get value => NumValue(this);
  Time get time => NumTime(this);
}

typedef ColorPalette = Map<String, LColor>;

abstract class Subsequence {
  static loop(Value count, List<ActionType> actions) =>
      SubSequenceOut(count: count, actions: actions);

  static oneOf(List<ActionType> action) => RandomWrapper(options: action);

  static once(List<ActionType> action) => SubSequenceOut(
        count: 1.value,
        actions: action,
      );
}

class RGBFixture extends Fixture {
  final int _channelR;
  final int _channelG;
  final int _channelB;

  ChannelValue _r = const NumValue.zero();
  ChannelValue _g = const NumValue.zero();
  ChannelValue _b = const NumValue.zero();

  RGBFixture.channels({
    required int channelR,
    required int channelG,
    required int channelB,
  })  : _channelR = channelR,
        _channelG = channelG,
        _channelB = channelB;

  RGBFixture.fromMap(Map<String, dynamic> map)
      : _channelR = map['channelR'],
        _channelG = map['channelG'],
        _channelB = map['channelB'],
        _r = parseChannelValue(map['values']['r']),
        _g = parseChannelValue(map['values']['g']),
        _b = parseChannelValue(map['values']['b']);

  @override
  FadeActionOut fade({required LColor color, required Time time}) {
    _setColor(color);
    return FadeActionOut(
      time: time,
      channels: channels,
    );
  }

  @override
  int get hashCode =>
      _channelR.hashCode ^ _channelG.hashCode ^ _channelB.hashCode;

  @override
  SetActionOut set({required LColor color}) {
    _setColor(color);
    return SetActionOut(channels: channels);
  }

  void _setColor(LColor color) {
    _r = color.r;
    _g = color.g;
    _b = color.b;
  }

  Channels get channels => {
        _channelR.toString(): _r,
        _channelG.toString(): _g,
        _channelB.toString(): _b,
      };

  @override
  Map<String, dynamic> toMap() {
    return {
      'channelR': _channelR,
      'channelG': _channelG,
      'channelB': _channelB,
      'values': {
        'r': _r.toMap(),
        'g': _g.toMap(),
        'b': _b.toMap(),
      },
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is RGBFixture &&
        other._channelR == _channelR &&
        other._channelG == _channelG &&
        other._channelB == _channelB;
  }
}

Future<void> sendData({int? ms, double? rms}) async {
  final json = jsonEncode({
    'ms': ms,
    'rms': rms,
  });
  final headers = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
  };
  await ProxyRequest.post(
      subpath: 'data?allowed=true', headers: headers, body: json);
}

Future<void> executeSequence(SequenceOut sequence) async {
  final json = jsonEncode(sequence.toMap());
  final headers = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
  };
  await ProxyRequest.post(subpath: 'dmx', headers: headers, body: json);
}

final middle = RGBFixture.channels(
  channelR: 1,
  channelG: 0,
  channelB: 2,
);

final teamA = RGBFixture.channels(
  channelR: 4,
  channelG: 3,
  channelB: 5,
);

final teamB = RGBFixture.channels(
  channelR: 7,
  channelG: 6,
  channelB: 8,
);

final stripes = RGBFixture.channels(
  channelR: 10,
  channelG: 9,
  channelB: 11,
);

class Group extends Fixture {
  final List<RGBFixture> rgbfixtures;

  Group(this.rgbfixtures);

  Group.fromMap(Map<String, dynamic> map)
      : rgbfixtures = List.from(map['fixtures'])
            .map((e) => RGBFixture.fromMap(e))
            .toList();

  @override
  FadeActionOut fade({required LColor color, required Time time}) {
    final actions =
        rgbfixtures.map((fixture) => fixture.fade(color: color, time: time));
    return FadeActionOut(
      time: time,
      channels: actions
          .map((e) => e.channels)
          .reduce((value, element) => value..addAll(element)),
    );
  }

  @override
  SetActionOut set({required LColor color}) {
    final actions =
        rgbfixtures.map((fixture) => fixture.set(color: color)).toList();
    return SetActionOut(
      channels: actions
          .map((e) => e.channels)
          .reduce((value, element) => value..addAll(element)),
    );
  }

  @override
  int get hashCode {
    final codes = rgbfixtures.map((e) => e.hashCode).toList();
    codes.sort();
    return codes.reduce((a, b) => a ^ b);
  }

  @override
  Map<String, dynamic> toMap() {
    return {
      'fixtures': rgbfixtures.map((e) => e.toMap()).toList(),
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Group && other.hashCode == hashCode;
  }
}

abstract class LColors {
  static LColor black = LColor.rgb(r: 0.value, g: 0.value, b: 0.value);
  static LColor white = LColor.rgb(r: 255.value, g: 255.value, b: 255.value);
  static LColor orange = LColor.rgb(r: 255.value, g: 50.value, b: 0.value);
  static LColor gold = LColor.rgb(r: 255.value, g: 115.value, b: 0.value);
  static LColor seaGreen = LColor.rgb(r: 0.value, g: 255.value, b: 55.value);
  static LColor lavender = LColor.rgb(r: 255.value, g: 0.value, b: 255.value);
  static LColor lilac = LColor.rgb(r: 192.value, g: 128.value, b: 255.value);
  static LColor indigo = LColor.rgb(r: 75.value, g: 0.value, b: 130.value);
  static LColor lemon = LColor.rgb(r: 55.value, g: 175.value, b: 0.value);
  static LColor babyBlue = LColor.rgb(r: 122.value, g: 250.value, b: 255.value);
  static LColor pink = LColor.rgb(r: 255.value, g: 0.value, b: 35.value);
  static LColor mint = LColor.rgb(r: 50.value, g: 255.value, b: 90.value);
  static LColor peach = LColor.rgb(r: 255.value, g: 100.value, b: 0.value);
  static LColor coral = LColor.rgb(r: 255.value, g: 64.value, b: 64.value);

  static List<LColor> rainbowColors() => [
        LColor.intRGB(255, 0, 0),
        LColor.intRGB(255, 127, 0),
        LColor.intRGB(255, 255, 0),
        LColor.intRGB(0, 255, 0),
        LColor.intRGB(0, 0, 255),
        LColor.intRGB(75, 0, 130),
        LColor.intRGB(148, 0, 211),
      ];

  static List<LColor> all() => [
        orange,
        gold,
        seaGreen,
        lavender,
        lilac,
        indigo,
        lemon,
        babyBlue,
        pink,
        mint,
        peach,
        coral,
        black,
        white,
      ];
}

abstract class Sync {
  static SetActionOut set(List<SetActionOut> actions) {
    return SetActionOut(
      channels: actions.map((action) => action.channels).reduce(
        (acc, channels) {
          acc.addAll(channels);
          return acc;
        },
      ),
    );
  }

  static FadeActionOut fade(List<FadeActionOut> actions) {
    // assert all actions have the same time or all actions have TimeWhitespace
    final firstTime = actions[0].time;
    for (final action in actions) {
      final condition1 =
          action.time is num && firstTime is num && action.time == firstTime;
      final condition2 = action.time is! num && firstTime is! num;
      // one of the two conditions must be true, else throw error
      if (!(condition1 || condition2)) {
        throw Exception(
            'All actions must have the same time or all actions must have TimeWhitespace');
      }
    }
    return FadeActionOut(
      time: firstTime,
      channels: actions.map((action) => action.channels).reduce(
        (acc, channels) {
          acc.addAll(channels);
          return acc;
        },
      ),
    );
  }
}
