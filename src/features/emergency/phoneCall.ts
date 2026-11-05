// Open the device phone handler. The device controls call confirmation/placement.
export function openPhoneCall(phone: string): void {
  window.location.href = `tel:${phone}`
}
