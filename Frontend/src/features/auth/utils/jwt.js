export function parseJwt(token) {
  if (!token) return null;

  try {
    const base64Payload = token.split('.')[1];
    const payload = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export function getRoleFromToken(token) {
  const payload = parseJwt(token);
  if (!payload) return null;

  if (payload.role) return payload.role;
  if (Array.isArray(payload.roles) && payload.roles.length > 0) return payload.roles[0];
  if (Array.isArray(payload.groups) && payload.groups.length > 0) return payload.groups[0];

  return null;
}
