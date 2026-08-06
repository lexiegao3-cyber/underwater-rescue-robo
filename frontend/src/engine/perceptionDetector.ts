/**
 * Rule-based multimodal perception adapter for the MVP.
 *
 * This module converts synthetic camera/sonar outputs into the stable
 * TargetDetection interface. It is intentionally not a learned detector.
 */

import type {
  ObjectType,
  TargetConfig,
  TargetDetection,
  UUVState,
} from '../types';
import type { CameraFrame, CameraObject } from './cameraSimulator';
import type { SonarFrame, SonarDetection } from './sonarSimulator';

export interface PerceptionResult {
  timestamp: number;
  detections: TargetDetection[];
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function toObjectType(type: CameraObject['type'] | SonarDetection['type']): ObjectType {
  return type === 'unknown' ? 'unknown_obstacle' : type;
}

function worldPositionFromCamera(uuvState: UUVState, relativePosition: { x: number; y: number }) {
  return {
    x: uuvState.position.x + relativePosition.x,
    y: uuvState.position.y + relativePosition.y,
  };
}

function cameraConfidence(object: CameraObject, frame: CameraFrame): number {
  if (!object.visible) return 0;
  if (frame.contrast <= 0) return 0;
  return clampConfidence(object.opacity / frame.contrast);
}

function sonarConfidence(detection: SonarDetection, frame: SonarFrame): number {
  return clampConfidence(1 - (detection.distance / frame.maxRange) * 0.5);
}

export class PerceptionDetector {
  detect(
    cameraFrame: CameraFrame,
    sonarFrame: SonarFrame,
    uuvState: UUVState,
    markerTargets: TargetConfig[] = [],
  ): PerceptionResult {
    const detections: TargetDetection[] = [];

    cameraFrame.objects.forEach((object, index) => {
      const confidence = cameraConfidence(object, cameraFrame);
      if (confidence <= 0) return;

      detections.push({
        id: `camera-${object.type}-${index}`,
        type: toObjectType(object.type),
        position: worldPositionFromCamera(uuvState, object.relativePosition),
        confidence,
        modality: 'camera',
        timestamp: cameraFrame.timestamp,
      });
    });

    sonarFrame.detections.forEach((detection) => {
      detections.push({
        id: detection.id,
        type: toObjectType(detection.type),
        position: { ...detection.position },
        confidence: sonarConfidence(detection, sonarFrame),
        modality: detection.type === 'internal_victim' ? 'marker' : 'sonar',
        timestamp: sonarFrame.timestamp,
      });
    });

    const existingMarkerIds = new Set(detections.map((detection) => detection.id));
    markerTargets.forEach((target) => {
      if (target.type !== 'internal_victim' || existingMarkerIds.has(target.id)) return;

      detections.push({
        id: target.id,
        type: 'internal_victim',
        position: { ...target.position },
        confidence: clampConfidence(target.confidence),
        modality: 'marker',
        timestamp: Math.max(cameraFrame.timestamp, sonarFrame.timestamp),
      });
    });

    return {
      timestamp: Math.max(cameraFrame.timestamp, sonarFrame.timestamp),
      detections,
    };
  }
}

