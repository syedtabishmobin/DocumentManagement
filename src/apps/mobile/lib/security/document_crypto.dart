import 'dart:convert';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const documentCryptoSuite = 'DOCULYRA-AES-256-GCM-V1';

class DocumentCryptoContext {
  const DocumentCryptoContext({
    required this.workspaceId,
    required this.documentId,
    required this.mediaType,
  });
  final String workspaceId;
  final String documentId;
  final String mediaType;
}

class EncryptedDocumentEnvelope {
  const EncryptedDocumentEnvelope({
    required this.context,
    required this.iv,
    required this.ciphertext,
    required this.wrappingKeyId,
    required this.keyIv,
    required this.wrappedKey,
  });
  final DocumentCryptoContext context;
  final String iv;
  final String ciphertext;
  final String wrappingKeyId;
  final String keyIv;
  final String wrappedKey;

  Map<String, Object> toJson() => {
    'suite': documentCryptoSuite,
    'workspaceId': context.workspaceId,
    'documentId': context.documentId,
    'mediaType': context.mediaType,
    'iv': iv,
    'ciphertext': ciphertext,
    'key': {
      'suite': documentCryptoSuite,
      'wrappingKeyId': wrappingKeyId,
      'iv': keyIv,
      'ciphertext': wrappedKey,
    },
  };
}

class DocumentCrypto {
  DocumentCrypto({AesGcm? algorithm})
    : _algorithm = algorithm ?? AesGcm.with256bits();
  final AesGcm _algorithm;

  List<int> _documentAad(DocumentCryptoContext context) => utf8.encode(
    '$documentCryptoSuite\u001fdocument\u001f${context.workspaceId}\u001f${context.documentId}\u001f${context.mediaType}',
  );
  List<int> _keyAad(DocumentCryptoContext context, String keyId) => utf8.encode(
    '$documentCryptoSuite\u001fkey\u001f${context.workspaceId}\u001f${context.documentId}\u001f$keyId',
  );

  void _assertContext(
    EncryptedDocumentEnvelope envelope,
    DocumentCryptoContext expected,
  ) {
    if (envelope.context.workspaceId != expected.workspaceId ||
        envelope.context.documentId != expected.documentId ||
        envelope.context.mediaType != expected.mediaType) {
      throw StateError('Cryptographic context mismatch');
    }
  }

  Future<Uint8List> _unwrapDocumentKey(
    EncryptedDocumentEnvelope envelope,
    DocumentCryptoContext expected,
    SecretKey wrappingKey,
  ) async {
    try {
      final wrapped = base64Decode(envelope.wrappedKey);
      return Uint8List.fromList(
        await _algorithm.decrypt(
          SecretBox(
            wrapped.sublist(0, wrapped.length - 16),
            nonce: base64Decode(envelope.keyIv),
            mac: Mac(wrapped.sublist(wrapped.length - 16)),
          ),
          secretKey: wrappingKey,
          aad: _keyAad(expected, envelope.wrappingKeyId),
        ),
      );
    } on SecretBoxAuthenticationError {
      throw StateError('Document key authentication failed');
    }
  }

