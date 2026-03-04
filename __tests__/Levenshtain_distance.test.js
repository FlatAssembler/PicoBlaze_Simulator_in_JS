const tree = require("../TreeNode.js");
global.LevenshtainDistance = tree.LevenshtainDistance;
global.longest_common_subsequence = tree.longest_common_subsequence;

describe("Evaluation of Levenshtain Distance", () => {
  test("Two empty strings", () => {
    expect(LevenshtainDistance("", "")).toEqual(0);
  });
  test("Empty string and a non-emtpy string", () => {
    expect(LevenshtainDistance("", "ABC")).toEqual(3);
  });
  test('The "kitten"-"sitting" test', () => {
    // https://en.wikipedia.org/wiki/Levenshtein_distance#Example
    expect(LevenshtainDistance("kitten", "sitting")).toEqual(3);
  });
  test("Testing the longest common subsequence", () => {
    // https://en.wikipedia.org/wiki/Longest_common_subsequence
    expect(longest_common_subsequence("ABCD", "ACBAD")).toEqual(3);
  });
  test("Testing the longest common subsequence 2", () => {
    //  https://www.geeksforgeeks.org/dsa/longest-common-subsequence-dp-4/
    expect(longest_common_subsequence("AGGTAB", "GXTXAYB")).toEqual(4);
  });
});
