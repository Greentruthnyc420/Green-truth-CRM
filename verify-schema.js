/**
 * Database Schema Verification and Setup Script
 * 
 * This script checks if the required tables exist in Supabase
 * and provides instructions for creating them if they don't.
 */

import { supabase } from './src/services/supabaseClient.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REQUIRED_TABLES = ['shifts', 'sales', 'leads', 'activations'];

async function checkTableExists(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(0);

        if (error) {
            // Check if error is "relation does not exist"
            if (error.message.includes('does not exist')) {
                return false;
            }
            // Other errors might be permissions, which means table exists
            console.warn(`⚠️  Table "${tableName}" exists but query failed:`, error.message);
            return true;
        }
        return true;
    } catch (e) {
        console.error(`❌ Error checking table "${tableName}":`, e.message);
        return false;
    }
}

async function verifySchema() {
    console.log('🔍 Verifying Supabase Database Schema...\n');

    const results = {};

    for (const table of REQUIRED_TABLES) {
        const exists = await checkTableExists(table);
        results[table] = exists;

        if (exists) {
            console.log(`✅ Table "${table}" exists`);
        } else {
            console.log(`❌ Table "${table}" is MISSING`);
        }
    }

    console.log('\n' + '='.repeat(60));

    const missingTables = Object.entries(results)
        .filter(([_, exists]) => !exists)
        .map(([table]) => table);

    if (missingTables.length === 0) {
        console.log('✅ All required tables exist!');
        console.log('\n📊 Database is ready for use.');
        return true;
    } else {
        console.log(`❌ Missing ${missingTables.length} table(s): ${missingTables.join(', ')}\n`);
        console.log('📋 NEXT STEPS:');
        console.log('1. Open your Supabase project dashboard');
        console.log('2. Navigate to: SQL Editor');
        console.log('3. Execute the contents of: schema.sql');
        console.log('4. Run this script again to verify\n');

        console.log('🔗 Supabase Dashboard: https://app.supabase.com/project/wlcqrgkvkcmewepbxwfh/editor');

        return false;
    }
}

async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (error) throw error;
        console.log('✅ Supabase connection successful\n');
        return true;
    } catch (e) {
        console.error('❌ Supabase connection failed:', e.message);
        console.error('\nPlease check your .env.local file for correct credentials.\n');
        return false;
    }
}

async function main() {
    console.log('Green Truth CRM - Database Schema Verification');
    console.log('='.repeat(60) + '\n');

    const connected = await testConnection();
    if (!connected) {
        process.exit(1);
    }

    const schemaValid = await verifySchema();

    if (!schemaValid) {
        process.exit(1);
    }

    console.log('\n✨ Schema verification complete!\n');
}

main();
