export function toIsoDateTime(value: Date): string {
  return value.toISOString().slice(0, 19);
}

export function toApiLocalDateTime(value: string): string {
  // Input from datetime-local comes as yyyy-MM-ddTHH:mm
  if (!value.includes(':')) {
    return value;
  }

  return value.length === 16 ? `${value}:00` : value;
}
