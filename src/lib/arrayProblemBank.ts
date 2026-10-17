import type { ArrayQuestion } from './types';

export const CURATED_ARRAY_QUESTIONS: ArrayQuestion[] = [
  {
    id: '1',
    frontendId: '1',
    title: 'Two Sum',
    titleSlug: 'two-sum',
    difficulty: 'Easy',
    topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Hash Table', slug: 'hash-table' }],
    content: `
      <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.</p>
      <p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>
      <p>You can return the answer in any order.</p>
      <br/>
      <p><strong>Example 1:</strong></p>
      <pre><strong>Input:</strong> nums = [2,7,11,15], target = 9
<strong>Output:</strong> [0,1]
<strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].</pre>
      <p><strong>Example 2:</strong></p>
      <pre><strong>Input:</strong> nums = [3,2,4], target = 6
<strong>Output:</strong> [1,2]</pre>
      <p><strong>Example 3:</strong></p>
      <pre><strong>Input:</strong> nums = [3,3], target = 6
<strong>Output:</strong> [0,1]</pre>
      <br/>
      <p><strong>Constraints:</strong></p>
      <ul>
        <li><code>2 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
        <li><code>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></code></li>
        <li><code>-10<sup>9</sup> &lt;= target &lt;= 10<sup>9</sup></code></li>
        <li>Only one valid answer exists.</li>
      </ul>
    `,
    codeSnippets: [
      {
        lang: 'JavaScript',
        langSlug: 'javascript',
        code: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Write your solution here
    
};`
      },
      {
        lang: 'Python3',
        langSlug: 'python3',
        code: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Write your solution here
        pass`
      },
      {
        lang: 'C++',
        langSlug: 'cpp',
        code: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};`
      },
      {
        lang: 'Java',
        langSlug: 'java',
        code: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`
      }
    ],
    testCases: [
      { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' },
      { input: '[3,2,4]\n6', expectedOutput: '[1,2]' },
      { input: '[3,3]\n6', expectedOutput: '[0,1]' }
    ]
  },
  {
    id: '121',
    frontendId: '121',
    title: 'Best Time to Buy and Sell Stock',
    titleSlug: 'best-time-to-buy-and-sell-stock',
    difficulty: 'Easy',
    topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }],
    content: `
      <p>You are given an array <code>prices</code> where <code>prices[i]</code> is the price of a given stock on the <code>i<sup>th</sup></code> day.</p>
      <p>You want to maximize your profit by choosing a <strong>single day</strong> to buy one stock and choosing a <strong>different day in the future</strong> to sell that stock.</p>
      <p>Return <em>the maximum profit you can achieve from this transaction</em>. If you cannot achieve any profit, return <code>0</code>.</p>
      <br/>
      <p><strong>Example 1:</strong></p>
      <pre><strong>Input:</strong> prices = [7,1,5,3,6,4]
<strong>Output:</strong> 5
<strong>Explanation:</strong> Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.</pre>
      <p><strong>Example 2:</strong></p>
      <pre><strong>Input:</strong> prices = [7,6,4,3,1]
<strong>Output:</strong> 0
<strong>Explanation:</strong> In this case, no transactions are done and max profit = 0.</pre>
    `,
    codeSnippets: [
      {
        lang: 'JavaScript',
        langSlug: 'javascript',
        code: `/**
 * @param {number[]} prices
 * @return {number}
 */
var maxProfit = function(prices) {
    // Write your solution here
    
};`
      },
      {
        lang: 'Python3',
        langSlug: 'python3',
        code: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        # Write your solution here
        pass`
      },
      {
        lang: 'C++',
        langSlug: 'cpp',
        code: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // Write your solution here
        return 0;
    }
};`
      },
      {
        lang: 'Java',
        langSlug: 'java',
        code: `class Solution {
    public int maxProfit(int[] prices) {
        // Write your solution here
        return 0;
    }
}`
      }
    ],
    testCases: [
      { input: '[7,1,5,3,6,4]', expectedOutput: '5' },
      { input: '[7,6,4,3,1]', expectedOutput: '0' }
    ]
  },
  {
    id: '217',
    frontendId: '217',
    title: 'Contains Duplicate',
    titleSlug: 'contains-duplicate',
    difficulty: 'Easy',
    topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Hash Table', slug: 'hash-table' }],
    content: `
      <p>Given an integer array <code>nums</code>, return <code>true</code> if any value appears <strong>at least twice</strong> in the array, and return <code>false</code> if every element is distinct.</p>
      <br/>
      <p><strong>Example 1:</strong></p>
      <pre><strong>Input:</strong> nums = [1,2,3,1]
<strong>Output:</strong> true</pre>
      <p><strong>Example 2:</strong></p>
      <pre><strong>Input:</strong> nums = [1,2,3,4]
<strong>Output:</strong> false</pre>
      <p><strong>Example 3:</strong></p>
      <pre><strong>Input:</strong> nums = [1,1,1,3,3,4,3,2,4,2]
<strong>Output:</strong> true</pre>
    `,
    codeSnippets: [
      {
        lang: 'JavaScript',
        langSlug: 'javascript',
        code: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var containsDuplicate = function(nums) {
    // Write your solution here
    
};`
      },
      {
        lang: 'Python3',
        langSlug: 'python3',
        code: `class Solution:
    def containsDuplicate(self, nums: list[int]) -> bool:
        # Write your solution here
        pass`
      },
      {
        lang: 'C++',
        langSlug: 'cpp',
        code: `#include <vector>
#include <unordered_set>
using namespace std;

class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        // Write your solution here
        return false;
    }
};`
      },
      {
        lang: 'Java',
        langSlug: 'java',
        code: `import java.util.HashSet;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        // Write your solution here
        return false;
    }
}`
      }
    ],
    testCases: [
      { input: '[1,2,3,1]', expectedOutput: 'true' },
      { input: '[1,2,3,4]', expectedOutput: 'false' },
      { input: '[1,1,1,3,3,4,3,2,4,2]', expectedOutput: 'true' }
    ]
  },
  {
    id: '53',
    frontendId: '53',
    title: 'Maximum Subarray',
    titleSlug: 'maximum-subarray',
    difficulty: 'Medium',
    topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Divide and Conquer', slug: 'divide-and-conquer' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }],
    content: `
      <p>Given an integer array <code>nums</code>, find the subarray with the largest sum, and return <em>its sum</em>.</p>
      <br/>
      <p><strong>Example 1:</strong></p>
      <pre><strong>Input:</strong> nums = [-2,1,-3,4,-1,2,1,-5,4]
