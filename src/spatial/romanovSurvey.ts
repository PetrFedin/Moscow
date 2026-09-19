import { romanovControlPoints } from './romanovControlPoints.ts';
import {
  currentRomanovMetricBinding,
  isCurrentRomanovMetricBinding,
  type RomanovMetricBinding
} from './romanovMetricAuthority.ts';

export type SurveyMethod =
  | 'total-station'
  | 'gnss-rtk'
  | 'laser-distance'
  | 'photogrammetry'
  | 'verified-drawing'
  | 'other';

export type SurveyPointStatus = 'pending' | 'measured' | 'verified' | 'rejected';

export type GeodeticCoordinate = {
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
};

export type RomanovSurveyPoint = {
  controlPointId: string;
  modelPointMeters?: [number, number, number];
  geodetic?: GeodeticCoordinate;
  method?: SurveyMethod;
  horizontalAccuracyCm?: number;
  verticalAccuracyCm?: number;
  measuredAt?: string;
  measuredBy?: string;
  evidenceRef?: string;
  status: SurveyPointStatus;
  notes?: string;
};

export type RomanovSurveyPacket = {
  id: string;
  placeId: 'romanov-chambers';
  coordinateReference: 'WGS84';
  modelUnits: 'meters';
  createdAt: string;
  metricBinding?: RomanovMetricBinding;
  points: RomanovSurveyPoint[];
  approvedAt?: string;
  approvedBy?: string;
};

export type RomanovSurveyGate = {
  totalPoints: number;
  measuredPoints: number;
  verifiedPoints: number;
  alignmentPointsVerified: number;
  complete: boolean;
  blockers: string[];
};

export function createEmptyRomanovSurveyPacket(): RomanovSurveyPacket {
  return {
    id: `romanov-survey-${new Date().toISOString()}`,
    placeId: 'romanov-chambers',
    coordinateReference: 'WGS84',
    modelUnits: 'meters',
    createdAt: new Date().toISOString(),
    metricBinding: currentRomanovMetricBinding,
    points: romanovControlPoints.map((point) => ({
      controlPointId: point.id,
      status: 'pending'
    }))
  };
}

function finiteTuple(value?: [number, number, number]) {
  return Boolean(value && value.length === 3 && value.every(Number.isFinite));
}

function validGeodetic(value?: GeodeticCoordinate) {
  return Boolean(
    value
    && Number.isFinite(value.latitude)
    && Number.isFinite(value.longitude)
    && value.latitude >= -90
    && value.latitude <= 90
    && value.longitude >= -180
    && value.longitude <= 180
    && (value.altitudeMeters === undefined || Number.isFinite(value.altitudeMeters))
  );
}

export function isSurveyPointMeasured(point: RomanovSurveyPoint) {
  return finiteTuple(point.modelPointMeters)
    && validGeodetic(point.geodetic)
    && Boolean(point.method)
    && Number.isFinite(point.horizontalAccuracyCm)
    && (point.horizontalAccuracyCm ?? -1) >= 0
    && Number.isFinite(point.verticalAccuracyCm)
    && (point.verticalAccuracyCm ?? -1) >= 0
    && Boolean(point.measuredAt)
    && Boolean(point.measuredBy?.trim())
    && (point.status === 'measured' || point.status === 'verified');
}

export function summarizeRomanovSurvey(packet: RomanovSurveyPacket): RomanovSurveyGate {
  const expectedIds = new Set(romanovControlPoints.map((point) => point.id));
  const uniquePoints = new Map(packet.points.map((point) => [point.controlPointId, point]));
  const blockers: string[] = [];

  if (!isCurrentRomanovMetricBinding(packet.metricBinding)) {
    blockers.push('metric-authority-stale');
  }

  if (uniquePoints.size !== expectedIds.size || [...expectedIds].some((id) => !uniquePoints.has(id))) {
    blockers.push('control-point-set-incomplete');
  }

  const measured = romanovControlPoints.filter((controlPoint) => {
    const surveyPoint = uniquePoints.get(controlPoint.id);
    return surveyPoint ? isSurveyPointMeasured(surveyPoint) : false;
  });
  const verified = measured.filter((controlPoint) => uniquePoints.get(controlPoint.id)?.status === 'verified');
  const alignmentPointsVerified = verified.filter((controlPoint) => controlPoint.purpose === 'alignment').length;

  if (measured.length < romanovControlPoints.length) blockers.push('not-all-control-points-measured');
  if (verified.length < romanovControlPoints.length) blockers.push('not-all-control-points-verified');
  if (alignmentPointsVerified < 3) blockers.push('fewer-than-three-alignment-points-verified');
  if (!packet.approvedAt || !packet.approvedBy?.trim()) blockers.push('survey-packet-not-approved');

  return {
    totalPoints: romanovControlPoints.length,
    measuredPoints: measured.length,
    verifiedPoints: verified.length,
    alignmentPointsVerified,
    complete: blockers.length === 0,
    blockers
  };
}

export function surveyPacketToTsv(packet: RomanovSurveyPacket) {
  const header = [
    'metric_authority_id',
    'metric_authority_version',
    'model_pack_version',
    'control_point_id',
    'model_x_m',
    'model_y_m',
    'model_z_m',
    'latitude',
    'longitude',
    'altitude_m',
    'method',
    'horizontal_accuracy_cm',
    'vertical_accuracy_cm',
    'measured_at',
    'measured_by',
    'status',
    'evidence_ref',
    'notes'
  ];
  const rows = packet.points.map((point) => [
    packet.metricBinding?.metricAuthorityId ?? '',
    packet.metricBinding?.metricAuthorityVersion?.toString() ?? '',
    packet.metricBinding?.modelPackVersion ?? '',
    point.controlPointId,
    point.modelPointMeters?.[0]?.toString() ?? '',
    point.modelPointMeters?.[1]?.toString() ?? '',
    point.modelPointMeters?.[2]?.toString() ?? '',
    point.geodetic?.latitude?.toString() ?? '',
    point.geodetic?.longitude?.toString() ?? '',
    point.geodetic?.altitudeMeters?.toString() ?? '',
    point.method ?? '',
    point.horizontalAccuracyCm?.toString() ?? '',
    point.verticalAccuracyCm?.toString() ?? '',
    point.measuredAt ?? '',
    point.measuredBy ?? '',
    point.status,
    point.evidenceRef ?? '',
    point.notes ?? ''
  ]);
  return [header, ...rows].map((row) => row.join('\t')).join('\n');
}
