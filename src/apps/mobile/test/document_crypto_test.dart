import 'dart:convert';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';
import 'package:doculyra_mobile/security/document_crypto.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test(
    'matches the React/TypeScript language-neutral envelope vector',
    () async {
      final crypto = DocumentCrypto();
      const context = DocumentCryptoContext(
        workspaceId: 'wrk_vector_001',
        documentId: 'doc_vector_001',
        mediaType: 'text/plain',
      );
      final envelope = await crypto.encrypt(
        Uint8List.fromList(
          utf8.encode('Synthetic household policy number SYN-1001'),
        ),
        context,
        SecretKey(List<int>.generate(32, (index) => index)),
        'device-vector-001',
        documentKey: List<int>.generate(32, (index) => 255 - index),
        documentIv: List<int>.generate(12, (index) => index + 1),
        keyIv: List<int>.generate(12, (index) => index + 21),
      );
      expect(
        envelope.ciphertext,
        'vIfDqJpdp0rclFR1G3L+EgqxPVfQfAs9fdovGKLT9ll/cbnx3R+ESSXxzrPQrStAf0QoII13QI81nw==',
      );
      expect(
        envelope.wrappedKey,
        'xJdMlFyvm6gGHn398HcQ/QgqegJysaluwAWrCp1ba/mL7mOLVkAKqPhEBSxoiIVE',
      );
      expect(
        utf8.decode(
          await crypto.decrypt(
            envelope,
            context,
            SecretKey(List<int>.generate(32, (index) => index)),
          ),
        ),
        'Synthetic household policy number SYN-1001',
      );
    },
  );

  test(
    're-wraps an unchanged ciphertext for an authorized recipient',
    () async {
      final crypto = DocumentCrypto();
      const context = DocumentCryptoContext(
        workspaceId: 'wrk_vector_001',
        documentId: 'doc_vector_001',
        mediaType: 'text/plain',
      );
      final ownerKey = SecretKey(List<int>.generate(32, (index) => index));
      final recipientKey = SecretKey(
        List<int>.generate(32, (index) => (index + 71) % 256),
      );
      final envelope = await crypto.encrypt(
        Uint8List.fromList(utf8.encode('Synthetic shared household policy')),
        context,
        ownerKey,
        'device-owner-001',
      );

      final recipientEnvelope = await crypto.rewrapForRecipient(
        envelope,
        context,
        ownerKey,
        recipientKey,
        'member-recipient-001',
        keyIv: List<int>.generate(12, (index) => index + 31),
      );

      expect(recipientEnvelope.ciphertext, envelope.ciphertext);
      expect(recipientEnvelope.wrappingKeyId, 'member-recipient-001');
      expect(
        utf8.decode(
          await crypto.decrypt(recipientEnvelope, context, recipientKey),
        ),
        'Synthetic shared household policy',
      );
      await expectLater(
        crypto.decrypt(recipientEnvelope, context, ownerKey),
        throwsA(isA<StateError>()),
      );
    },
  );
}
