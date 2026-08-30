import 'package:doculyra_mobile/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('contained documents use a generic fail-closed library description', () {
    final document = VaultDocument.fromJson({
      'id': 'doc-contained',
      'name': 'Contained item',
      'category': 'Contained',
      'status': 'POLICY_HOLD',
      'subjectIds': <String>[],
    });

    expect(document.isContained, isTrue);
    expect(
      document.libraryDescription,
      'Contained; action unavailable under current policy.',
    );
    expect(
      document.libraryDescription,
      isNot(matches(RegExp(r'release|approve|override|safe|malware|clinical', caseSensitive: false))),
    );
  });

  test('ordinary documents retain their authorised category description', () {
    final document = VaultDocument.fromJson({
      'id': 'doc-clean',
      'name': 'Clean item',
      'category': 'Identity',
      'status': 'NEEDS_REVIEW',
      'subjectIds': <String>[],
    });

    expect(document.isContained, isFalse);
    expect(document.libraryDescription, 'Identity');
  });
}
