import { describe, expect, it } from 'vitest';
import { TargetConfirmationQueue } from './targetConfirmationQueue';
import type { TargetDetection } from '../types';

function detection(
  id: string,
  type: TargetDetection['type'] = 'external_victim',
  modality: TargetDetection['modality'] = 'camera',
): TargetDetection {
  return {
    id,
    type,
    position: { x: 1, y: 2 },
    confidence: 0.8,
    modality,
    timestamp: 0,
  };
}

describe('TargetConfirmationQueue', () => {
  it('queues only target detections above the confidence threshold', () => {
    const queue = new TargetConfirmationQueue();
    expect(queue.enqueue(detection('rock', 'rock'))).toBe(false);
    expect(queue.enqueue({ ...detection('uncertain'), confidence: 0.4 })).toBe(false);
    expect(queue.enqueue(detection('victim'))).toBe(true);
    expect(queue.getState().phase).toBe('target_pending');
  });

  it('presents multiple targets in FIFO order', () => {
    const queue = new TargetConfirmationQueue();
    queue.enqueue(detection('first'));
    queue.enqueue(detection('second'));

    expect(queue.current()?.id).toBe('first');
    queue.confirm(1);
    expect(queue.current()?.id).toBe('second');
    expect(queue.getState().phase).toBe('target_pending');
  });

  it('records confirmation and enters target_confirmed when complete', () => {
    const queue = new TargetConfirmationQueue();
    queue.enqueue(detection('vehicle', 'submerged_vehicle', 'sonar'));

    const confirmed = queue.confirm(2);
    expect(confirmed).toMatchObject({ id: 'vehicle', confirmed: true, rejected: false, timestamp: 2 });
    expect(queue.getState().confirmed).toHaveLength(1);
    expect(queue.getState().phase).toBe('target_confirmed');
  });

  it('records rejection and returns to searching when complete', () => {
    const queue = new TargetConfirmationQueue();
    queue.enqueue(detection('false-positive'));

    const rejected = queue.reject(3);
    expect(rejected).toMatchObject({ id: 'false-positive', confirmed: false, rejected: true, timestamp: 3 });
    expect(queue.getState().rejected).toHaveLength(1);
    expect(queue.getState().phase).toBe('searching');
  });

  it('does not allow camera-only internal-victim detections', () => {
    const queue = new TargetConfirmationQueue();
    expect(queue.enqueue(detection('internal-camera', 'internal_victim', 'camera'))).toBe(false);
    expect(queue.enqueue(detection('internal-sonar', 'internal_victim', 'marker'))).toBe(true);
  });

  it('deduplicates target IDs and returns safe copies', () => {
    const queue = new TargetConfirmationQueue();
    const item = detection('same-id');
    expect(queue.enqueue(item)).toBe(true);
    expect(queue.enqueue(item)).toBe(false);

    const current = queue.current();
    if (current) current.position.x = 99;
    expect(queue.current()?.position.x).toBe(1);
  });
});

