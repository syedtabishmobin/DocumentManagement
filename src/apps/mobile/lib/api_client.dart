// ignore_for_file: prefer_initializing_formals

import 'dart:convert';
import 'dart:io';
import 'dart:math';

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
  String? _csrfToken;
  String? _workspaceId;
  String _workspaceCreationKey = _requestKey();

  Uri _uri(String path) => Uri.parse('$_baseUrl$path');
  static String _requestKey() {
    final random = Random.secure();
    final bytes = List<int>.generate(24, (_) => random.nextInt(256));
    return base64Url.encode(bytes);
  }

  String newOperationKey() => _requestKey();

  Map<String, String> _headers({
    bool json = false,
    String method = 'GET',
    bool workspaceContext = true,
    String? idempotencyKey,
  }) {
    final result = <String, String>{};
    if (json) result['content-type'] = 'application/json';
    final cookie = _cookie;
    if (cookie != null) result['cookie'] = cookie;
    final unsafe = !const {'GET', 'HEAD', 'OPTIONS'}.contains(method);
    final csrf = _csrfToken;
    if (unsafe && csrf != null) result['x-csrf-token'] = csrf;
    final workspaceId = _workspaceId;
    if (workspaceContext && workspaceId != null) {
      result['x-workspace-id'] = workspaceId;
      result['x-purpose-id'] = 'PUR-P1-001';
    }
    if (unsafe) result['idempotency-key'] = idempotencyKey ?? _requestKey();
    result['x-correlation-id'] = _requestKey();
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
    _csrfToken = response.headers['x-csrf-token'] ?? _csrfToken;
    final body = response.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        body['message']?.toString() ?? 'Request failed',
        response.statusCode,
      );
    }
    if (body.containsKey('authenticated')) {
      if (body['authenticated'] != true) {
        _csrfToken = null;
        _workspaceId = null;
      } else {
        _workspaceId = body['activeWorkspaceId']?.toString();
      }
    }
    return body;
  }

  Future<Map<String, dynamic>> _json(
    String path, {
    String method = 'GET',
    Object? body,
    bool workspaceContext = true,
    String? idempotencyKey,
  }) async {
    final request = http.Request(method, _uri(path))
      ..headers.addAll(
        _headers(
          json: body != null,
          method: method,
          workspaceContext: workspaceContext,
          idempotencyKey: idempotencyKey,
        ),
      );
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
    workspaceContext: false,
    body: {'displayName': name, 'email': email, 'password': password},
  );
  Future<Map<String, dynamic>> login(String email, String password) => _json(
    '/auth/login',
    method: 'POST',
    workspaceContext: false,
    body: {'email': email, 'password': password},
  );
  Future<void> logout() async {
    try {
      await _json('/auth/logout', method: 'POST');
    } finally {
      _cookie = null;
      _csrfToken = null;
      _workspaceId = null;
    }
  }

  Future<Map<String, dynamic>> configureWorkspace(
    String name,
    String type,
  ) async {
    final value = await _json(
      '/workspace',
      method: 'PATCH',
      workspaceContext: false,
      idempotencyKey: _workspaceCreationKey,
      body: {'name': name, 'type': type},
    );
    _workspaceId = value['id']?.toString();
    _workspaceCreationKey = _requestKey();
    return value;
  }

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
    bool syntheticConfirmed,
  ) => _json(
    '/documents/manual',
    method: 'POST',
    body: {
      'name': name,
      'content': content,
      'subjectIds': subjectIds,
      'syntheticConfirmed': syntheticConfirmed,
    },
  );

  Future<Map<String, dynamic>> upload(
    File file,
    List<String> subjectIds,
    String captureRoute,
    bool syntheticConfirmed,
    String idempotencyKey,
  ) async {
    final request = http.MultipartRequest('POST', _uri('/documents'))
      ..headers.addAll(
        _headers(method: 'POST', idempotencyKey: idempotencyKey),
      )
      ..fields['subjectIds'] = subjectIds.join(',')
      ..fields['captureRoute'] = captureRoute
      ..fields['syntheticConfirmed'] = syntheticConfirmed.toString()
      ..files.add(await http.MultipartFile.fromPath('file', file.path));
    final streamed = await _client.send(request);
    return _decode(await http.Response.fromStream(streamed));
  }

  Future<Map<String, dynamic>> recordRecoveryUnavailable() {
    final workspaceId = _workspaceId;
    if (workspaceId == null) {
      throw const ApiException(
        'Select a workspace before requesting recovery support',
        400,
      );
    }
    return _json('/workspaces/$workspaceId/recovery-cases', method: 'POST');
  }

  void close() => _client.close();
}
