export interface TopicTag {
  name: string;
  slug: string;
}

export interface CodeSnippet {
  lang: string;
  langSlug: string;
  code: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface ArrayQuestion {
  id: string;
  frontendId: string;
  title: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topicTags: TopicTag[];
  content?: string; // HTML description
  codeSnippets?: CodeSnippet[];
  exampleTestcases?: string[];
  testCases?: TestCase[];
}

export interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
}

export interface Judge0Status {
  id: number;
  description: string;
}

export interface Judge0Result {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time: string | null;
  memory: number | null;
  status: Judge0Status;
  token?: string;
}

export interface TestResultItem {
  testCaseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
  status: string;
  time?: string;
  memory?: number;
}
