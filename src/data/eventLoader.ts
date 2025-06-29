import type { RiftEvent } from './types';

export async function loadEvent(eventId: string): Promise<RiftEvent> {
  const response = await fetch(`${import.meta.env.BASE_URL}events/${eventId}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load event: ${eventId}`);
  }
  const data = await response.json();
  return data as RiftEvent;
}
