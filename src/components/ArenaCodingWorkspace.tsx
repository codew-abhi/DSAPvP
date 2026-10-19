import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { ArrayQuestion, TestResultItem } from '../lib/types';
import { fetchArrayQuestions, fetchQuestionDetail } from '../lib/leetcode';
import { LANGUAGE_MAP, runAllTestCases } from '../lib/judge0';
import { Play, Send, RefreshCw, CheckCircle2, XCircle, Cpu, FileText, Shuffle, Trophy, RotateCcw, LogOut, ChevronUp, ChevronDown, Terminal } from 'lucide-react';
import { getSocket, type ArenaPlayer } from '../lib/socket';

interface ArenaCodingWorkspaceProps {
  roomId?: string;
  initialQuestionSlug?: string;
  opponent?: ArenaPlayer;
  opponentProgress?: { passed: number; total: number } | null;
  onRematch?: () => void;
  onExit?: () => void;
  onMatchComplete?: (winnerId: string) => void;
}

export const ArenaCodingWorkspace: React.FC<ArenaCodingWorkspaceProps> = ({
  roomId,
  initialQuestionSlug,
  opponent,
  opponentProgress,
  onRematch,
  onExit,
  onMatchComplete,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<ArrayQuestion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLang, setSelectedLang] = useState<string>('cpp');
  const [code, setCode] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResultItem[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(45);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [myProgress, setMyProgress] = useState<{ passed: number; total: number } | null>(null);
  const [matchWinner, setMatchWinner] = useState<{ socketId: string; username: string } | null>(null);
  const [consoleOpen, setConsoleOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  // Listen for match-ended event
  useEffect(() => {
    const handleMatchEnded = (data: { winner: { socketId: string; username: string } }) => {
      setMatchWinner(data.winner);
      if (onMatchComplete) {
        onMatchComplete(data.winner.socketId);
      }
    };

    socket.on('match-ended', handleMatchEnded);
    return () => {
      socket.off('match-ended', handleMatchEnded);
    };
  }, [socket, onMatchComplete]);

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
      setLeftWidthPercent(Math.min(Math.max(newPercent, 25), 75));
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

  // Load question: either synchronized questionSlug or random
  useEffect(() => {
    async function loadQuestion() {
      setLoading(true);
      try {
        if (initialQuestionSlug) {
          const detail = await fetchQuestionDetail(initialQuestionSlug);
          setCurrentQuestion(detail);
        } else {
          const questions = await fetchArrayQuestions(20, true);
          if (questions.length > 0) {
            const randomIndex = Math.floor(Math.random() * questions.length);
            const detail = await fetchQuestionDetail(questions[randomIndex].titleSlug);
            setCurrentQuestion(detail);
          }
        }
      } catch (err) {
        console.error('Error loading problem:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestion();
  }, [initialQuestionSlug]);

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
    const matched = snippets.find((s) => {
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

  // Run Test Cases & Submit
  const handleRunTests = async (isSubmit = false) => {
    if (!currentQuestion) return;
    setIsExecuting(true);
    setConsoleOpen(true);
    setConsoleOutput(isSubmit ? 'Submitting code against all judge test cases...\n' : 'Compiling & running sample test cases on Judge0...\n');

    const testCasesToRun =
      currentQuestion.testCases && currentQuestion.testCases.length > 0
        ? currentQuestion.testCases
        : (currentQuestion.exampleTestcases || []).map((input) => ({ input, expectedOutput: '' }));

    try {
      const results = await runAllTestCases(code, selectedLang, testCasesToRun);
      setTestResults(results);

      const allPassed = results.every((r) => r.passed);
      const passedCount = results.filter((r) => r.passed).length;
      setMyProgress({ passed: passedCount, total: results.length });

      // Emit live test progress to opponent
      if (roomId && socket.connected) {
        socket.emit('test-progress', {
          roomId,
          passed: passedCount,
          total: results.length,
        });
      }

      // If submit and all passed -> emit winner solution
      if (isSubmit && allPassed && roomId && socket.connected) {
        socket.emit('submit-solution', {
          roomId,
          allPassed: true,
        });
      }

      let summaryLog = `--- Judge0 Execution Summary ---\n`;
      summaryLog += `Total Test Cases: ${results.length}\n`;
      summaryLog += `Passed: ${passedCount}/${results.length}\n`;
      summaryLog += `Status: ${allPassed ? 'ACCEPTED (ALL PASSED) ✓' : 'WRONG ANSWER ✗'}\n\n`;

      results.forEach((r, idx) => {
        summaryLog += `[Test ${idx + 1}] ${r.passed ? '✓ PASSED' : '✗ FAILED'}\n`;
        summaryLog += `Input:    ${r.input}\n`;
        summaryLog += `Expected: ${r.expectedOutput}\n`;
        summaryLog += `Actual:   ${r.actualOutput || '(No stdout)'}\n`;
        if (r.error) summaryLog += `Error:    ${r.error}\n`;
        if (r.time) summaryLog += `Time:     ${r.time}s | Memory: ${r.memory} KB\n`;
        summaryLog += `-------------------------\n`;
      });

      setConsoleOutput(summaryLog);
    } catch (err: any) {
      setConsoleOutput(`Judge0 Execution Error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const isMeWinner = matchWinner && matchWinner.socketId === socket.id;

  return (
    <div className="w-full flex-grow flex flex-col min-h-0 bg-[#080c10] text-[#e8edf2] overflow-hidden relative font-sans">
      {/* Victory / Defeat Modal */}
      {matchWinner && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#080c10]/95 backdrop-blur-md p-6">
          <div
            className={`w-full max-w-lg p-8 rounded-2xl border-2 text-center shadow-2xl flex flex-col items-center ${
              isMeWinner
                ? 'bg-[#0d1f14] border-[#00ff88] shadow-[0_0_50px_rgba(0,255,136,0.3)]'
                : 'bg-[#1f0d10] border-[#ff4757] shadow-[0_0_50px_rgba(255,71,87,0.3)]'
            }`}
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${
                isMeWinner ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-[#ff4757]/20 text-[#ff4757]'
              }`}
            >
              <Trophy size={42} />
            </div>

            <h2
              className={`text-4xl font-black font-mono tracking-wider uppercase mb-2 ${
                isMeWinner ? 'text-[#00ff88]' : 'text-[#ff4757]'
              }`}
            >
              {isMeWinner ? 'VICTORY!' : 'DEFEAT!'}
            </h2>

            <p className="text-lg text-[#e8edf2] mb-1 font-bold">
              {isMeWinner
                ? 'You solved the challenge first!'
                : `${matchWinner.username} completed all test cases first.`}
            </p>

            <div className="my-6 px-4 py-2 rounded-lg bg-[#080c10]/80 border border-[#1a2535] font-mono text-sm inline-flex items-center gap-2">
              <span className="text-[#6b8299]">Rating Change:</span>
              <span className={isMeWinner ? 'text-[#00ff88] font-bold' : 'text-[#ff4757] font-bold'}>
                {isMeWinner ? '+25 ELO' : '-15 ELO'}
              </span>
            </div>

            <div className="flex items-center gap-4 w-full justify-center">
              {onRematch && (
                <button
                  onClick={onRematch}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm bg-[#00ff88] text-[#080c10] hover:brightness-110 transition-all font-mono shadow-[0_0_15px_rgba(0,255,136,0.3)]"
                >
                  <RotateCcw size={16} /> Rematch
                </button>
              )}
              {onExit && (
                <button
                  onClick={onExit}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm bg-[#1a2535] hover:bg-[#2a384c] text-[#e8edf2] transition-all font-mono border border-[#2a384c]"
                >
                  <LogOut size={16} /> Exit Arena
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cool Workspace Subheader & Battle HUD */}
      <div className="flex flex-wrap items-center justify-between px-6 py-2 bg-[#0c131d] border-b border-[#1a2535] gap-3 z-10">
        {/* Left: Problem info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
            <h2 className="font-bold text-sm text-[#e8edf2] tracking-wide font-mono">
              {currentQuestion
                ? `${currentQuestion.frontendId ? currentQuestion.frontendId + '. ' : ''}${currentQuestion.title}`
                : 'Loading Challenge...'}
            </h2>
            {currentQuestion && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
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

          {!roomId && (
            <button
              onClick={handleShuffleQuestions}
              disabled={loading || isExecuting}
              title="Shuffle Random Problem"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a2535] hover:bg-[#2a384c] text-[#00ff88] text-xs font-mono font-bold rounded border border-[#2a384c] transition-all disabled:opacity-50"
            >
              <Shuffle size={12} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Fetching...' : 'Shuffle'}
            </button>
          )}
        </div>

        {/* Center: Live Match Progress HUD */}
        {opponent && (
          <div className="flex items-center gap-4 bg-[#080c10] px-4 py-1.5 rounded-lg border border-[#1a2535] text-xs font-mono shadow-inner">
            {/* You */}
            <div className="flex items-center gap-2">
              <span className="text-[#00ff88] font-bold">You:</span>
              <span className="text-[#e8edf2]">
                {myProgress ? `${myProgress.passed}/${myProgress.total} Passed` : 'Coding...'}
              </span>
            </div>

            <span className="text-[#2a384c] font-black">⚡</span>

            {/* Opponent */}
            <div className="flex items-center gap-2">
              <span className="text-[#00d4ff] font-bold">{opponent.username}:</span>
              <span className="text-[#e8edf2]">
                {opponentProgress ? `${opponentProgress.passed}/${opponentProgress.total} Passed` : 'Coding...'}
              </span>
            </div>
          </div>
        )}

        {/* Right: Language Selector & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-[#1a2535] border border-[#2a384c] rounded-md font-mono text-xs text-[#00ff88]">
            <Cpu size={13} className="text-[#00ff88]" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-transparent text-[#00ff88] font-bold text-xs focus:outline-none cursor-pointer py-0.5"
            >
              <option value="cpp" className="bg-[#0d1520] text-[#e8edf2]">
                C++ (GCC 11.2)
              </option>
              <option value="python3" className="bg-[#0d1520] text-[#e8edf2]">
                Python (3.11)
              </option>
              <option value="javascript" className="bg-[#0d1520] text-[#e8edf2]">
                JavaScript (Node 18)
              </option>
            </select>
          </div>

          <button
            onClick={() => handleRunTests(false)}
            disabled={isExecuting || loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-mono font-bold text-xs bg-transparent border border-[#00ff88]/50 text-[#00ff88] hover:bg-[#00ff88]/10 transition-all disabled:opacity-50"
          >
            <Play size={13} />
            {isExecuting ? 'Running...' : 'Run Code'}
          </button>

          <button
            onClick={() => handleRunTests(true)}
            disabled={isExecuting || loading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md font-mono font-bold text-xs bg-[#00ff88] text-[#080c10] shadow-[0_0_12px_rgba(0,255,136,0.3)] hover:brightness-110 transition-all disabled:opacity-50"
          >
            <Send size={13} />
            Submit
          </button>
        </div>
      </div>

      {/* Main Workspace Split */}
      <div
        ref={containerRef}
        className={`flex-grow flex flex-row min-h-0 overflow-hidden ${isResizing ? 'select-none' : ''}`}
      >
        {/* Left Pane: Pure Problem Description */}
        <div
          style={{ width: `${leftWidthPercent}%` }}
          className="flex flex-col h-full min-h-0 bg-[#080c10] border-r border-[#1a2535] shrink-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#1a2535] bg-[#0d1520]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#00ff88] font-mono uppercase tracking-wider">
              <FileText size={15} /> Problem Statement
            </div>
            {currentQuestion?.topicTags && (
              <div className="flex gap-1.5 overflow-hidden">
                {currentQuestion.topicTags.map((tag) => (
                  <span key={tag.slug} className="text-[10px] font-mono bg-[#1a2535] text-[#6b8299] px-2 py-0.5 rounded">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description Content */}
          <div className="p-6 overflow-y-auto min-h-0 flex-grow text-sm leading-relaxed">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-[#6b8299] gap-3">
                <RefreshCw size={24} className="animate-spin text-[#00ff88]" />
                <p className="font-mono text-xs">Loading Problem Description...</p>
              </div>
            ) : currentQuestion ? (
              <div className="space-y-4">
                <h1 className="text-xl font-bold text-[#e8edf2] font-mono">
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
            ) : (
              <p className="text-[#6b8299]">Failed to load problem.</p>
            )}
          </div>
        </div>

        {/* Draggable Resizer Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-1.5 hover:w-1.5 bg-[#0d1520] hover:bg-[#00ff88]/50 cursor-col-resize flex items-center justify-center transition-colors shrink-0 select-none ${
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

        {/* Right Pane: Code Editor + Bottom Execution Drawer */}
        <div
          style={{ width: `${100 - leftWidthPercent}%` }}
          className="flex flex-col h-full min-h-0 bg-[#05080c] shrink-0 min-w-0 relative"
        >
          {/* Editor Header */}
          <div className="px-4 py-2 bg-[#0d1520] border-b border-[#1a2535] flex items-center justify-between text-xs font-mono text-[#6b8299]">
            <span className="text-[#e8edf2] font-bold">EDITOR ({selectedLang.toUpperCase()})</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConsoleOpen(!consoleOpen)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#1a2535] text-[#00ff88] hover:bg-[#2a384c] transition-all"
              >
                <Terminal size={12} />
                <span>Console</span>
                {consoleOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-grow min-h-0">
            <Editor
              height="100%"
              language={LANGUAGE_MAP[selectedLang as keyof typeof LANGUAGE_MAP]?.monaco || 'javascript'}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* Bottom Execution Console Drawer */}
          {consoleOpen && (
            <div className="h-56 border-t border-[#1a2535] bg-[#0a0f16] flex flex-col shrink-0 font-mono text-xs">
              <div className="px-4 py-2 bg-[#0d1520] border-b border-[#1a2535] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[#00ff88] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal size={13} /> Judge0 Execution Console
                  </span>
                  {testResults.length > 0 && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                        testResults.every((t) => t.passed)
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {testResults.filter((t) => t.passed).length}/{testResults.length} Cases Passed
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setConsoleOpen(false)}
                  className="text-[#6b8299] hover:text-[#e8edf2] transition-colors"
                >
                  <ChevronDown size={15} />
                </button>
              </div>

              <div className="flex-grow p-4 overflow-y-auto space-y-3">
                {isExecuting ? (
                  <div className="flex items-center gap-2 text-[#00ff88]">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Executing code on Judge0 CE environment...</span>
                  </div>
                ) : (
                  <>
                    {testResults.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {testResults.map((tr) => (
                          <div
                            key={tr.testCaseIndex}
                            className={`p-2 rounded border flex items-center justify-between text-[11px] ${
                              tr.passed
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                                : 'bg-rose-950/20 border-rose-500/30 text-rose-400'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold">
                              {tr.passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                              <span>Case #{tr.testCaseIndex}</span>
                            </div>
                            <span>{tr.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <pre className="p-3 bg-[#080c10] border border-[#1a2535] rounded text-gray-300 text-xs overflow-x-auto whitespace-pre-wrap">
                      {consoleOutput || 'Run code or Submit to view execution logs...'}
                    </pre>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
