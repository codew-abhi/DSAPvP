import type { Judge0Result, TestResultItem } from './types';
import { API_BASE_URL } from './config';

export const JUDGE0_API_URL = 'https://ce.judge0.com';
export const BACKEND_PROXY_URL = `${API_BASE_URL}/questions/judge0/execute`;

export const LANGUAGE_MAP = {
  cpp: { id: 54, name: 'C++ (GCC 11.2)', monaco: 'cpp', slug: 'cpp' },
  python3: { id: 71, name: 'Python (3.11.2)', monaco: 'python', slug: 'python3' },
  javascript: { id: 63, name: 'JavaScript (Node 18)', monaco: 'javascript', slug: 'javascript' },
  java: { id: 62, name: 'Java (OpenJDK 13)', monaco: 'java', slug: 'java' }
};

/**
 * Wraps user code with input parsing and output printing harness for Judge0 execution.
 */
export function buildExecutableCode(
  userCode: string,
  langSlug: string,
  _funcName?: string
): string {
  const normLang = langSlug.toLowerCase();

  // ----------------------------------------------------
  // JavaScript Harness
  // ----------------------------------------------------
  if (normLang.includes('js') || normLang.includes('javascript')) {
    return `
${userCode}

const fs = require('fs');
try {
  const raw = fs.readFileSync(0, 'utf-8');
  const lines = raw.trim().split('\\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0) {
    const parsedArgs = lines.map(line => {
      // Strip parameter assignment like "nums = " or "target = "
      const cleanLine = line.replace(/^[a-zA-Z0-9_$]+\\s*=\\s*/, '');
      try { return JSON.parse(cleanLine); } 
      catch (e) { return cleanLine; }
    });

    // Detect function dynamically
    let fn = null;
    const knownNames = ['twoSum', 'maxProfit', 'containsDuplicate', 'maxSubArray', 'moveZeroes'];
    for (const name of knownNames) {
      try {
        if (typeof eval(name) === 'function') {
          fn = eval(name);
          break;
        }
      } catch (e) {}
    }

    if (!fn) {
      // Find any top-level declared function
      const fnMatch = userCode.match(/(?:function|var|let|const)\\s+([a-zA-Z0-9_$]+)/);
      if (fnMatch && fnMatch[1]) {
        try {
          if (typeof eval(fnMatch[1]) === 'function') fn = eval(fnMatch[1]);
        } catch (e) {}
      }
    }

    if (fn) {
      const firstArgClone = Array.isArray(parsedArgs[0]) ? [...parsedArgs[0]] : null;
      const res = fn(...parsedArgs);

      if (res !== undefined) {
        console.log(JSON.stringify(res));
      } else if (firstArgClone) {
        // In-place mutation check (e.g. moveZeroes)
        console.log(JSON.stringify(parsedArgs[0]));
      } else {
        console.log("null");
      }
    } else {
      console.log("No valid solution function found.");
    }
  }
} catch (err) {
  console.error(err.message || err);
}
`;
  }

  // ----------------------------------------------------
  // Python Harness
  // ----------------------------------------------------
  if (normLang.includes('py') || normLang.includes('python')) {
    return `
from __future__ import annotations
import sys
import json
from typing import *

${userCode}

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    lines = [line.strip() for line in raw.split('\\n') if line.strip()]
    if lines:
        args = []
        for l in lines:
            import re
            clean = re.sub(r'^[a-zA-Z0-9_$]+\\s*=\\s*', '', l)
            try:
                args.append(json.loads(clean))
            except:
                args.append(clean)

        sol = Solution()
        # Find method on Solution dynamically
        method = None
        for name in ['twoSum', 'maxProfit', 'containsDuplicate', 'maxSubArray', 'moveZeroes']:
            if hasattr(sol, name):
                method = getattr(sol, name)
                break

        if not method:
            methods = [m for m in dir(Solution) if not m.startswith('_') and callable(getattr(Solution, m))]
            if methods:
                method = getattr(sol, methods[0])

        if method:
            import copy
            arg0_copy = copy.deepcopy(args[0]) if (args and isinstance(args[0], list)) else None
            res = method(*args)
            if res is not None:
                print(json.dumps(res))
            elif arg0_copy is not None:
                # In place mutation check
                print(json.dumps(args[0]))
            else:
                print("null")
`;
  }

  // ----------------------------------------------------
  // C++ Harness
  // ----------------------------------------------------
  if (normLang.includes('cpp') || normLang.includes('c++')) {
    return `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <stack>
#include <map>
#include <set>

using namespace std;

${userCode}

vector<int> parseVectorInt(string s) {
    vector<int> res;
    // Strip parameter name if present (e.g. nums = [2,7])
    size_t eq = s.find('=');
    if (eq != string::npos) s = s.substr(eq + 1);
    for (char &c : s) {
        if (c == '[' || c == ']' || c == ',') c = ' ';
    }
    stringstream ss(s);
    int val;
    while (ss >> val) {
        res.push_back(val);
    }
    return res;
}

int parseSingleInt(string s) {
    size_t eq = s.find('=');
    if (eq != string::npos) s = s.substr(eq + 1);
    stringstream ss(s);
    int val = 0;
    ss >> val;
    return val;
}

void printResult(const vector<int>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        cout << v[i] << (i + 1 < v.size() ? "," : "");
    }
    cout << "]" << endl;
}

void printResult(int val) { cout << val << endl; }
void printResult(long long val) { cout << val << endl; }
void printResult(bool val) { cout << (val ? "true" : "false") << endl; }
void printResult(const string& s) { cout << "\\"" << s << "\\"" << endl; }

int main() {
    Solution sol;
    string line1, line2;
    if (getline(cin, line1)) {
        ${
          userCode.includes('twoSum')
            ? `
            vector<int> nums = parseVectorInt(line1);
            if (getline(cin, line2)) {
                int target = parseSingleInt(line2);
                printResult(sol.twoSum(nums, target));
                return 0;
            }
            `
            : userCode.includes('maxProfit')
            ? `
            vector<int> prices = parseVectorInt(line1);
            printResult(sol.maxProfit(prices));
            return 0;
            `
            : userCode.includes('containsDuplicate')
            ? `
            vector<int> nums = parseVectorInt(line1);
            printResult(sol.containsDuplicate(nums));
            return 0;
            `
            : userCode.includes('maxSubArray')
            ? `
            vector<int> nums = parseVectorInt(line1);
            printResult(sol.maxSubArray(nums));
            return 0;
            `
            : userCode.includes('moveZeroes')
            ? `
            vector<int> nums = parseVectorInt(line1);
            sol.moveZeroes(nums);
            printResult(nums);
            return 0;
            `
            : `
            // Generic execution
            vector<int> nums = parseVectorInt(line1);
            cout << "Executed successfully." << endl;
            return 0;
            `
        }
    }
    return 0;
}
`;
  }

  // ----------------------------------------------------
  // Java Harness
  // ----------------------------------------------------
  return `
import java.util.*;
import java.io.*;

${userCode}

public class Main {
    public static void main(String[] args) {
        System.out.println("Main runner executed");
    }
}
`;
}

