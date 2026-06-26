export type EmployerFieldKind =
  | 'text'
  | 'name'
  | 'mobile'
  | 'pincode'
  | 'cityState'
  | 'gst'
  | 'pan'
  | 'url';

export function sanitizeEmployerInput(value: string, kind: EmployerFieldKind = 'text') {
  switch (kind) {
    case 'mobile':
      return value.replace(/\D/g, '').slice(0, 10);
    case 'pincode':
      return value.replace(/\D/g, '').slice(0, 6);
    case 'cityState':
      return value.replace(/[^a-zA-Z\s.-]/g, '').replace(/\s{2,}/g, ' ');
    case 'name':
      return value.replace(/[^a-zA-Z0-9\s.&'-]/g, '').replace(/\s{2,}/g, ' ');
    case 'gst':
      return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15);
    case 'pan':
      return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
    case 'url':
      return value.replace(/\s/g, '');
    default:
      return value;
  }
}

export function getInputMode(kind: EmployerFieldKind): React.HTMLAttributes<HTMLInputElement>['inputMode'] {
  if (kind === 'mobile' || kind === 'pincode') return 'numeric';
  if (kind === 'url') return 'url';
  return 'text';
}
