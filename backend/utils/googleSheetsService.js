// backend/utils/googleSheetsService.js
import { google } from 'googleapis';
import { config } from '../config/config.js';

/**
 * Extract Google Sheets ID from URL
 * Supports formats:
 * - https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
 * - https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit#gid=0
 */
export function extractSheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Get Google Sheets data using API Key (public sheets only)
 * For private sheets, need OAuth2 authentication
 */
export async function getSheetData(sheetId, range = 'A:Z', apiKey = null) {
  try {
    if (!apiKey) {
      // Try to get from config first, then environment variable
      apiKey = config.googleSheets?.apiKey || process.env.GOOGLE_SHEETS_API_KEY;
      
      // Debug logging (remove in production)
      if (!apiKey) {
        console.log('Config googleSheets:', config.googleSheets);
        console.log('process.env.GOOGLE_SHEETS_API_KEY:', process.env.GOOGLE_SHEETS_API_KEY ? 'EXISTS' : 'NOT FOUND');
      }
    }

    if (!apiKey) {
      throw new Error('Google Sheets API Key không được cấu hình. Vui lòng thêm GOOGLE_SHEETS_API_KEY vào file .env');
    }

    const sheets = google.sheets({ version: 'v4', auth: apiKey });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    return response.data.values || [];
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    if (error.message.includes('API key')) {
      throw new Error('Google Sheets API Key không hợp lệ');
    }
    if (error.message.includes('Unable to parse range')) {
      throw new Error('Không thể đọc dữ liệu từ Google Sheets. Vui lòng kiểm tra quyền truy cập (sheet phải là public hoặc được chia sẻ)');
    }
    if (error.code === 403) {
      throw new Error('Không có quyền truy cập Google Sheets. Vui lòng đảm bảo sheet được chia sẻ công khai hoặc cấu hình quyền truy cập đúng cách');
    }
    if (error.code === 404) {
      throw new Error('Không tìm thấy Google Sheets. Vui lòng kiểm tra lại URL');
    }
    throw new Error(`Lỗi khi đọc Google Sheets: ${error.message}`);
  }
}

/**
 * Get all sheets in a spreadsheet
 */
export async function getSheetNames(sheetId, apiKey = null) {
  try {
    if (!apiKey) {
      // Try to get from config first, then environment variable
      apiKey = config.googleSheets?.apiKey || process.env.GOOGLE_SHEETS_API_KEY;
    }

    if (!apiKey) {
      throw new Error('Google Sheets API Key không được cấu hình. Vui lòng thêm GOOGLE_SHEETS_API_KEY vào file .env');
    }

    const sheets = google.sheets({ version: 'v4', auth: apiKey });

    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    return response.data.sheets.map(sheet => ({
      title: sheet.properties.title,
      sheetId: sheet.properties.sheetId,
    }));
  } catch (error) {
    console.error('Error fetching sheet names:', error);
    if (error.code === 403) {
      throw new Error('Không có quyền truy cập Google Sheets. Vui lòng đảm bảo sheet được chia sẻ công khai');
    }
    if (error.code === 404) {
      throw new Error('Không tìm thấy Google Sheets. Vui lòng kiểm tra lại URL');
    }
    throw new Error(`Lỗi khi lấy danh sách sheets: ${error.message}`);
  }
}

/**
 * Parse teams data from Google Sheets rows
 * Expected format: Team Number | Contact Phone | Contact Name
 */
export function parseTeamsFromRows(rows) {
  const teams = [];
  
  // Skip header row (row 1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const teamNumber = row[0]?.toString()?.trim() || '';
    const contactPhone = row[1]?.toString()?.trim() || '';
    const contactName = row[2]?.toString()?.trim() || '';

    if (teamNumber || contactPhone || contactName) {
      teams.push({
        id: teams.length + 1,
        teamNumber: teamNumber || `#${teams.length + 1}`,
        contactPhone: contactPhone,
        contactName: contactName,
        logo: null,
        wins: 0,
        draws: 0,
        losses: 0,
        members: []
      });
    }
  }

  return teams;
}

/**
 * Parse members data from Google Sheets rows
 * For football: Jersey Number | Name | Phone | Position
 * For other sports: Name | Phone | Position
 */
export function parseMembersFromRows(rows, isFootball = false) {
  const members = [];

  // Skip header row (row 1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    let jerseyNumber = '';
    let name = '';
    let phone = '';
    let position = '';

    if (isFootball) {
      jerseyNumber = row[0]?.toString()?.trim() || '';
      name = row[1]?.toString()?.trim() || '';
      phone = row[2]?.toString()?.trim() || '';
      position = row[3]?.toString()?.trim() || '';
    } else {
      name = row[0]?.toString()?.trim() || '';
      phone = row[1]?.toString()?.trim() || '';
      position = row[2]?.toString()?.trim() || '';
    }

    if (name) {
      const member = {
        name: name,
        phone: phone || '',
        position: position || '',
        avatar: null
      };

      if (isFootball && jerseyNumber) {
        member.jerseyNumber = jerseyNumber;
      }

      members.push(member);
    }
  }

  return members;
}

