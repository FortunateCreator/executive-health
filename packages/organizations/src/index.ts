import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import type { Organization, OrgMember, Department, OrgInvite, OrgRole } from '@executive-health/core';
import {
  saveOrganization, getOrganization, getOrganizations, getOrganizationBySlug, deleteOrganization as deleteOrgFromDb,
  saveOrgMember, getOrgMembers, getOrgMember, getMemberOrgs, removeOrgMember,
  saveDepartment, getDepartments, getDepartment, deleteDepartment as deleteDepartmentFromDb,
  saveInvite, getInvites, getInviteByToken, updateInvite,
  getUserById,
} from '@executive-health/db';

// === ORGANIZATION CRUD ===
export function createOrganization(name: string, creatorUserId: string): Organization {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const now = new Date().toISOString();

  const org: Organization = {
    id: uuid(),
    name,
    slug,
    subscription_tier: 'free',
    settings: {
      wellness_programs_enabled: true,
      data_retention_days: 365,
    },
    created_at: now,
    updated_at: now,
  };

  // Check slug uniqueness
  if (getOrganizationBySlug(slug)) {
    org.slug = slug + '-' + Math.random().toString(36).substring(2, 6);
  }

  saveOrganization(org);

  // Creator becomes super_admin
  const creator = getUserById(creatorUserId);
  const member: OrgMember = {
    id: uuid(),
    org_id: org.id,
    user_id: creatorUserId,
    email: creator?.email || '',
    display_name: creator?.display_name || 'Admin',
    role: 'super_admin',
    status: 'active',
    joined_at: now,
    created_at: now,
  };
  saveOrgMember(member);

  return org;
}

export function updateOrganization(id: string, updates: Partial<Organization>): Organization | undefined {
  const org = getOrganization(id);
  if (!org) return undefined;
  const updated = { ...org, ...updates, updated_at: new Date().toISOString() };
  saveOrganization(updated);
  return updated;
}

export function deleteOrg(id: string): void {
  // Remove all members, departments, invites associated with this org
  const members = getOrgMembers(id);
  for (const m of members) removeOrgMember(id, m.user_id);
  const depts = getDepartments(id);
  for (const d of depts) deleteDepartmentFromDb(d.id);
  deleteOrgFromDb(id);
}

// === MEMBER MANAGEMENT ===
export function addOrgMember(
  orgId: string, userId: string, email: string, displayName: string,
  role: OrgRole, departmentId?: string
): OrgMember {
  const now = new Date().toISOString();
  const member: OrgMember = {
    id: uuid(),
    org_id: orgId,
    user_id: userId,
    email,
    display_name: displayName,
    role,
    department_id: departmentId,
    invited_by: undefined,
    status: 'active',
    joined_at: now,
    created_at: now,
  };
  saveOrgMember(member);
  return member;
}

export function changeMemberRole(orgId: string, userId: string, newRole: OrgRole): boolean {
  const member = getOrgMember(orgId, userId);
  if (!member) return false;
  member.role = newRole;
  saveOrgMember(member);
  return true;
}

export function setMemberDepartment(orgId: string, userId: string, departmentId: string | undefined): boolean {
  const member = getOrgMember(orgId, userId);
  if (!member) return false;
  member.department_id = departmentId;
  saveOrgMember(member);
  return true;
}

export function suspendMember(orgId: string, userId: string): boolean {
  const member = getOrgMember(orgId, userId);
  if (!member) return false;
  member.status = 'suspended';
  saveOrgMember(member);
  return true;
}

export function activateMember(orgId: string, userId: string): boolean {
  const member = getOrgMember(orgId, userId);
  if (!member) return false;
  member.status = 'active';
  saveOrgMember(member);
  return true;
}

export function removeMember(orgId: string, userId: string): void {
  removeOrgMember(orgId, userId);
}

// === DEPARTMENT MANAGEMENT ===
export function createDepartment(orgId: string, name: string, description?: string): Department {
  const now = new Date().toISOString();
  const dept: Department = {
    id: uuid(),
    org_id: orgId,
    name,
    description,
    head_count: 0,
    created_at: now,
    updated_at: now,
  };
  saveDepartment(dept);
  return dept;
}

export function updateDepartment(id: string, updates: Partial<Department>): Department | undefined {
  const dept = getDepartment(id);
  if (!dept) return undefined;
  const updated = { ...dept, ...updates, updated_at: new Date().toISOString() };
  saveDepartment(updated);
  return updated;
}

export function deleteDepartment(id: string): void {
  deleteDepartmentFromDb(id);
}

// === INVITE SYSTEM ===
export function createInvite(
  orgId: string, email: string, role: OrgRole,
  invitedByUserId: string, departmentId?: string
): OrgInvite {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  // Get inviter display name
  const inviterMember = getOrgMember(orgId, invitedByUserId);

  const invite: OrgInvite = {
    id: uuid(),
    org_id: orgId,
    email,
    role,
    department_id: departmentId,
    token,
    invited_by: invitedByUserId,
    invited_by_name: inviterMember?.display_name || 'Admin',
    status: 'pending',
    expires_at: expiresAt,
    created_at: now,
  };
  saveInvite(invite);
  return invite;
}

export function acceptInvite(token: string, userId: string): { success: boolean; org_id?: string; error?: string } {
  const invite = getInviteByToken(token);
  if (!invite) return { success: false, error: 'Invalid or expired invite token' };
  if (new Date(invite.expires_at) < new Date()) {
    updateInvite(invite.id, { status: 'expired' });
    return { success: false, error: 'Invite has expired' };
  }
  if (invite.status !== 'pending') {
    return { success: false, error: 'Invite has already been used' };
  }

  const user = getUserById(userId);
  if (!user) return { success: false, error: 'User not found' };

  addOrgMember(invite.org_id, userId, user.email, user.display_name, invite.role, invite.department_id);
  updateInvite(invite.id, { status: 'accepted' });

  return { success: true, org_id: invite.org_id };
}

export function cancelInvite(id: string): void {
  updateInvite(id, { status: 'expired' });
}

// === PERMISSION CHECKS ===
export function canManageMembers(orgId: string, userId: string): boolean {
  const member = getOrgMember(orgId, userId);
  if (!member || member.status !== 'active') return false;
  return member.role === 'super_admin' || member.role === 'admin';
}

export function canManageSettings(orgId: string, userId: string): boolean {
  const member = getOrgMember(orgId, userId);
  if (!member || member.status !== 'active') return false;
  return member.role === 'super_admin' || member.role === 'admin';
}

export function canViewAnalytics(orgId: string, userId: string): boolean {
  const member = getOrgMember(orgId, userId);
  if (!member || member.status !== 'active') return false;
  return true; // All active members can view basic analytics
}

export function isSuperAdmin(orgId: string, userId: string): boolean {
  const member = getOrgMember(orgId, userId);
  return member?.role === 'super_admin' && member.status === 'active';
}
