// ignore_for_file: prefer_initializing_formals

import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

const defaultApiOrigin = String.fromEnvironment(
  'DOCULYRA_API_URL',
  defaultValue: 'http://127.0.0.1:4310/api',
);

class ApiException implements Exception {
  const ApiException(this.message, this.statusCode);
  final String message;
  final int statusCode;
  @override
  String toString() => message;
}

class DoculyraApi {
  DoculyraApi({String baseUrl = defaultApiOrigin, http.Client? client})
    : _baseUrl = baseUrl,
      _client = client ?? http.Client();
  final String _baseUrl;
  final http.Client _client;
  String? _cookie;

  Uri _uri(String path) => Uri.parse('$_baseUrl$path');
  Map<String, String> _headers({bool json = false}) {
    final result = <String, String>{};
    if (json) result['content-type'] = 'application/json';
    final cookie = _cookie;
    if (cookie != null) result['cookie'] = cookie;
    return result;
  }

  void _captureCookie(http.BaseResponse response) {
    final value = response.headers['set-cookie'];
    if (value == null) return;
    final cookie = value.split(';').first;
    _cookie = cookie.endsWith('=') ? null : cookie;
  }

  Map<String, dynamic> _decode(http.Response response) {
    _captureCookie(response);
    final body = response.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        body['message']?.toString() ?? 'Request failed',
        response.statusCode,
      );
    }
    return body;
  }

  Future<Map<String, dynamic>> _json(
    String path, {
    String method = 'GET',
    Object? body,
  }) async {
    final request = http.Request(method, _uri(path))
      ..headers.addAll(_headers(json: body != null));
    if (body != null) request.body = jsonEncode(body);
    final streamed = await _client.send(request);
    return _decode(await http.Response.fromStream(streamed));
  }

  Future<Map<String, dynamic>> session() => _json('/auth/session');
  Future<Map<String, dynamic>> register(
    String name,
    String email,
    String password,
  ) => _json(
    '/auth/register',
    method: 'POST',
    body: {'displayName': name, 'email': email, 'password': password},
  );
  Future<Map<String, dynamic>> login(String email, String password) => _json(
    '/auth/login',
    method: 'POST',
    body: {'email': email, 'password': password},
  );
  Future<void> logout() async => _json('/auth/logout', method: 'POST');
  Future<Map<String, dynamic>> configureWorkspace(String name, String type) =>
      _json('/workspace', method: 'PATCH', body: {'name': name, 'type': type});
  Future<Map<String, dynamic>> dashboard() => _json('/dashboard');
  Future<Map<String, dynamic>> ask(String question) => _json(
    '/assistant/questions',
    method: 'POST',
    body: {'question': question},
  );
  Future<Map<String, dynamic>> restore(String documentId) =>
      _json('/documents/$documentId/restore', method: 'POST');
  Future<Map<String, dynamic>> trash(String documentId) =>
      _json('/documents/$documentId', method: 'DELETE');
  Future<Map<String, dynamic>> addManual(
    String name,
    String content,
    List<String> subjectIds,
  ) => _json(
    '/documents/manual',
    method: 'POST',
    body: {'name': name, 'content': content, 'subjectIds': subjectIds},
  );

  Future<Map<String, dynamic>> upload(
    File file,
    List<String> subjectIds,
    String captureRoute,
  ) async {
    final request = http.MultipartRequest('POST', _uri('/documents'))
      ..headers.addAll(_headers())
      ..fields['subjectIds'] = subjectIds.join(',')
      ..fields['captureRoute'] = captureRoute
      ..files.add(await http.MultipartFile.fromPath('file', file.path));
    final streamed = await _client.send(request);
    return _decode(await http.Response.fromStream(streamed));
  }

  void close() => _client.close();
}
