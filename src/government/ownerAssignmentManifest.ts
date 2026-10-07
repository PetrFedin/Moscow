import {
  pilotExecutionRoles,
  type PilotExecutionRoleId
} from './pilotExecutionPack.ts';

export const OWNER_ASSIGNMENT_MANIFEST_VERSION = 1 as const;

export type PilotOwnerAssignment = {
  roleId: PilotExecutionRoleId;
  status: 'unassigned' | 'assigned';
  personName?: string;
  organization?: string;
  authorityRef?: string;
  contactRef?: string;
};

export type OwnerAssignmentManifest = {
  kind: 'moscow-pilot-owner-assignment';
  version: typeof OWNER_ASSIGNMENT_MANIFEST_VERSION;
  pilotId: 'varvarka-zaryadye-pilot';
  updatedAt: string;
  assignments: PilotOwnerAssignment[];
};

export type OwnerAssignmentValidation = {
  valid: boolean;
  complete: boolean;
  blockers: string[];
  unassignedRoles: PilotExecutionRoleId[];
};

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validIso(value: unknown) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function buildOwnerAssignmentTemplate(
  updatedAt = new Date().toISOString()
): OwnerAssignmentManifest {
  return {
    kind: 'moscow-pilot-owner-assignment',
    version: OWNER_ASSIGNMENT_MANIFEST_VERSION,
    pilotId: 'varvarka-zaryadye-pilot',
    updatedAt,
    assignments: pilotExecutionRoles.map((role) => ({
      roleId: role.id,
      status: 'unassigned'
    }))
  };
}

export function validateOwnerAssignmentManifest(
  value: unknown
): OwnerAssignmentValidation {
  const blockers: string[] = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      valid: false,
      complete: false,
      blockers: ['owner-manifest-not-object'],
      unassignedRoles: pilotExecutionRoles.map((role) => role.id)
    };
  }

  const manifest = value as Partial<OwnerAssignmentManifest>;
  if (manifest.kind !== 'moscow-pilot-owner-assignment') {
    blockers.push('owner-manifest-kind-invalid');
  }
  if (manifest.version !== OWNER_ASSIGNMENT_MANIFEST_VERSION) {
    blockers.push('owner-manifest-version-invalid');
  }
  if (manifest.pilotId !== 'varvarka-zaryadye-pilot') {
    blockers.push('owner-manifest-pilot-invalid');
  }
  if (!validIso(manifest.updatedAt)) blockers.push('owner-manifest-updated-at-invalid');
  if (!Array.isArray(manifest.assignments)) {
    blockers.push('owner-manifest-assignments-invalid');
    return {
      valid: false,
      complete: false,
      blockers,
      unassignedRoles: pilotExecutionRoles.map((role) => role.id)
    };
  }

  const requiredRoles = new Set(pilotExecutionRoles.map((role) => role.id));
  const seen = new Set<PilotExecutionRoleId>();
  const unassignedRoles: PilotExecutionRoleId[] = [];

  for (const [index, assignment] of manifest.assignments.entries()) {
    if (!assignment || typeof assignment !== 'object' || Array.isArray(assignment)) {
      blockers.push(`owner-assignment-invalid:${index}`);
      continue;
    }

    const item = assignment as Partial<PilotOwnerAssignment>;
    if (!item.roleId || !requiredRoles.has(item.roleId)) {
      blockers.push(`owner-role-invalid:${index}`);
      continue;
    }
    if (seen.has(item.roleId)) blockers.push(`owner-role-duplicate:${item.roleId}`);
    seen.add(item.roleId);

    if (item.status !== 'assigned' && item.status !== 'unassigned') {
      blockers.push(`owner-status-invalid:${item.roleId}`);
      continue;
    }

    if (item.status === 'assigned') {
      if (!isText(item.personName)) blockers.push(`owner-person-missing:${item.roleId}`);
      if (!isText(item.organization)) blockers.push(`owner-organization-missing:${item.roleId}`);
      if (!isText(item.authorityRef)) blockers.push(`owner-authority-ref-missing:${item.roleId}`);
    } else {
      unassignedRoles.push(item.roleId);
      if (item.personName || item.organization || item.authorityRef || item.contactRef) {
        blockers.push(`owner-unassigned-has-assignment-data:${item.roleId}`);
      }
    }
  }

  for (const role of pilotExecutionRoles) {
    if (!seen.has(role.id)) {
      blockers.push(`owner-role-missing:${role.id}`);
      unassignedRoles.push(role.id);
    }
  }

  return {
    valid: blockers.length === 0,
    complete: blockers.length === 0 && unassignedRoles.length === 0,
    blockers: [...new Set(blockers)],
    unassignedRoles: [...new Set(unassignedRoles)]
  };
}