  Future<EncryptedDocumentEnvelope> encrypt(
    Uint8List plaintext,
    DocumentCryptoContext context,
    SecretKey wrappingKey,
    String wrappingKeyId, {
    List<int>? documentKey,
    List<int>? documentIv,
    List<int>? keyIv,
  }) async {
    final rawDocumentKey =
        documentKey ?? await SecretKeyData.random(length: 32).extractBytes();
    final documentNonce =
        documentIv ?? await SecretKeyData.random(length: 12).extractBytes();
    final keyNonce =
        keyIv ?? await SecretKeyData.random(length: 12).extractBytes();
    if (rawDocumentKey.length != 32 ||
        documentNonce.length != 12 ||
        keyNonce.length != 12) {
      throw StateError('Invalid cryptographic key or nonce length');
    }
    final documentBox = await _algorithm.encrypt(
      plaintext,
      secretKey: SecretKey(rawDocumentKey),
      nonce: documentNonce,
      aad: _documentAad(context),
    );
    final keyBox = await _algorithm.encrypt(
      rawDocumentKey,
      secretKey: wrappingKey,
      nonce: keyNonce,
      aad: _keyAad(context, wrappingKeyId),
    );
    return EncryptedDocumentEnvelope(
      context: context,
      iv: base64Encode(documentNonce),
      ciphertext: base64Encode([
        ...documentBox.cipherText,
        ...documentBox.mac.bytes,
      ]),
      wrappingKeyId: wrappingKeyId,
      keyIv: base64Encode(keyNonce),
      wrappedKey: base64Encode([...keyBox.cipherText, ...keyBox.mac.bytes]),
    );
  }

  Future<Uint8List> decrypt(
    EncryptedDocumentEnvelope envelope,
    DocumentCryptoContext expected,
    SecretKey wrappingKey,
  ) async {
    _assertContext(envelope, expected);
    try {
      final rawDocumentKey = await _unwrapDocumentKey(
        envelope,
        expected,
        wrappingKey,
      );
      final encrypted = base64Decode(envelope.ciphertext);
      final plaintext = await _algorithm.decrypt(
        SecretBox(
          encrypted.sublist(0, encrypted.length - 16),
          nonce: base64Decode(envelope.iv),
          mac: Mac(encrypted.sublist(encrypted.length - 16)),
        ),
        secretKey: SecretKey(rawDocumentKey),
        aad: _documentAad(expected),
      );
      return Uint8List.fromList(plaintext);
    } on SecretBoxAuthenticationError {
      throw StateError('Document authentication failed');
    }
  }

  /// Re-wraps a document key for another authorized device or member while
  /// leaving the document ciphertext unchanged and off the service plaintext path.
  Future<EncryptedDocumentEnvelope> rewrapForRecipient(
    EncryptedDocumentEnvelope envelope,
    DocumentCryptoContext expected,
    SecretKey currentWrappingKey,
    SecretKey recipientWrappingKey,
    String recipientWrappingKeyId, {
    List<int>? keyIv,
  }) async {
    _assertContext(envelope, expected);
    final rawDocumentKey = await _unwrapDocumentKey(
      envelope,
      expected,
      currentWrappingKey,
    );
    try {
      final keyNonce =
          keyIv ?? await SecretKeyData.random(length: 12).extractBytes();
      if (recipientWrappingKeyId.isEmpty || keyNonce.length != 12) {
        throw StateError('Invalid document-key envelope context');
      }
      final keyBox = await _algorithm.encrypt(
        rawDocumentKey,
        secretKey: recipientWrappingKey,
        nonce: keyNonce,
        aad: _keyAad(expected, recipientWrappingKeyId),
      );
      return EncryptedDocumentEnvelope(
        context: envelope.context,
        iv: envelope.iv,
        ciphertext: envelope.ciphertext,
        wrappingKeyId: recipientWrappingKeyId,
        keyIv: base64Encode(keyNonce),
        wrappedKey: base64Encode([...keyBox.cipherText, ...keyBox.mac.bytes]),
      );
    } finally {
      rawDocumentKey.fillRange(0, rawDocumentKey.length, 0);
    }
  }
}

class DeviceKeyStore {
  DeviceKeyStore({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();
  static const _keyName = 'doculyra.device-wrapping-key.v1';
  final FlutterSecureStorage _storage;

  Future<SecretKey> loadOrCreate() async {
    final existing = await _storage.read(key: _keyName);
    if (existing != null) return SecretKey(base64Decode(existing));
    final generated = await SecretKeyData.random(length: 32).extractBytes();
    await _storage.write(key: _keyName, value: base64Encode(generated));
    return SecretKey(generated);
  }
}
