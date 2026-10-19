import express from 'express';

const router = express.Router();

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

const CURATED_ARRAY_QUESTIONS = [
  {
    id: '1',
    frontendId: '1',
    title: 'Two Sum',
    titleSlug: 'two-sum',
    difficulty: 'Easy',
    topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Hash Table', slug: 'hash-table' }]
  },
  {
    id: '121',
    frontendId: '121',
    title: 'Best Time to Buy and Sell Stock',
    titleSlug: 'best-time-to-buy-and-sell-stock',
    difficulty: 'Easy',
    topicTags: [{ name: 'Array', slug: 'array' }]
  },
  {
    id: '217',
    frontendId: '217',
    title: 'Contains Duplicate',
    titleSlug: 'contains-duplicate',
    difficulty: 'Easy',
    topicTags: [{ name: 'Array', slug: 'array' }]
  },
  {
    id: '53',
    frontendId: '53',
    title: 'Maximum Subarray',
    titleSlug: 'maximum-subarray',
    difficulty: 'Medium',
    topicTags: [{ name: 'Array', slug: 'array' }]
  },
  {
    id: '283',
    frontendId: '283',
    title: 'Move Zeroes',
    titleSlug: 'move-zeroes',
    difficulty: 'Easy',
    topicTags: [{ name: 'Array', slug: 'array' }]
  }
];

// GET /api/questions/array
router.get('/array', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const isRandom = req.query.random === 'true';
    const skip = isRandom
      ? Math.floor(Math.random() * 60)
      : parseInt(req.query.skip) || 0;

    const response = await fetch(LEETCODE_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
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
                topicTags { name slug }
              }
            }
          }
        `,
        variables: { limit, skip }
      })
    });

    const data = await response.json();
    const fetched = data?.data?.problemsetQuestionList?.questions || [];
    const questions = fetched.length > 0 ? fetched : CURATED_ARRAY_QUESTIONS;
    res.json({ success: true, count: questions.length, questions });
  } catch (error) {
    console.warn('Backend LeetCode fetch failed, serving curated list:', error.message);
    res.json({ success: true, count: CURATED_ARRAY_QUESTIONS.length, questions: CURATED_ARRAY_QUESTIONS });
  }
});

// GET /api/questions/detail/:slug
router.get('/detail/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const response = await fetch(LEETCODE_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              questionId
              questionFrontendId
              title
              titleSlug
              content
              difficulty
              topicTags { name slug }
              codeSnippets { lang langSlug code }
              exampleTestcaseList
            }
          }
        `,
        variables: { titleSlug: slug }
      })
    });

    const data = await response.json();
    if (data?.data?.question) {
      return res.json({ success: true, question: data.data.question });
    }
    res.status(404).json({ success: false, message: 'Question not found' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const JUDGE0_URL = process.env.JUDGE0_URL || 'https://ce.judge0.com';

// POST /api/questions/judge0/execute
router.post('/judge0/execute', async (req, res) => {
  const { source_code, language_id, stdin, expected_output } = req.body;
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.RAPIDAPI_KEY) {
      headers['X-RapidAPI-Key'] = process.env.RAPIDAPI_KEY;
      headers['X-RapidAPI-Host'] = process.env.RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com';
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`${JUDGE0_URL}/submissions?wait=true`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        source_code,
        language_id,
        stdin,
        expected_output: expected_output || undefined
      })
    });
    clearTimeout(timeout);

    const data = await response.json();
    res.json({ success: true, result: data });
  } catch (error) {
    console.error('Judge0 proxy error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