<strong>Output:</strong> 6
<strong>Explanation:</strong> The subarray [4,-1,2,1] has the largest sum 6.</pre>
      <p><strong>Example 2:</strong></p>
      <pre><strong>Input:</strong> nums = [1]
<strong>Output:</strong> 1</pre>
      <p><strong>Example 3:</strong></p>
      <pre><strong>Input:</strong> nums = [5,4,-1,7,8]
<strong>Output:</strong> 23</pre>
    `,
    codeSnippets: [
      {
        lang: 'JavaScript',
        langSlug: 'javascript',
        code: `/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
    // Write your solution here
    
};`
      },
      {
        lang: 'Python3',
        langSlug: 'python3',
        code: `class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        # Write your solution here
        pass`
      },
      {
        lang: 'C++',
        langSlug: 'cpp',
        code: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Write your solution here
        return 0;
    }
};`
      },
      {
        lang: 'Java',
        langSlug: 'java',
        code: `class Solution {
    public int maxSubArray(int[] nums) {
        // Write your solution here
        return 0;
    }
}`
      }
    ],
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
      { input: '[1]', expectedOutput: '1' },
      { input: '[5,4,-1,7,8]', expectedOutput: '23' }
    ]
  },
  {
    id: '283',
    frontendId: '283',
    title: 'Move Zeroes',
    titleSlug: 'move-zeroes',
    difficulty: 'Easy',
    topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Two Pointers', slug: 'two-pointers' }],
    content: `
      <p>Given an integer array <code>nums</code>, move all <code>0</code>'s to the end of it while maintaining the relative order of the non-zero elements.</p>
      <p><strong>Note</strong> that you must do this in-place without making a copy of the array.</p>
      <br/>
      <p><strong>Example 1:</strong></p>
      <pre><strong>Input:</strong> nums = [0,1,0,3,12]
<strong>Output:</strong> [1,3,12,0,0]</pre>
      <p><strong>Example 2:</strong></p>
      <pre><strong>Input:</strong> nums = [0]
<strong>Output:</strong> [0]</pre>
    `,
    codeSnippets: [
      {
        lang: 'JavaScript',
        langSlug: 'javascript',
        code: `/**
 * @param {number[]} nums
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var moveZeroes = function(nums) {
    // Write your solution here
    
};`
      },
      {
        lang: 'Python3',
        langSlug: 'python3',
        code: `class Solution:
    def moveZeroes(self, nums: list[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        pass`
      },
      {
        lang: 'C++',
        langSlug: 'cpp',
        code: `#include <vector>
using namespace std;

class Solution {
public:
    void moveZeroes(vector<int>& nums) {
        // Write your solution here
    }
};`
      },
      {
        lang: 'Java',
        langSlug: 'java',
        code: `class Solution {
    public void moveZeroes(int[] nums) {
        // Write your solution here
    }
}`
      }
    ],
    testCases: [
      { input: '[0,1,0,3,12]', expectedOutput: '[1,3,12,0,0]' },
      { input: '[0]', expectedOutput: '[0]' }
    ]
  }
];
