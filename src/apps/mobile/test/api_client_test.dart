import 'dart:convert';
import 'dart:io';

import 'package:doculyra_mobile/api_client.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  test(
    'binds CSRF, workspace, purpose and idempotency request context',
    () async {
      final requests = <http.Request>[];
      final api = DoculyraApi(
        baseUrl: 'https://doculyra.example.test/api',
        client: MockClient((request) async {
          requests.add(request);
          switch (request.url.path) {
            case '/api/auth/register':
              return http.Response(
                jsonEncode({
                  'authenticated': true,
                  'onboardingComplete': false,
                  'account': {
                    'id': 'id_a',
                    'displayName': 'Synthetic Owner',
                    'email': 'owner@example.test',
                  },
                }),
                201,
                headers: {
                  'set-cookie': 'dm_session=session-a; HttpOnly; Path=/',
                  'x-csrf-token': 'csrf-a',
                },
              );
            case '/api/workspace':
              return http.Response(
                jsonEncode({
                  'id': 'wrk_a',
                  'name': 'Synthetic household',
                  'type': 'FAMILY',
                }),
                200,
                headers: {
                  'set-cookie': 'dm_session=session-b; HttpOnly; Path=/',
                  'x-csrf-token': 'csrf-b',
                },
              );
            case '/api/dashboard':
              return http.Response('{}', 200);
            case '/api/auth/logout':
              return http.Response('{"signedOut":true}', 200);
            default:
              return http.Response('{}', 404);
          }
        }),
      );

      await api.register(
        'Synthetic Owner',
        'owner@example.test',
        'synthetic-password',
      );
      await api.configureWorkspace('Synthetic household', 'FAMILY');
      await api.dashboard();
      await api.logout();

      final registration = requests[0];
      expect(registration.headers['x-csrf-token'], isNull);
      expect(registration.headers['x-workspace-id'], isNull);

      final creation = requests[1];
      expect(creation.headers['cookie'], 'dm_session=session-a');
      expect(creation.headers['x-csrf-token'], 'csrf-a');
      expect(creation.headers['idempotency-key'], isNotEmpty);
      expect(creation.headers['x-workspace-id'], isNull);

      final dashboard = requests[2];
      expect(dashboard.headers['cookie'], 'dm_session=session-b');
      expect(dashboard.headers['x-workspace-id'], 'wrk_a');
      expect(dashboard.headers['x-purpose-id'], 'PUR-P1-001');

      final logout = requests[3];
      expect(logout.headers['x-csrf-token'], 'csrf-b');
      expect(logout.headers['x-workspace-id'], 'wrk_a');
      expect(logout.headers['idempotency-key'], isNotEmpty);
      api.close();
    },
  );

  test('retains an explicit upload operation key across retry and rotates for a new acquisition', () async {
    final requests = <http.Request>[];
    final api = DoculyraApi(
      baseUrl: 'https://doculyra.example.test/api',
      client: MockClient((request) async {
        requests.add(request);
        return http.Response('{"id":"document_synthetic_001"}', 201);
      }),
    );
    final directory = await Directory.systemTemp.createTemp('doculyra-mobile-upload-');
    final file = File('${directory.path}/synthetic.txt');
    await file.writeAsString('synthetic capture');
    try {
      final firstKey = api.newOperationKey();
      await api.upload(file, ['subject_synthetic_001'], 'FILE', true, firstKey);
      await api.upload(file, ['subject_synthetic_001'], 'FILE', true, firstKey);
      final secondKey = api.newOperationKey();
      await api.upload(file, ['subject_synthetic_001'], 'FILE', true, secondKey);
      expect(requests.map((request) => request.headers['idempotency-key']).toList(), [firstKey, firstKey, secondKey]);
      expect(secondKey, isNot(firstKey));
    } finally {
      api.close();
      await directory.delete(recursive: true);
    }
  });
}
