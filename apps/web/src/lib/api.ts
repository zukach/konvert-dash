const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'API Error');
  }

  return res.json();
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  register: (data: { email: string; password: string; name: string }) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => request<any>('/auth/me'),

  // Clients
  getClients: () => request<any[]>('/clients'),
  getClient: (id: string) => request<any>(`/clients/${id}`),
  createClient: (data: any) =>
    request<any>('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: any) =>
    request<any>(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteClient: (id: string) =>
    request<any>(`/clients/${id}`, { method: 'DELETE' }),
  getClientFunnel: (id: string) => request<any>(`/clients/${id}/funnel`),
  getClientCampaigns: (id: string) => request<any[]>(`/clients/${id}/campaigns`),
  getClientMeetings: (id: string) => request<any[]>(`/clients/${id}/meetings`),
  getClientTimeline: (id: string, days = 30) =>
    request<any[]>(`/clients/${id}/timeline?days=${days}`),
  createToken: (clientId: string, data: any) =>
    request<any>(`/clients/${clientId}/tokens`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTokens: (clientId: string) =>
    request<any[]>(`/clients/${clientId}/tokens`),
  deleteToken: (clientId: string, tokenId: string) =>
    request<any>(`/clients/${clientId}/tokens/${tokenId}`, { method: 'DELETE' }),

  // Campaigns
  getCampaigns: (params?: Record<string, string>) => {
    const qs = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return request<any[]>(`/campaigns${qs}`);
  },
  getUnassignedCampaigns: () => request<any[]>('/campaigns/unassigned'),
  getCampaign: (id: string) => request<any>(`/campaigns/${id}`),
  updateCampaign: (id: string, data: any) =>
    request<any>(`/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  bulkAssignCampaigns: (data: { campaignIds: string[]; clientId: string }) =>
    request<any>('/campaigns/bulk-assign', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Meetings
  getMeetings: (params?: Record<string, string>) => {
    const qs = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return request<any[]>(`/meetings${qs}`);
  },
  getUnassignedMeetings: () => request<any[]>('/meetings/unassigned'),
  getMeeting: (id: string) => request<any>(`/meetings/${id}`),
  updateMeeting: (id: string, data: any) =>
    request<any>(`/meetings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Analytics
  getOverview: () => request<any>('/analytics/overview'),
  getFunnel: (clientId?: string) =>
    request<any>(`/analytics/funnel${clientId ? `?clientId=${clientId}` : ''}`),
  getTimeline: (days = 30, clientId?: string) =>
    request<any[]>(
      `/analytics/timeline?days=${days}${clientId ? `&clientId=${clientId}` : ''}`,
    ),
  getClientsComparison: () => request<any[]>('/analytics/clients-comparison'),

  // Sync
  syncEmailBison: () =>
    request<any>('/sync/emailbison', { method: 'POST' }),
  getSyncStatus: () => request<any>('/sync/status'),
  getSyncHistory: () => request<any[]>('/sync/history'),
  getCalendlyConfig: () => request<any>('/sync/calendly/config'),
  setupCalendlyWebhook: (callbackUrl: string) =>
    request<any>('/sync/calendly/setup', {
      method: 'POST',
      body: JSON.stringify({ callbackUrl }),
    }),

  // Public
  validatePublicToken: (token: string) =>
    request<any>(`/public/${token}`, {
      headers: { Authorization: '' },
    }),
  getPublicFunnel: (token: string) =>
    request<any>(`/public/${token}/funnel`, {
      headers: { Authorization: '' },
    }),
  getPublicCampaigns: (token: string) =>
    request<any[]>(`/public/${token}/campaigns`, {
      headers: { Authorization: '' },
    }),
  getPublicMeetings: (token: string) =>
    request<any>(`/public/${token}/meetings`, {
      headers: { Authorization: '' },
    }),
  getPublicTimeline: (token: string, days = 30) =>
    request<any[]>(`/public/${token}/timeline?days=${days}`, {
      headers: { Authorization: '' },
    }),
};
