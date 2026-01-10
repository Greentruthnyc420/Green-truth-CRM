import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Hardcode the key
process.env.JULES_API_KEY = "AQ.Ab8RN6Jyxqgkr24kl9xSo53odTFGhZRPMW2MHLX1aiRhhueCvg";

// Import the server
const serverPath = join(__dirname, 'node_modules', '@amitdeshmukh', 'google-jules-mcp', 'dist', 'server.js');
import(serverPath);
