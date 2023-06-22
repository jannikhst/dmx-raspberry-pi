//TODO: import http package

import 'package:http/http.dart' as http;

class ProxyRequest {
  static const String primaryUrl = 'https://ssl.yucca.pro';
  static const String proxyUrl = 'https://proxy.yucca.pro';
  static Duration timeout = const Duration(milliseconds: 2000);
  static bool useProxyByDefault = true;

  static Future<void> init() async {
    try {
      final Uri url = Uri.parse('$primaryUrl/status');
      await http.get(url).timeout(const Duration(seconds: 3));
      useProxyByDefault = false;
    } catch (e) {
      final Uri url = Uri.parse('$proxyUrl/');
      await http.get(url);
      useProxyByDefault = true;
    }
    print('useProxyByDefault: $useProxyByDefault');
  }

  static Future<http.Response?> get({
    required String subpath,
    Map<String, String> headers = const {},
  }) async {
    final Uri url2 = Uri.parse('$proxyUrl/$subpath');
    if (useProxyByDefault) {
      final f2 = http.get(url2, headers: headers);
      try {
        return await f2;
      } catch (e) {
        print('proxy url failed, switching proxy settings');
        useProxyByDefault = !useProxyByDefault;
        print('useProxyByDefault: $useProxyByDefault');
      }
    }

    final Uri url1 = Uri.parse('$primaryUrl/$subpath');
    final f1 = http.get(url1, headers: headers);

    try {
      return await f1.timeout(timeout);
    } catch (e) {
      print('primary url failed, switching to proxy');
      useProxyByDefault = !useProxyByDefault;
      print('useProxyByDefault: $useProxyByDefault');
    }
    final f2 = http.get(url2, headers: headers);
    try {
      return await f2;
    } catch (e) {
      print('proxy url failed');
    }
    return null;
  }

  static Future<void> post({
    required String subpath,
    required Map<String, String> headers,
    required Object? body,
  }) async {
    final Uri url2 = Uri.parse('$proxyUrl/$subpath');
    if (useProxyByDefault) {
      final f2 = http.post(url2, headers: headers, body: body);
      try {
        await f2;
        return;
      } catch (e) {
        print('proxy url failed, switching proxy settings');
        useProxyByDefault = !useProxyByDefault;
        print('useProxyByDefault: $useProxyByDefault');
      }
    }

    final Uri url1 = Uri.parse('$primaryUrl/$subpath');
    final f1 = http.post(url1, headers: headers, body: body);

    try {
      await f1.timeout(timeout);
    } catch (e) {
      print('primary url failed, switching to proxy');
      useProxyByDefault = !useProxyByDefault;
      print('useProxyByDefault: $useProxyByDefault');
    }
    final f2 = http.post(url2, headers: headers, body: body);
    try {
      await f2;
      return;
    } catch (e) {
      print('proxy url failed');
    }
  }
}
