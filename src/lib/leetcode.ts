import type { ArrayQuestion } from './types';
import { CURATED_ARRAY_QUESTIONS } from './arrayProblemBank';
import { API_BASE_URL } from './config';

const BACKEND_URL = `${API_BASE_URL}/questions`;
const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

/**
 * Fetch list of Array DSA questions from backend proxy (which queries LeetCode GraphQL with random skip offset)
 */
export async function fetchArrayQuestions(limit: number = 20, random: boolean = true): Promise<ArrayQuestion[]> {
  // 1. Try backend server first (bypasses browser CORS and supports random skip)
  try {
    const backendRes = await fetch(`${BACKEND_URL}/array?limit=${limit}&random=${random}`);
    if (backendRes.ok) {
      const json = await backendRes.json();
      if (json.success && json.questions && json.questions.length > 0) {
        return json.questions.map((q: any) => ({
          id: q.questionFrontendId || q.id,
          frontendId: q.questionFrontendId || q.id,
          title: q.title,
          titleSlug: q.titleSlug,
          difficulty: q.difficulty,
          topicTags: q.topicTags || [{ name: 'Array', slug: 'array' }]
        }));
      }
    }
  } catch (_e) {
    console.warn('Backend questions server not available, attempting direct browser fetch...');
  }

  // 2. Direct browser fetch fallback
  try {
    const randomSkip = random ? Math.floor(Math.random() * 50) : 0;
    const query = `
      query getArrayQuestions($limit: Int!, $skip: Int!) {
        problemsetQuestionList: questionList(
          categorySlug: ""
          limit: $limit
          skip: $skip
          filters: { tags: ["array"] }
        ) {
          total: totalNum
          questions: data {
            questionFrontendId
            title
            titleSlug
            difficulty
            topicTags {
              name
              slug
            }
          }
        }
      }
    `;

    const response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { limit, skip: randomSkip }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const fetchedQuestions = data?.data?.problemsetQuestionList?.questions || [];
      if (fetchedQuestions.length > 0) {
        return fetchedQuestions.map((q: any) => ({
          id: q.questionFrontendId,
          frontendId: q.questionFrontendId,
          title: q.title,
          titleSlug: q.titleSlug,
          difficulty: q.difficulty,
          topicTags: q.topicTags || [{ name: 'Array', slug: 'array' }]
        }));
      }
    }
  } catch (error) {
    console.warn('Failed direct fetch from LeetCode GraphQL, using curated Array bank:', error);
  }

  // 3. Ultimate Fallback: Local Curated Bank
  return CURATED_ARRAY_QUESTIONS;
}

/**
 * Fetch detailed problem statement, code snippets, and test cases for a specific Array question slug
 */
export async function fetchQuestionDetail(titleSlug: string): Promise<ArrayQuestion> {
  const curatedMatch = CURATED_ARRAY_QUESTIONS.find(q => q.titleSlug === titleSlug);

  // 1. Try Backend Proxy Server first
  try {
    const backendRes = await fetch(`${BACKEND_URL}/detail/${titleSlug}`);
    if (backendRes.ok) {
      const json = await backendRes.json();
      if (json.success && json.question) {
        const q = json.question;
        const exampleList: string[] = q.exampleTestcaseList || [];
        const testCases = curatedMatch?.testCases || exampleList.map((testStr: string) => ({
          input: testStr,
          expectedOutput: ''
        }));

        return {
          id: q.questionId || q.questionFrontendId,
          frontendId: q.questionFrontendId,
          title: q.title,
          titleSlug: q.titleSlug,
          difficulty: q.difficulty,
          topicTags: q.topicTags || [{ name: 'Array', slug: 'array' }],
          content: q.content,
          codeSnippets: q.codeSnippets || (curatedMatch ? curatedMatch.codeSnippets : []),
          exampleTestcases: exampleList,
          testCases
        };
      }
    }
  } catch (_e) {
    console.warn('Backend detail server unavailable, falling back...');
  }

  // 2. Direct browser fetch fallback
  try {
    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          questionFrontendId
          title
          titleSlug
          content
          difficulty
          topicTags {
            name
            slug
          }
          codeSnippets {
            lang
            langSlug
            code
          }
          exampleTestcaseList
        }
      }
    `;

    const response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { titleSlug }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const q = data?.data?.question;
      if (q) {
        const exampleList: string[] = q.exampleTestcaseList || [];
        const testCases = curatedMatch?.testCases || exampleList.map((testStr: string) => ({
          input: testStr,
          expectedOutput: ''
        }));

        return {
          id: q.questionId || q.questionFrontendId,
          frontendId: q.questionFrontendId,
          title: q.title,
          titleSlug: q.titleSlug,
          difficulty: q.difficulty,
          topicTags: q.topicTags || [{ name: 'Array', slug: 'array' }],
          content: q.content,
          codeSnippets: q.codeSnippets || (curatedMatch ? curatedMatch.codeSnippets : []),
          exampleTestcases: exampleList,
          testCases
        };
      }
    }
  } catch (error) {
    console.warn(`Failed direct fetch detail for ${titleSlug}:`, error);
  }

  // 3. Fallback to curated match or first curated question
  if (curatedMatch) return curatedMatch;
  return CURATED_ARRAY_QUESTIONS[0];
}
