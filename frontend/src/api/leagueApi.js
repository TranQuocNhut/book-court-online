import { api, handleApiError, handleApiSuccess, getAccessToken } from './axiosClient';

const getAPIBaseURL = () => import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * League API Service
 * Handles league/tournament operations
 */
export const leagueApi = {
  /**
   * Get public leagues (for public tournament search page)
   * GET /api/leagues/public
   * @param {Object} params - Query parameters (page, limit, status, sport, format, search, sort)
   * @returns {Promise} Public leagues list with pagination
   */
  getPublicLeagues: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/leagues/public${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get all leagues of current user
   * GET /api/leagues
   * @returns {Promise} Leagues list
   */
  getLeagues: async () => {
    try {
      const response = await api.get('/leagues');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get league by ID
   * GET /api/leagues/:id
   * @param {String} leagueId - League ID
   * @returns {Promise} League object
   */
  getLeagueById: async (leagueId) => {
    try {
      const response = await api.get(`/leagues/${leagueId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Create a new league
   * POST /api/leagues
   * @param {Object} leagueData - League data object
   * @returns {Promise} League object
   */
  createLeague: async (leagueData) => {
    try {
      const response = await api.post('/leagues', leagueData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update league
   * PUT /api/leagues/:id
   * @param {String} leagueId - League ID
   * @param {Object} leagueData - Updated league data
   * @returns {Promise} Updated league object
   */
  updateLeague: async (leagueId, leagueData) => {
    try {
      const response = await api.put(`/leagues/${leagueId}`, leagueData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete league
   * DELETE /api/leagues/:id
   * @param {String} leagueId - League ID
   * @returns {Promise} Success message
   */
  deleteLeague: async (leagueId) => {
    try {
      const response = await api.delete(`/leagues/${leagueId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete team from league
   * DELETE /api/leagues/:id/teams/:teamId
   * @param {String} leagueId - League ID
   * @param {Number|String} teamId - Team ID
   * @returns {Promise} Updated league object
   */
  deleteTeam: async (leagueId, teamId) => {
    try {
      const response = await api.delete(`/leagues/${leagueId}/teams/${teamId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Upload image to league
   * POST /api/leagues/:id/upload
   * @param {String} leagueId - League ID
   * @param {File} image - Image file
   * @returns {Promise} League object with updated image URL
   */
  uploadImage: async (leagueId, image) => {
    try {
      if (!image) {
        throw new Error('Không có ảnh để upload');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('image', image);

      // Use fetch directly for multipart/form-data
      const token = getAccessToken();
      
      const response = await fetch(`${getAPIBaseURL()}/leagues/${leagueId}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - browser will add boundary automatically
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Upload failed with status: ${response.status}` 
        }));
        throw new Error(errorData?.message || 'Upload ảnh thất bại');
      }

      const data = await response.json();
      
      if (data?.success) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Upload ảnh thành công',
        };
      } else {
        throw new Error(data?.message || 'Upload ảnh thất bại');
      }
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Download team template file
   * GET /api/leagues/:id/teams/template
   * @param {String} leagueId - League ID
   * @returns {Promise} Excel file download
   */
  downloadTeamTemplate: async (leagueId) => {
    try {
      const token = getAccessToken();
      const response = await fetch(`${getAPIBaseURL()}/leagues/${leagueId}/teams/template`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể tải file mẫu');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau-danh-sach-doi.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Import teams from Excel file
   * POST /api/leagues/:id/teams/import
   * @param {String} leagueId - League ID
   * @param {File} file - Excel file
   * @returns {Promise} Updated league object
   */
  importTeams: async (leagueId, file) => {
    try {
      if (!file) {
        throw new Error('Không có file để upload');
      }

      const formData = new FormData();
      formData.append('file', file);

      const token = getAccessToken();
      const response = await fetch(`${getAPIBaseURL()}/leagues/${leagueId}/teams/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Upload failed with status: ${response.status}` 
        }));
        throw new Error(errorData?.message || 'Import thất bại');
      }

      const data = await response.json();
      
      if (data?.success) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Import thành công',
        };
      } else {
        throw new Error(data?.message || 'Import thất bại');
      }
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Import teams from Google Sheets
   * POST /api/leagues/:id/teams/import-from-sheets
   * @param {String} leagueId - League ID
   * @param {String} sheetUrl - Google Sheets URL
   * @param {String} sheetName - Optional sheet name
   * @param {String} range - Optional range (default: A:Z)
   * @returns {Promise} Updated league object
   */
  importTeamsFromSheets: async (leagueId, sheetUrl, sheetName = null, range = null) => {
    try {
      const response = await api.post(`/leagues/${leagueId}/teams/import-from-sheets`, {
        sheetUrl,
        sheetName,
        range,
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update team member
   * PUT /api/leagues/:id/teams/:teamId/members/:memberIndex
   * @param {String} leagueId - League ID
   * @param {Number|String} teamId - Team ID
   * @param {Number} memberIndex - Member index in team members array
   * @param {Object} memberData - Updated member data
   * @returns {Promise} Updated league object
   */
  updateMember: async (leagueId, teamId, memberIndex, memberData) => {
    try {
      const response = await api.put(
        `/leagues/${leagueId}/teams/${teamId}/members/${memberIndex}`,
        memberData
      );
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete team member
   * DELETE /api/leagues/:id/teams/:teamId/members/:memberIndex
   * @param {String} leagueId - League ID
   * @param {Number|String} teamId - Team ID
   * @param {Number} memberIndex - Member index in team members array
   * @returns {Promise} Updated league object
   */
  deleteMember: async (leagueId, teamId, memberIndex) => {
    try {
      const response = await api.delete(
        `/leagues/${leagueId}/teams/${teamId}/members/${memberIndex}`
      );
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Download member template file
   * GET /api/leagues/:id/teams/:teamId/members/template
   * @param {String} leagueId - League ID
   * @param {Number|String} teamId - Team ID
   * @returns {Promise} Excel file download
   */
  downloadMemberTemplate: async (leagueId, teamId) => {
    try {
      const token = getAccessToken();
      const response = await fetch(`${getAPIBaseURL()}/leagues/${leagueId}/teams/${teamId}/members/template`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể tải file mẫu');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau-danh-sach-thanh-vien.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Import members from Excel file
   * POST /api/leagues/:id/teams/:teamId/members/import
   * @param {String} leagueId - League ID
   * @param {Number|String} teamId - Team ID
   * @param {File} file - Excel file
   * @returns {Promise} Updated league object
   */
  importMembers: async (leagueId, teamId, file) => {
    try {
      if (!file) {
        throw new Error('Không có file để upload');
      }

      const formData = new FormData();
      formData.append('file', file);

      const token = getAccessToken();
      const response = await fetch(`${getAPIBaseURL()}/leagues/${leagueId}/teams/${teamId}/members/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Upload failed with status: ${response.status}` 
        }));
        throw new Error(errorData?.message || 'Import thất bại');
      }

      const data = await response.json();
      
      if (data?.success) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Import thành công',
        };
      } else {
        throw new Error(data?.message || 'Import thất bại');
      }
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Import members from Google Sheets
   * POST /api/leagues/:id/teams/:teamId/members/import-from-sheets
   * @param {String} leagueId - League ID
   * @param {Number|String} teamId - Team ID
   * @param {String} sheetUrl - Google Sheets URL
   * @param {String} sheetName - Optional sheet name
   * @param {String} range - Optional range (default: A:Z)
   * @returns {Promise} Updated league object
   */
  importMembersFromSheets: async (leagueId, teamId, sheetUrl, sheetName = null, range = null) => {
    try {
      const response = await api.post(
        `/leagues/${leagueId}/teams/${teamId}/members/import-from-sheets`,
        {
          sheetUrl,
          sheetName,
          range,
        }
      );
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Preview Google Sheets data
   * GET /api/leagues/:id/sheets/preview
   * @param {String} leagueId - League ID
   * @param {String} sheetUrl - Google Sheets URL
   * @returns {Promise} Sheet names and sample data
   */
  previewSheets: async (leagueId, sheetUrl) => {
    try {
      const response = await api.get(`/leagues/${leagueId}/sheets/preview`, {
        params: { sheetUrl },
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Upload team logo
   * POST /api/leagues/:id/teams/:teamId/logo
   * @param {String} leagueId - League ID
   * @param {Number|String} teamId - Team ID
   * @param {File} logo - Logo file
   * @returns {Promise} Updated league object with logo URL
   */
  uploadTeamLogo: async (leagueId, teamId, logo) => {
    try {
      if (!logo) {
        throw new Error('Không có logo để upload');
      }

      const formData = new FormData();
      formData.append('logo', logo);

      const token = getAccessToken();
      const response = await fetch(`${getAPIBaseURL()}/leagues/${leagueId}/teams/${teamId}/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Upload failed with status: ${response.status}` 
        }));
        throw new Error(errorData?.message || 'Upload logo thất bại');
      }

      const data = await response.json();
      
      if (data?.success) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Upload logo thành công',
        };
      } else {
        throw new Error(data?.message || 'Upload logo thất bại');
      }
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete team logo
   * DELETE /api/leagues/:id/teams/:teamId/logo
   * @param {String} leagueId - League ID
   * @param {Number|String} teamId - Team ID
   * @returns {Promise} Updated league object
   */
  deleteTeamLogo: async (leagueId, teamId) => {
    try {
      const response = await api.delete(
        `/leagues/${leagueId}/teams/${teamId}/logo`
      );
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Draw random matches
   * POST /api/leagues/:id/draw-matches
   * @param {String} leagueId - League ID
   * @param {Object} options - Draw options (stage, clearExisting)
   * @returns {Promise} Updated league object with matches
   */
  drawMatches: async (leagueId, options = {}) => {
    try {
      const response = await api.post(`/leagues/${leagueId}/draw-matches`, options);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update match schedule (date, time)
   * PUT /api/leagues/:id/matches/schedule
   * @param {String} leagueId - League ID
   * @param {Array} schedules - Array of { stage, matchNumber, date, time }
   * @returns {Promise} Updated league object
   */
  updateMatchSchedule: async (leagueId, schedules) => {
    try {
      const response = await api.put(`/leagues/${leagueId}/matches/schedule`, { schedules });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Auto schedule matches
   * POST /api/leagues/:id/auto-schedule
   * @param {String} leagueId - League ID
   * @param {Object} options - Auto schedule options
   * @param {String} options.startDate - Start date for scheduling
   * @param {String} options.endDate - End date for scheduling
   * @param {Number} options.matchDuration - Match duration in minutes (default: 90)
   * @param {Number} options.breakTime - Break time between matches in minutes (default: 30)
   * @param {String} options.preferredStartTime - Preferred start time (default: "08:00")
   * @param {String} options.preferredEndTime - Preferred end time (default: "22:00")
   * @returns {Promise} Auto schedule result
   */
  autoSchedule: async (leagueId, options = {}) => {
    try {
      const response = await api.post(`/leagues/${leagueId}/auto-schedule`, options);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Suggest optimal time for a match
   * GET /api/leagues/:id/matches/:matchId/suggest-time
   * @param {String} leagueId - League ID
   * @param {String} matchId - Match ID (format: "stage_matchNumber" or just matchNumber)
   * @param {Object} options - Suggest options
   * @param {String} options.preferredDate - Preferred date (optional)
   * @param {Number} options.matchDuration - Match duration in minutes (default: 90)
   * @param {Number} options.breakTime - Break time between matches in minutes (default: 30)
   * @returns {Promise} Suggested times
   */
  suggestMatchTime: async (leagueId, matchId, options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.preferredDate) params.append('preferredDate', options.preferredDate);
      if (options.matchDuration) params.append('matchDuration', options.matchDuration);
      if (options.breakTime) params.append('breakTime', options.breakTime);
      
      const queryString = params.toString();
      const url = `/leagues/${leagueId}/matches/${matchId}/suggest-time${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Confirm schedule - chốt lịch thi đấu (chuyển hold bookings thành confirmed)
   * POST /api/leagues/:id/confirm-schedule
   * @param {String} leagueId - League ID
   * @returns {Promise} Confirm schedule result
   */
  confirmSchedule: async (leagueId) => {
    try {
      const response = await api.post(`/leagues/${leagueId}/confirm-schedule`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Cancel match schedule - hủy lịch đấu cho một trận cụ thể
   * DELETE /api/leagues/:id/matches/:stage/:matchNumber/schedule
   * @param {String} leagueId - League ID
   * @param {String} stage - Match stage
   * @param {Number} matchNumber - Match number
   * @returns {Promise} Cancel schedule result
   */
  cancelMatchSchedule: async (leagueId, stage, matchNumber) => {
    try {
      const response = await api.delete(`/leagues/${leagueId}/matches/${stage}/${matchNumber}/schedule`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Cancel all schedule - hủy toàn bộ lịch đấu đã chốt
   * DELETE /api/leagues/:id/schedule/all
   * @param {String} leagueId - League ID
   * @returns {Promise} Cancel all schedule result
   */
  cancelAllSchedule: async (leagueId) => {
    try {
      const response = await api.delete(`/leagues/${leagueId}/schedule/all`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update match result (score1, score2, penaltyScore1, penaltyScore2)
   * PUT /api/leagues/:id/matches/result
   * Tự động tính winner và cập nhật vào vòng tiếp theo (single-elimination)
   * Cập nhật thống kê teams (wins, draws, losses) cho round-robin
   * @param {String} leagueId - League ID
   * @param {String} stage - Match stage (round1, round2, round3, round4, semi, final, round-robin)
   * @param {Number} matchNumber - Match number
   * @param {Number} score1 - Score of team 1
   * @param {Number} score2 - Score of team 2
   * @param {Number} penaltyScore1 - Penalty score of team 1 (optional, for tie-breaker)
   * @param {Number} penaltyScore2 - Penalty score of team 2 (optional, for tie-breaker)
   * @returns {Promise} Updated league object
   */
  updateMatchResult: async (leagueId, stage, matchNumber, score1, score2, penaltyScore1 = null, penaltyScore2 = null) => {
    try {
      const response = await api.put(`/leagues/${leagueId}/matches/result`, {
        stage,
        matchNumber,
        score1,
        score2,
        penaltyScore1,
        penaltyScore2,
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Download schedule template file
   * GET /api/leagues/:id/schedule/template
   * @param {String} leagueId - League ID
   * @returns {Promise} Excel file download
   */
  downloadScheduleTemplate: async (leagueId) => {
    try {
      const token = getAccessToken();
      const response = await fetch(`${getAPIBaseURL()}/leagues/${leagueId}/schedule/template`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể tải file mẫu');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau-lich-dau.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Import schedule from Excel file
   * POST /api/leagues/:id/schedule/import
   * @param {String} leagueId - League ID
   * @param {File} file - Excel file
   * @returns {Promise} Updated league object
   */
  importSchedule: async (leagueId, file) => {
    try {
      if (!file) {
        throw new Error('Không có file để upload');
      }

      const formData = new FormData();
      formData.append('file', file);

      const token = getAccessToken();
      const response = await fetch(`${getAPIBaseURL()}/leagues/${leagueId}/schedule/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Upload failed with status: ${response.status}` 
        }));
        throw new Error(errorData?.message || 'Import thất bại');
      }

      const data = await response.json();
      
      if (data?.success) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Import thành công',
          details: data.details
        };
      } else {
        throw new Error(data?.message || 'Import thất bại');
      }
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get pending leagues for owner
   * GET /api/leagues/owner/pending
   * @returns {Promise} Pending leagues list
   */
  getPendingLeagues: async () => {
    try {
      const response = await api.get('/leagues/owner/pending');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get all leagues for owner
   * GET /api/leagues/owner/all
   * @param {Object} filters - Filter options (status, approvalStatus)
   * @returns {Promise} Leagues list
   */
  getOwnerLeagues: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
      
      const queryString = params.toString();
      const url = `/leagues/owner/all${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Approve league
   * PUT /api/leagues/:id/approve
   * @param {String} leagueId - League ID
   * @returns {Promise} Updated league object
   */
  approveLeague: async (leagueId) => {
    try {
      const response = await api.put(`/leagues/${leagueId}/approve`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Reject league
   * PUT /api/leagues/:id/reject
   * @param {String} leagueId - League ID
   * @param {String} reason - Rejection reason
   * @returns {Promise} Updated league object
   */
  rejectLeague: async (leagueId, reason) => {
    try {
      const response = await api.put(`/leagues/${leagueId}/reject`, { reason });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Assign court to league
   * PUT /api/leagues/:id/assign-court
   * @param {String} leagueId - League ID
   * @param {String} courtId - Court ID
   * @returns {Promise} Updated league object
   */
  assignCourtToLeague: async (leagueId, courtId) => {
    try {
      const response = await api.put(`/leagues/${leagueId}/assign-court`, { courtId });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Register to league (create team and add members)
   * POST /api/leagues/:id/register
   * @param {String} leagueId - League ID
   * @param {Object} registrationData - Registration data (teamData, members)
   * @returns {Promise} Registration result
   */
  registerToLeague: async (leagueId, registrationData) => {
    try {
      const response = await api.post(`/leagues/${leagueId}/register`, registrationData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Download member template for registration
   * GET /api/leagues/:id/register/template
   * @param {String} leagueId - League ID
   * @returns {Promise} File download
   */
  downloadRegistrationTemplate: async (leagueId) => {
    try {
      const token = getAccessToken();
      const response = await fetch(`${getAPIBaseURL()}/leagues/${leagueId}/register/template`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể tải file mẫu');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau-danh-sach-thanh-vien.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Approve team registration
   * PUT /api/leagues/:id/teams/:teamId/approve
   * @param {String} leagueId - League ID
   * @param {String|Number} teamId - Team ID
   * @returns {Promise} Updated league object
   */
  approveTeamRegistration: async (leagueId, teamId) => {
    try {
      const response = await api.put(`/leagues/${leagueId}/teams/${teamId}/approve`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Reject team registration
   * PUT /api/leagues/:id/teams/:teamId/reject
   * @param {String} leagueId - League ID
   * @param {String|Number} teamId - Team ID
   * @param {String} reason - Rejection reason
   * @returns {Promise} Updated league object
   */
  rejectTeamRegistration: async (leagueId, teamId, reason) => {
    try {
      const response = await api.put(`/leagues/${leagueId}/teams/${teamId}/reject`, { reason });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Parse members from Excel file for registration
   * POST /api/leagues/:id/register/parse-members
   * @param {String} leagueId - League ID
   * @param {File} file - Excel file
   * @returns {Promise} Parsed members array
   */
  parseMembersForRegistration: async (leagueId, file) => {
    try {
      if (!file) {
        throw new Error('Không có file để upload');
      }

      const formData = new FormData();
      formData.append('file', file);

      const token = getAccessToken();
      const response = await fetch(`${getAPIBaseURL()}/leagues/${leagueId}/register/parse-members`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Upload failed with status: ${response.status}` 
        }));
        throw new Error(errorData?.message || 'Parse thất bại');
      }

      const data = await response.json();
      
      if (data?.success) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Parse thành công',
        };
      } else {
        throw new Error(data?.message || 'Parse thất bại');
      }
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

