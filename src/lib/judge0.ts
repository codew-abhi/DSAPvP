import type { Judge0Result, TestResultItem } from './types';

export const JUDGE0_API_URL = 'https://ce.judge0.com';

export const LANGUAGE_MAP = {
  javascript: { id: 63, name: 'JavaScript (Node.js 18.15.0)', monaco: 'javascript' },
  python3: { id: 71, name: 'Python (3.11.2)', monaco: 'python' },
  cpp: { id: 54, name: 'C++ (GCC 11.2.0)', monaco: 'cpp' },
  java: { id: 62, name: 'Java (OpenJDK 13.0.1)', monaco: 'java' }
};

/**
 * Wraps user code with input parsing and output printing harness for Judge0 execution.
 */
export function buildExecutableCode(
  userCode: string,
  langSlug: string,
  _funcName: string = 'twoSum'
): string {
  if (langSlug === 'javascript' || langSlug === 'js') {
    return `
${userCode}

const fs = require('fs');
try {
  const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
  if (input.length > 0 && input[0] !== '') {
    const parsedArgs = input.map(line => {
      try { return JSON.parse(line.trim()); } 
      catch (e) { return line.trim(); }
    });
    
    // Find exported or top-level function
    let fn = typeof twoSum === 'function' ? twoSum : 
             typeof maxProfit === 'function' ? maxProfit : 
             typeof containsDuplicate === 'function' ? containsDuplicate : 
             typeof maxSubArray === 'function' ? maxSubArray : 
             typeof moveZeroes === 'function' ? moveZeroes : null;
             
    if (!fn) {
      const fnNames = Object.keys(global).filter(k => typeof global[k] === 'function');
      for (const key of ['twoSum', 'maxProfit', 'containsDuplicate', 'maxSubArray', 'moveZeroes']) {
        if (typeof eval('typeof ' + key) !== 'undefined') {
          fn = eval(key);
          break;
        }
      }
    }
    
    if (fn) {
      const res = fn(...parsedArgs);
      if (res !== undefined) {
        console.log(JSON.stringify(res));
      } else {
        // In-place modification check (e.g. moveZeroes where first arg is modified)
        console.log(JSON.stringify(parsedArgs[0]));
      }
    } else {
      console.log("No valid function found.");
    }
  }
} catch (err) {
  console.error(err);
}
`;
  }

  if (langSlug === 'python3' || langSlug === 'python') {
    return `
import sys
import json

${userCode}

if __name__ == '__main__':
    lines = [line.strip() for line in sys.stdin.read().strip().split('\\n') if line.strip()]
    if lines:
        args = []
        for l in lines:
            try:
                args.append(json.loads(l))
            except:
                args.append(l)
        
        sol = Solution()
        # Find method on Solution
        method = None
        for name in ['twoSum', 'maxProfit', 'containsDuplicate', 'maxSubArray', 'moveZeroes']:
            if hasattr(sol, name):
                method = getattr(sol, name)
                break
        
        if method:
            res = method(*args)
            if res is not None:
                print(json.dumps(res))
            else:
                # In place modification
                print(json.dumps(args[0]))
`;
  }

  if (langSlug === 'cpp') {
    // Basic C++ driver
    return `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>

using namespace std;

${userCode}

int main() {
    // Execution completed successfully
    cout << "Execution completed." << endl;
    return 0;
}
`;
  }

  // Java fallback
  return `
import java.util.*;
import java.io.*;

${userCode}
`;
}

/**
 * Submits source code to Judge0 API and waits for result
 */
export async function executeCodeWithJudge0(
  sourceCode: string,
  languageId: number,
  stdin: string = '',
  expectedOutput: string = ''
): Promise<Judge0Result> {
  try {
    const response = await fetch(`${JUDGE0_API_URL}/submissions?wait=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageId,
        stdin,
        expected_output: expectedOutput ? expectedOutput.trim() : undefined
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Judge0 API error (${response.status}): ${errText}`);
    }

    const data: Judge0Result = await response.json();
    return data;
  } catch (error: any) {
    return {
      stdout: null,
      stderr: error.message || 'Error connecting to Judge0 execution server',
      compile_output: null,
      message: null,
      time: null,
      memory: null,
      status: {
        id: 13,
        description: 'Internal Error'
      }
    };
  }
}

/**
 * Compares two output strings ignoring minor whitespace or formatting diffs
 */
export function compareOutputs(actual: string, expected: string): boolean {
  if (!actual || !expected) return false;
  
  const cleanActual = actual.trim().replace(/\s+/g, '');
  const cleanExpected = expected.trim().replace(/\s+/g, '');
  
  if (cleanActual === cleanExpected) return true;

  // Try parsing arrays / JSON objects to compare
  try {
    const actObj = JSON.parse(actual.trim());
    const expObj = JSON.parse(expected.trim());
    return JSON.stringify(actObj) === JSON.stringify(expObj);
  } catch {
    return false;
  }
}

/**
 * Runs code against all test cases for a given problem
 */
export async function runAllTestCases(
  userCode: string,
  langSlug: string,
  testCases: { input: string; expectedOutput: string }[]
): Promise<TestResultItem[]> {
  const langConfig = LANGUAGE_MAP[langSlug as keyof typeof LANGUAGE_MAP] || LANGUAGE_MAP.javascript;
  const executableCode = buildExecutableCode(userCode, langSlug);

  const results: TestResultItem[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const judgeResult = await executeCodeWithJudge0(
      executableCode,
      langConfig.id,
      tc.input
    );

    const actualOutput = (judgeResult.stdout || '').trim();
    const passed = compareOutputs(actualOutput, tc.expectedOutput);

    results.push({
      testCaseIndex: i + 1,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput,
      passed,
      error: judgeResult.stderr || judgeResult.compile_output || undefined,
      status: judgeResult.status?.description || (passed ? 'Accepted' : 'Wrong Answer'),
      time: judgeResult.time || undefined,
      memory: judgeResult.memory || undefined
    });
  }

  return results;
}
