/**
 * Human-in-the-loop target confirmation queue.
 *
 * Only vehicle/victim detections enter the queue. Obstacles are handled by the
 * map and safety layer, never by the target-confirmation dialog.
 */

import type { MissionPhase, TargetDetection } from '../types';

export interface ConfirmationQueueState {
  pending: TargetDetection[];
  confirmed: TargetDetection[];
  rejected: TargetDetection[];
  phase: MissionPhase;
}

const TARGET_TYPES = new Set<TargetDetection['type']>([
  'submerged_vehicle',
  'external_victim',
  'internal_victim',
]);

function cloneDetection(detection: TargetDetection): TargetDetection {
  return { ...detection, position: { ...detection.position } };
}

export class TargetConfirmationQueue {
  private pending: TargetDetection[] = [];
  private confirmed: TargetDetection[] = [];
  private rejected: TargetDetection[] = [];
  private phase: MissionPhase = 'searching';

  enqueue(detection: TargetDetection): boolean {
    if (!TARGET_TYPES.has(detection.type)) return false;
    if (detection.confidence < 0.45) return false;
    if (detection.type === 'internal_victim' && detection.modality === 'camera') return false;

    const alreadyKnown = [
      ...this.pending,
      ...this.confirmed,
      ...this.rejected,
    ].some((item) => item.id === detection.id);
    if (alreadyKnown) return false;

    this.pending.push({ ...detection, confirmed: undefined, rejected: undefined });
    this.phase = 'target_pending';
    return true;
  }

  current(): TargetDetection | null {
    const detection = this.pending[0];
    return detection ? cloneDetection(detection) : null;
  }

  confirm(timestamp: number): TargetDetection | null {
    const detection = this.pending.shift();
    if (!detection) return null;

    const confirmed = { ...detection, confirmed: true, rejected: false, timestamp };
    this.confirmed.push(confirmed);
    this.phase = this.pending.length > 0 ? 'target_pending' : 'target_confirmed';
    return cloneDetection(confirmed);
  }

  reject(timestamp: number): TargetDetection | null {
    const detection = this.pending.shift();
    if (!detection) return null;

    const rejected = { ...detection, confirmed: false, rejected: true, timestamp };
    this.rejected.push(rejected);
    this.phase = this.pending.length > 0 ? 'target_pending' : 'searching';
    return cloneDetection(rejected);
  }

  getState(): ConfirmationQueueState {
    return {
      pending: this.pending.map(cloneDetection),
      confirmed: this.confirmed.map(cloneDetection),
      rejected: this.rejected.map(cloneDetection),
      phase: this.phase,
    };
  }

  reset(): void {
    this.pending = [];
    this.confirmed = [];
    this.rejected = [];
    this.phase = 'searching';
  }
}
