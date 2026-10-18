import { isBookingDateTime, isBookingLink } from '../../types/trip-planning';
export const readBookingForm = (form: HTMLFormElement) => {
  const fields = new FormData(form);
  const name = fields.get('name');
  const details = fields.get('details');
  const dateTime = fields.get('dateTime');
  const bookingReference = fields.get('bookingReference');
  const link = fields.get('link');
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof details !== 'string' ||
    !isBookingDateTime(dateTime) ||
    typeof bookingReference !== 'string' ||
    !isBookingLink(link)
  ) {
    return null;
  }
  const pastedLink =
    name.trim().startsWith('http') && isBookingLink(name.trim()) ? name.trim() : '';
  return { name: name.trim(), details, dateTime, bookingReference, link: link || pastedLink };
};
