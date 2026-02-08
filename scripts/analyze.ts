#!/usr/bin/env tsx
/**
 * Comprehensive code analysis script
 * Similar to `flutter analyze` - checks for various issues in the codebase
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface AnalysisResult {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  file?: string;
  line?: number;
}

const results: AnalysisResult[] = [];

function addResult(result: AnalysisResult) {
  results.push(result);
}

function checkTypeScript() {
  console.log('🔍 Checking TypeScript...');
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('✅ TypeScript: No errors\n');
  } catch (error: any) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const lines = output.split('\n').filter((line: string) => line.trim());
    
    lines.forEach((line: string) => {
      if (line.includes('error TS')) {
        const match = line.match(/(.+?)\((\d+),(\d+)\): error TS(\d+): (.+)/);
        if (match) {
          addResult({
            type: 'error',
            category: 'TypeScript',
            message: match[5],
            file: match[1],
            line: parseInt(match[2]),
          });
        } else {
          addResult({
            type: 'error',
            category: 'TypeScript',
            message: line,
          });
        }
      }
    });
    
    console.log(`❌ TypeScript: Found ${lines.length} error(s)\n`);
  }
}

function checkESLint() {
  console.log('🔍 Checking ESLint...');
  try {
    execSync('npm run lint -- --max-warnings=0 .', { stdio: 'pipe' });
    console.log('✅ ESLint: No errors\n');
  } catch (error: any) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const lines = output.split('\n').filter((line: string) => line.trim());
    
    lines.forEach((line: string) => {
      // Only capture errors, skip warnings
      if (line.includes('error') && !line.includes('warning')) {
        const match = line.match(/(.+?):(\d+):(\d+): (.+)/);
        if (match) {
          addResult({
            type: 'error',
            category: 'ESLint',
            message: match[4],
            file: match[1],
            line: parseInt(match[2]),
          });
        } else if (line.includes('error')) {
          addResult({
            type: 'error',
            category: 'ESLint',
            message: line,
          });
        }
      }
    });
    
    const errorCount = results.filter(r => r.category === 'ESLint' && r.type === 'error').length;
    if (errorCount > 0) {
      console.log(`❌ ESLint: Found ${errorCount} error(s)\n`);
    } else {
      console.log('✅ ESLint: No errors (warnings skipped)\n');
    }
  }
}

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  const envFile = join(process.cwd(), '.env.local');
  const envExample = join(process.cwd(), '.env.example');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  
  let envContent = '';
  if (existsSync(envFile)) {
    envContent = readFileSync(envFile, 'utf-8');
  } else if (existsSync(envExample)) {
    envContent = readFileSync(envExample, 'utf-8');
  }
  
  const missing: string[] = [];
  requiredVars.forEach((varName) => {
    const regex = new RegExp(`^${varName}=`, 'm');
    if (!regex.test(envContent)) {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    missing.forEach((varName) => {
      addResult({
        type: 'warning',
        category: 'Environment',
        message: `Missing environment variable: ${varName}`,
      });
    });
    console.log(`⚠️  Environment: Missing ${missing.length} variable(s)\n`);
  } else {
    console.log('✅ Environment: All required variables present\n');
  }
}

function checkBuildErrors() {
  console.log('🔍 Checking for build errors...');
  try {
    // Try to build and capture errors
    execSync('npm run build 2>&1 | head -100', { 
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    console.log('✅ Build: No errors\n');
  } catch (error: any) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const lines = output.split('\n').filter((line: string) => line.trim());
    
    // Extract meaningful error messages
    lines.forEach((line: string) => {
      if (
        line.includes('Error:') ||
        line.includes('error') ||
        line.includes('Failed') ||
        line.includes('Type error')
      ) {
        // Try to extract file and line info
        const fileMatch = line.match(/(.+?)\((\d+),(\d+)\)/);
        if (fileMatch) {
          addResult({
            type: 'error',
            category: 'Build',
            message: line,
            file: fileMatch[1],
            line: parseInt(fileMatch[2]),
          });
        } else {
          addResult({
            type: 'error',
            category: 'Build',
            message: line,
          });
        }
      }
    });
    
    console.log(`❌ Build: Found errors\n`);
  }
}

function checkDynamicPages() {
  console.log('🔍 Checking for pages that need dynamic rendering...');
  
  const pagesDir = join(process.cwd(), 'app');
  const pagesToCheck = [
    'leaderboard/page.tsx',
    'market/[movieId]/page.tsx',
  ];
  
  pagesToCheck.forEach((pagePath) => {
    const fullPath = join(pagesDir, pagePath);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf-8');
      
      // Check if it uses Supabase client or other server-side features
      const usesSupabase = content.includes("from '@/lib/supabase/client'") ||
                          content.includes("from '@/lib/supabase/server'");
      
      // Check if it's already marked as dynamic
      const isDynamic = content.includes("export const dynamic") ||
                       content.includes("export const revalidate");
      
      if (usesSupabase && !isDynamic && !content.includes("'use client'")) {
        addResult({
          type: 'warning',
          category: 'Page Configuration',
          message: `Page ${pagePath} uses Supabase but is not marked as dynamic`,
          file: pagePath,
        });
      }
    }
  });
  
  console.log('✅ Page Configuration: Checked\n');
}

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 ANALYSIS RESULTS (Errors Only)');
  console.log('='.repeat(80) + '\n');
  
  // Filter to only show errors
  const errorsOnly = results.filter((r) => r.type === 'error');
  
  if (errorsOnly.length === 0) {
    console.log('✅ No errors found! Your codebase looks good.\n');
    return;
  }
  
  // Group by category
  const byCategory: Record<string, AnalysisResult[]> = {};
  errorsOnly.forEach((result) => {
    if (!byCategory[result.category]) {
      byCategory[result.category] = [];
    }
    byCategory[result.category].push(result);
  });
  
  // Print by category
  Object.entries(byCategory).forEach(([category, items]) => {
    console.log(`\n📁 ${category} (${items.length} error(s))`);
    console.log('-'.repeat(80));
    
    items.forEach((item) => {
      const location = item.file 
        ? `${item.file}${item.line ? `:${item.line}` : ''}`
        : '';
      
      console.log(`❌ ${item.message}`);
      if (location) {
        console.log(`   at ${location}`);
      }
    });
  });
  
  // Summary
  const errors = errorsOnly.length;
  const warnings = results.filter((r) => r.type === 'warning').length;
  
  console.log('\n' + '='.repeat(80));
  console.log('📈 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total errors: ${errors}`);
  if (warnings > 0) {
    console.log(`  ⚠️  Warnings: ${warnings} (hidden)`);
  }
  console.log('='.repeat(80) + '\n');
  
  // Exit with error code if there are errors
  if (errors > 0) {
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting code analysis...\n');
  
  try {
    checkTypeScript();
    checkESLint();
    checkEnvironmentVariables();
    checkDynamicPages();
    // checkBuildErrors(); // Commented out as it's slow - uncomment if needed
    
    printResults();
  } catch (error: any) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

main();

