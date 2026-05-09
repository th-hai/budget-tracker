/**
 * Simplify noisy bank transaction content into a readable note.
 */
export function parseBankNote(content: string): string {
  if (!content) return '';

  const raw = content.trim();

  // MOMO-CASHIN-... → MOMO rut tien
  if (/^MOMO-CASHIN/i.test(raw)) return 'MOMO rut tien';

  // ZaloPay-CASHIN-... → ZaloPay rut tien
  if (/^ZaloPay-CASHIN/i.test(raw)) return 'ZaloPay rut tien';

  // VNPay / VNPAY patterns
  if (/^VNPAY/i.test(raw)) return 'VNPay thanh toan';

  // Replace full name with short name
  let note = raw.replace(/NGUYEN THANH HAI/gi, 'Hai');

  // Strip common bank prefixes/suffixes
  // MBVCB.14057515727.511409.<content>.CT tu ... toi ... tai MB- Ma GD ACS
  note = note.replace(/^MBVCB\.\d+\.\d+\.\s*/i, '');
  note = note.replace(/\.CT tu .+$/i, '');

  // MBCT <content> <reference>
  note = note.replace(/^MBCT\s+/i, '');
  note = note.replace(/\s+[A-Z0-9]{6,}\/\d+$/i, '');

  // Remove trailing reference codes like -Ma GD ACS, etc.
  note = note.replace(/[-\s]*Ma GD.*$/i, '');

  // Clean up "chuyen tien" → proper Vietnamese
  note = note.replace(/chuyen tien/gi, 'chuyen tien');

  // Trim dots, dashes, spaces
  note = note.replace(/^[\s.\-]+|[\s.\-]+$/g, '').trim();

  return note || raw;
}