/**
 * Submits source code to Judge0 API with fallback to Backend proxy
 */
export async function executeCodeWithJudge0(
  sourceCode: string,
  languageId: number,
  stdin: string = '',
  expectedOutput: string = ''
): Promise<Judge0Result> {
  const payload = {
    source_code: sourceCode,
    language_id: languageId,
    stdin,
    expected_output: expectedOutput ? expectedOutput.trim() : undefined
  };

  // 1. Try Backend Proxy first (avoids browser CORS & network blocks)
  try {
    const proxyRes = await fetch(BACKEND_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      if (proxyData.success && proxyData.result) {
        return proxyData.result;
      }
    }
  } catch {
    // Backend proxy not reachable, fall through to direct Judge0
  }

  // 2. Direct request to Judge0 CE
  try {
    const response = await fetch(`${JUDGE0_API_URL}/submissions?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data: Judge0Result = await response.json();
      return data;
    }

    const errText = await response.text();
    return {
      stdout: null,
      stderr: `Judge0 Server (${response.status}): ${errText || 'Execution failed'}`,
      compile_output: null,
      message: null,
      time: null,
      memory: null,
      status: { id: 13, description: `Server Error ${response.status}` }
    };
  } catch (error: any) {
    return {
      stdout: null,
      stderr: error.message || 'Error connecting to Judge0 execution server',
      compile_output: null,
      message: null,
      time: null,
      memory: null,
      status: { id: 13, description: 'Connection Failed' }
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

  // Try parsing JSON structures (e.g. [0,1] vs [0, 1] or true vs true)
  try {
    const actObj = JSON.parse(actual.trim());
    const expObj = JSON.parse(expected.trim());

    // Array comparison
    if (Array.isArray(actObj) && Array.isArray(expObj)) {
      if (actObj.length !== expObj.length) return false;
      const directMatch = JSON.stringify(actObj) === JSON.stringify(expObj);
      if (directMatch) return true;

      // Unordered array comparison (e.g. Two Sum indices in any order)
      const sortedAct = [...actObj].sort();
      const sortedExp = [...expObj].sort();
      return JSON.stringify(sortedAct) === JSON.stringify(sortedExp);
    }

    return JSON.stringify(actObj) === JSON.stringify(expObj);
  } catch {
    return cleanActual.toLowerCase() === cleanExpected.toLowerCase();
  }
}

/**
 * Runs code against all test cases concurrently using Promise.all
 */
export async function runAllTestCases(
  userCode: string,
  langSlug: string,
  testCases: { input: string; expectedOutput: string }[]
): Promise<TestResultItem[]> {
  const langConfig = LANGUAGE_MAP[langSlug as keyof typeof LANGUAGE_MAP] || LANGUAGE_MAP.cpp;
  const executableCode = buildExecutableCode(userCode, langSlug);

  // Run test cases concurrently for maximum speed
  const promises = testCases.map(async (tc, index) => {
    const judgeResult = await executeCodeWithJudge0(
      executableCode,
      langConfig.id,
      tc.input,
      tc.expectedOutput
    );

    const actualOutput = (judgeResult.stdout || '').trim();
    const passed = compareOutputs(actualOutput, tc.expectedOutput);

    const error =
      judgeResult.compile_output ||
      judgeResult.stderr ||
      (judgeResult.status?.id > 3 && judgeResult.status?.id !== 4 ? judgeResult.status.description : undefined);

    return {
      testCaseIndex: index + 1,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput,
      passed,
      error: error || undefined,
      status: judgeResult.status?.description || (passed ? 'Accepted' : 'Wrong Answer'),
      time: judgeResult.time || undefined,
      memory: judgeResult.memory || undefined
    };
  });

  return Promise.all(promises);
}
