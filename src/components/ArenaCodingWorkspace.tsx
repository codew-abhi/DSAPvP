import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { ArrayQuestion, TestResultItem } from '../lib/types';
import { fetchArrayQuestions, fetchQuestionDetail } from '../lib/leetcode';
import { LANGUAGE_MAP, runAllTestCases, executeCodeWithJudge0, buildExecutableCode } from '../lib/judge0';
import { Play, Send, RefreshCw, CheckCircle2, XCircle, Cpu, Terminal, FileText, Shuffle } from 'lucide-react';

interface ArenaCodingWorkspaceProps {
  onMatchComplete?: (winnerId: string) => void;
}

export const ArenaCodingWorkspace: React.FC<ArenaCodingWorkspaceProps> = () => {
  const [currentQuestion, setCurrentQuestion] = useState<ArrayQuestion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLang, setSelectedLang] = useState<string>('cpp');
  const [code, setCode] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'description' | 'testcases' | 'results'>('description');
  const [testResults, setTestResults] = useState<TestResultItem[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState<number>(0);
  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(45);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidthPx = e.clientX - containerRect.left;
      const newPercent = (newWidthPx / containerRect.width) * 100;
      setLeftWidthPercent(Math.min(Math.max(newPercent, 20), 80));
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Load Array questions on mount
  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      const questions = await fetchArrayQuestions(20, true);
      if (questions.length > 0) {
        const randomIndex = Math.floor(Math.random() * questions.length);
        const detail = await fetchQuestionDetail(questions[randomIndex].titleSlug);
        setCurrentQuestion(detail);
      }
      setLoading(false);
    }
    loadQuestions();
  }, []);

  const handleShuffleQuestions = async () => {
    setLoading(true);
    setTestResults([]);
    setConsoleOutput('');
    const questions = await fetchArrayQuestions(20, true);
    if (questions.length > 0) {
      const randomIndex = Math.floor(Math.random() * questions.length);
      const detail = await fetchQuestionDetail(questions[randomIndex].titleSlug);
      setCurrentQuestion(detail);
    }
    setLoading(false);
  };

  // Update editor code when question or selectedLang changes
  useEffect(() => {
    if (!currentQuestion) return;
    const snippets = currentQuestion.codeSnippets || [];
    const matched = snippets.find(s => {
      const slug = s.langSlug.toLowerCase();
      if (selectedLang === 'cpp') return slug.includes('cpp') || slug.includes('c++');
      if (selectedLang === 'python3' || selectedLang === 'python') return slug.includes('python');
      if (selectedLang === 'javascript' || selectedLang === 'js') return slug.includes('javascript') || slug.includes('js');
      if (selectedLang === 'java') return slug.includes('java');
      return slug === selectedLang;
    });

    if (matched) {
      setCode(matched.code);
    } else {
      if (selectedLang === 'python3') {
        setCode(`class Solution:\n    def solution(self, nums: List[int]) -> List[int]:\n        return []`);
      } else if (selectedLang === 'javascript') {
        setCode(`/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar solution = function(nums) {\n    return [];\n};`);
      } else {
        setCode(`#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> solution(vector<int>& nums) {\n        return {};\n    }\n};`);
      }
    }
  }, [currentQuestion, selectedLang]);



  // Run Test Cases with Judge0
  const handleRunTests = async () => {
    if (!currentQuestion) return;
    setIsExecuting(true);
    setActiveTab('results');
    setConsoleOutput('Executing test cases via Judge0 environment...\n');

    const testCasesToRun = currentQuestion.testCases && currentQuestion.testCases.length > 0
      ? currentQuestion.testCases
      : (currentQuestion.exampleTestcases || []).map(input => ({ input, expectedOutput: '' }));

    try {
      const results = await runAllTestCases(code, selectedLang, testCasesToRun);
      setTestResults(results);

      const allPassed = results.every(r => r.passed);
      const passedCount = results.filter(r => r.passed).length;

      let summaryLog = `--- Judge0 Execution Summary ---\n`;
      summaryLog += `Total Test Cases: ${results.length}\n`;
      summaryLog += `Passed: ${passedCount}/${results.length}\n`;
      summaryLog += `Status: ${allPassed ? 'ACCEPTED (ALL PASSED)' : 'WRONG ANSWER'}\n\n`;

      results.forEach((r, idx) => {
        summaryLog += `[Test ${idx + 1}] ${r.passed ? '✓ PASSED' : '✗ FAILED'}\n`;
        summaryLog += `Input:\n${r.input}\n`;
        summaryLog += `Expected: ${r.expectedOutput}\n`;
        summaryLog += `Actual:   ${r.actualOutput || '(No stdout returned)'}\n`;
        if (r.error) summaryLog += `Error:    ${r.error}\n`;
        if (r.time) summaryLog += `Execution Time: ${r.time}s | Memory: ${r.memory} KB\n`;
        summaryLog += `-------------------------\n`;
      });

      setConsoleOutput(summaryLog);
    } catch (err: any) {
      setConsoleOutput(`Judge0 Execution Error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Run Custom Input with Judge0
  const handleRunCustomInput = async () => {
    if (!customInput.trim()) return;
    setIsExecuting(true);
    setActiveTab('results');
    setConsoleOutput('Running custom input on Judge0...\n');

    const langConfig = LANGUAGE_MAP[selectedLang as keyof typeof LANGUAGE_MAP] || LANGUAGE_MAP.javascript;
    const executableCode = buildExecutableCode(code, selectedLang);

    try {
      const judgeRes = await executeCodeWithJudge0(executableCode, langConfig.id, customInput);
      let output = `--- Custom Input Execution ---\n`;
      output += `Status: ${judgeRes.status.description}\n`;
      if (judgeRes.stdout) output += `Output:\n${judgeRes.stdout}\n`;
      if (judgeRes.stderr) output += `Error Log:\n${judgeRes.stderr}\n`;
      if (judgeRes.compile_output) output += `Compilation Output:\n${judgeRes.compile_output}\n`;
      if (judgeRes.time) output += `Time: ${judgeRes.time}s | Memory: ${judgeRes.memory} KB\n`;

      setConsoleOutput(output);
    } catch (err: any) {
      setConsoleOutput(`Execution Error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="w-full flex-grow flex flex-col min-h-0 bg-[#080c10] text-[#e8edf2] overflow-hidden">

      {/* Top Controller Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#0d1520] border-b border-[#1a2535]">
        <div className="flex items-center gap-4">
          {/* Question Title & Difficulty */}
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-base text-[#e8edf2] tracking-wide">
              {currentQuestion ? `${currentQuestion.frontendId ? currentQuestion.frontendId + '. ' : ''}${currentQuestion.title}` : 'Loading Problem...'}
            </h2>
            {currentQuestion && (
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded font-mono ${
                  currentQuestion.difficulty === 'Easy'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : currentQuestion.difficulty === 'Medium'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {currentQuestion.difficulty}
              </span>
            )}
          </div>

          {/* Random Problem Action Button */}
          <button
            onClick={handleShuffleQuestions}
            disabled={loading || isExecuting}
            title="Fetch Random Question from LeetCode"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1a2535] hover:bg-[#2a384c] text-[#00ff88] text-xs font-mono font-bold rounded border border-[#2a384c] hover:border-[#00ff88]/50 transition-all disabled:opacity-50"
          >
            <Shuffle size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Fetching...' : 'Random Problem'}
          </button>
        </div>

        {/* Language Selector & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-[#1a2535] border border-[#2a384c] rounded font-mono text-sm text-[#00ff88]">
            <Cpu size={15} className="text-[#00ff88]" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-transparent text-[#00ff88] font-bold text-xs focus:outline-none cursor-pointer py-0.5"
            >
              <option value="cpp" className="bg-[#0d1520] text-[#e8edf2]">C++ (GCC 11.2)</option>
              <option value="python3" className="bg-[#0d1520] text-[#e8edf2]">Python (3.11)</option>
              <option value="javascript" className="bg-[#0d1520] text-[#e8edf2]">JavaScript (Node 18)</option>
            </select>
          </div>

          <button
            onClick={handleRunTests}
            disabled={isExecuting || loading}
            className="flex items-center gap-2 px-4 py-1.5 rounded font-bold text-sm bg-transparent border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/10 transition-all disabled:opacity-50"
          >
            <Play size={15} />
            {isExecuting ? 'Running...' : 'Run Code'}
          </button>

          <button
            onClick={handleRunTests}
            disabled={isExecuting || loading}
            className="flex items-center gap-2 px-5 py-1.5 rounded font-bold text-sm bg-[#00ff88] text-[#080c10] shadow-[0_0_12px_rgba(0,255,136,0.3)] hover:brightness-110 transition-all disabled:opacity-50"
          >
            <Send size={15} />
            Submit
          </button>
        </div>
      </div>

      {/* Main Workspace Split */}
      <div
        ref={containerRef}
        className={`flex-grow flex flex-row min-h-0 overflow-hidden ${isResizing ? 'select-none' : ''}`}
      >
        {/* Left Pane: Question Description & Test Cases */}
        <div
          style={{ width: `${leftWidthPercent}%` }}
          className="flex flex-col h-full min-h-0 bg-[#080c10] border-r border-[#1a2535] shrink-0"
        >

          {/* Tabs */}
          <div className="flex border-b border-[#1a2535] bg-[#0d1520]">
            <button
              onClick={() => setActiveTab('description')}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'description'
                  ? 'border-[#00ff88] text-[#00ff88] bg-[#080c10]'
                  : 'border-transparent text-[#6b8299] hover:text-[#e8edf2]'
                }`}
            >
              <FileText size={15} /> Description
            </button>
            <button
              onClick={() => setActiveTab('testcases')}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'testcases'
                  ? 'border-[#00ff88] text-[#00ff88] bg-[#080c10]'
                  : 'border-transparent text-[#6b8299] hover:text-[#e8edf2]'
                }`}
            >
              <Terminal size={15} /> Test Cases
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'results'
                  ? 'border-[#00ff88] text-[#00ff88] bg-[#080c10]'
                  : 'border-transparent text-[#6b8299] hover:text-[#e8edf2]'
                }`}
            >
              <Cpu size={15} /> Judge0 Console
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto min-h-0 flex-grow text-sm leading-relaxed">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-[#6b8299] gap-3">
                <RefreshCw size={24} className="animate-spin text-[#00ff88]" />
                <p className="font-mono">Loading Array Question from LeetCode...</p>
              </div>
            ) : activeTab === 'description' && currentQuestion ? (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-[#e8edf2]">
                  {currentQuestion.frontendId}. {currentQuestion.title}
                </h1>

                {/* HTML Description from LeetCode */}
                {currentQuestion.content ? (
                  <div
                    className="prose prose-invert max-w-none text-gray-300 font-sans leading-relaxed text-sm [&>pre]:bg-[#0d1520] [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:border [&>pre]:border-[#1a2535] [&>code]:bg-[#1a2535] [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-[#00ff88] [&>code]:font-mono"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.content }}
                  />
                ) : (
                  <p className="text-[#6b8299]">No description available.</p>
                )}
              </div>
            ) : activeTab === 'testcases' ? (
              <div className="space-y-6">
                <h3 className="font-bold text-[#00ff88] text-base font-mono uppercase tracking-wider">
                  Sample Testcases
                </h3>
                {currentQuestion?.testCases && currentQuestion.testCases.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex gap-2 border-b border-[#1a2535] pb-2">
                      {currentQuestion.testCases.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedTestCaseIndex(idx)}
                          className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${selectedTestCaseIndex === idx
                              ? 'bg-[#00ff88] text-[#080c10]'
                              : 'bg-[#1a2535] text-[#6b8299] hover:text-[#e8edf2]'
                            }`}
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                    </div>

                    {currentQuestion.testCases[selectedTestCaseIndex] && (
                      <div className="space-y-3 font-mono">
                        <div>
                          <label className="text-xs text-[#6b8299] block mb-1">Input Stdin:</label>
                          <pre className="p-3 bg-[#0d1520] border border-[#1a2535] rounded text-emerald-400 text-xs overflow-x-auto whitespace-pre-wrap">
                            {currentQuestion.testCases[selectedTestCaseIndex].input}
                          </pre>
                        </div>
                        <div>
                          <label className="text-xs text-[#6b8299] block mb-1">Expected Stdout:</label>
                          <pre className="p-3 bg-[#0d1520] border border-[#1a2535] rounded text-[#00ff88] text-xs overflow-x-auto whitespace-pre-wrap">
                            {currentQuestion.testCases[selectedTestCaseIndex].expectedOutput}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[#6b8299]">No testcases configured.</p>
                )}

                {/* Custom Input Runner */}
                <div className="pt-4 border-t border-[#1a2535]">
                  <label className="block text-xs font-mono font-bold text-[#00ff88] mb-2 uppercase">
                    Custom Stdin Input:
                  </label>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter custom input string..."
                    rows={4}
                    className="w-full bg-[#0d1520] border border-[#1a2535] rounded p-3 text-xs font-mono text-[#e8edf2] focus:outline-none focus:border-[#00ff88]"
                  />
                  <button
                    onClick={handleRunCustomInput}
                    disabled={isExecuting || !customInput.trim()}
                    className="mt-2 px-4 py-1.5 bg-[#1a2535] hover:bg-[#2a384c] text-[#00ff88] text-xs font-mono font-bold rounded border border-[#00ff88]/30 transition-all disabled:opacity-50"
                  >
                    Run Custom Stdin
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#00ff88] uppercase tracking-wider">Judge0 Execution Results</h3>
                  <span className="text-[10px] text-[#6b8299]">Server: ce.judge0.com</span>
                </div>

                {testResults.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    {testResults.map((tr) => (
                      <div
                        key={tr.testCaseIndex}
                        className={`p-3 rounded border flex items-center justify-between ${tr.passed
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {tr.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                          <span className="font-bold">Test Case #{tr.testCaseIndex}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px]">
                          <span>Status: {tr.status}</span>
                          {tr.time && <span>Time: {tr.time}s</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 bg-[#0d1520] border border-[#1a2535] rounded text-gray-300 overflow-x-auto whitespace-pre-wrap">
                  {consoleOutput || 'Run code to view output logs...'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Draggable Resizer Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-2 hover:w-2 bg-[#0d1520] hover:bg-[#00ff88]/50 cursor-col-resize flex items-center justify-center transition-colors shrink-0 select-none ${
            isResizing ? 'bg-[#00ff88] shadow-[0_0_10px_#00ff88]' : ''
          }`}
          title="Drag left/right to resize panels"
        >
          <div
            className={`w-0.5 h-8 rounded-full transition-colors ${
              isResizing ? 'bg-[#080c10]' : 'bg-[#2a384c] group-hover:bg-[#00ff88]'
            }`}
          />
        </div>

        {/* Right Pane: Monaco Code Editor */}
        <div
          style={{ width: `${100 - leftWidthPercent}%` }}
          className="flex flex-col h-full min-h-0 bg-[#05080c] shrink-0 min-w-0"
        >
          <div className="px-4 py-2 bg-[#0d1520] border-b border-[#1a2535] flex items-center justify-between text-xs font-mono text-[#6b8299]">
            <span>EDITOR ({selectedLang.toUpperCase()})</span>
            <span>Judge0 CE Runtime Ready</span>
          </div>

          <div className="flex-grow">
            <Editor
              height="100%"
              language={LANGUAGE_MAP[selectedLang as keyof typeof LANGUAGE_MAP]?.monaco || 'javascript'}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code', 'Consolas', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                padding: { top: 12, bottom: 12 }
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
