"""
AI Code Review — Sends PR diff to Azure OpenAI and posts review as a PR comment.
Runs inside a Docker container as part of the PR review GitHub Action.
"""

import json
import os
import sys
import urllib.request

# ── Config from environment ──────────────────────────────────────────
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
GITHUB_REPOSITORY = os.environ["GITHUB_REPOSITORY"]
PR_NUMBER = os.environ["PR_NUMBER"]

AZURE_ENDPOINT = os.environ["AZURE_OPENAI_ENDPOINT"].rstrip("/")
AZURE_API_KEY = os.environ["AZURE_OPENAI_API_KEY"]
AZURE_DEPLOYMENT = os.environ["AZURE_OPENAI_DEPLOYMENT_NAME"]
AZURE_API_VERSION = os.environ["AZURE_OPENAI_API_VERSION"]

MAX_DIFF_CHARS = 12000  # Truncate large diffs to stay within token limits


def github_api(path, method="GET", data=None):
    """Call GitHub REST API."""
    url = f"https://api.github.com{path}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }
    body = None
    if data:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode()

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def get_pr_diff():
    """Fetch the PR diff from GitHub."""
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/pulls/{PR_NUMBER}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3.diff",
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode()


def call_azure_openai(prompt, diff):
    """Send the review prompt + diff to Azure OpenAI."""
    url = (
        f"{AZURE_ENDPOINT}/openai/deployments/{AZURE_DEPLOYMENT}"
        f"/chat/completions?api-version={AZURE_API_VERSION}"
    )
    payload = {
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"Here is the PR diff to review:\n\n```diff\n{diff}\n```"},
        ],
        "temperature": 0.3,
        "max_tokens": 2000,
    }
    headers = {
        "Content-Type": "application/json",
        "api-key": AZURE_API_KEY,
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read().decode())

    return result["choices"][0]["message"]["content"]


def post_pr_comment(body):
    """Post a comment on the PR."""
    github_api(
        f"/repos/{GITHUB_REPOSITORY}/issues/{PR_NUMBER}/comments",
        method="POST",
        data={"body": body},
    )


REVIEW_PROMPT = """\
You are a senior software engineer performing a code review on a GitHub Pull Request.

Review the provided diff and give actionable feedback. Focus on:

1. **Bugs & Logic Errors** — Incorrect logic, off-by-one errors, null/undefined issues, race conditions
2. **Security** — Hardcoded secrets, injection risks, improper input validation, insecure defaults
3. **Performance** — Unnecessary loops, missing indexes, N+1 queries, large memory allocations
4. **Best Practices** — Naming conventions, code duplication, missing error handling, proper typing
5. **Readability** — Confusing variable names, overly complex expressions, missing context

Rules:
- Only comment on the CHANGED lines (lines starting with + or -)
- Be specific — reference file names and line numbers from the diff
- If the code looks good, say so briefly — don't invent issues
- Keep feedback concise and actionable
- Use markdown formatting for readability
- Rate the overall PR: Approved / Minor Changes / Changes Requested

Format your response as:
## AI Code Review

### Overall: [Approved / Minor Changes / Changes Requested]

### Findings
(list findings here, or "No issues found - code looks good!")

---
*Automated review by Azure OpenAI*
"""


def main():
    print(f"Fetching diff for PR #{PR_NUMBER}...")
    diff = get_pr_diff()

    if not diff.strip():
        print("No diff found — skipping review.")
        return

    # Truncate if too large
    if len(diff) > MAX_DIFF_CHARS:
        diff = diff[:MAX_DIFF_CHARS] + "\n\n... (diff truncated due to size)"
        print(f"Diff truncated to {MAX_DIFF_CHARS} chars")

    print(f"Diff size: {len(diff)} chars. Sending to Azure OpenAI...")
    review = call_azure_openai(REVIEW_PROMPT, diff)
    print("Review received. Posting to PR...")
    print(review)

    post_pr_comment(review)
    print(f"Review posted to PR #{PR_NUMBER}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"AI review failed: {e}", file=sys.stderr)
        # Don't fail the workflow — review is advisory
        sys.exit(0)
