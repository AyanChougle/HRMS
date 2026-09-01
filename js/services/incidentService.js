/**
 * DIALLO HRMS — INCIDENT RESPONSE SERVICE (PHASE 18)
 * Manages cybersecurity and access violation incident lifecycles.
 */

const incidentService = {
  DEFAULT_COMPANY_ID: 'comp_diallo_india',

  async getIncidents(companyId = this.DEFAULT_COMPANY_ID) {
    return await securityService.getSecurityIncidents(companyId);
  },

  async createIncident(data) {
    return await securityService.createSecurityIncident(data);
  },

  async updateIncident(incidentId, status, notes) {
    return await securityService.updateIncidentStatus(incidentId, status, notes);
  }
};

window.incidentService = incidentService;
