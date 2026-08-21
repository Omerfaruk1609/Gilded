export class TurkishTextNormalizer {
  static LEET_MAP = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '@': 'a',
    '$': 's'
  };

  /**
   * Metni leetspeak, noktalama hileleri ve tekrarlayan harflerden arındırır.
   */
  static normalize(rawText) {
    if (!rawText) return '';

    // 0. Türkçe karakter küçültme ve combining dot temizliği
    let text = rawText
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı')
      .toLocaleLowerCase('tr-TR')
      .replace(/\u0307/g, '')
      .trim();

    // 1. Leetspeak dönüşümü (s4l4m -> salam, @ -> a, $ -> s)
    text = text.replace(/[013457@$]/g, (match) => this.LEET_MAP[match] || match);

    // 2. Harf ve rakam aralarına konan nokta, tire, alt çizgi, boşluk hilelerini kaldırma (s.e.l.a.m -> selam)
    text = text.replace(/([a-zçğıöşü0-9])[\.\-_ ]+(?=[a-zçğıöşü0-9])/gi, '$1');

    // 3. Ardışık 3+ harf tekrarlarını 2 harfe düşürme (salaaaaam -> salaam)
    text = text.replace(/(.)\1{2,}/gu, '$1$1');

    return text;
  }
}
