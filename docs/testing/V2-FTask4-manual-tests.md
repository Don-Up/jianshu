# Task 4: Comments System — Manual Test Cases

## Prerequisite
- Backend running at `http://localhost:4000`
- Frontend running at `http://localhost:3000`
- Two test accounts: `author@test.com` (author of the article) and `reader@test.com` (regular user)

---

## TC-1: View Comments (Unauthenticated)

**Steps:**
1. Open an article page that has existing comments
2. Scroll to the comment section

**Expected:**
- Comment list displays with author avatar, name, content, and timestamp
- "暂无评论，快来发表第一条评论吧" shows if no comments exist
- "加载更多" button appears if there are more than 10 comments
- No delete button is visible on any comment

**Expected (Loading):**
- When comments are loading, "加载中..." text appears in the load more button

---

## TC-2: View Comments (Authenticated Non-Owner)

**Steps:**
1. Login as `reader@test.com`
2. Navigate to an article with existing comments
3. Scroll to the comment section

**Expected:**
- Comment form is visible with textarea and "发布评论" button
- Comment list displays correctly
- "删除" button does NOT appear on any comment (reader is not the author)

---

## TC-3: View Comments (Authenticated Owner)

**Steps:**
1. Login as `author@test.com` (author of the article)
2. Navigate to the same article
3. Scroll to the comment section

**Expected:**
- Comment form is visible
- "删除" button appears on comments written by `author@test.com`
- "删除" button does NOT appear on comments written by other users

---

## TC-4: Submit Comment (Success)

**Steps:**
1. Login as `reader@test.com`
2. Navigate to an article
3. In the comment form, type: `这是一条测试评论内容`
4. Click "发布评论"

**Expected:**
- Button shows "发布中..." during submission
- After success, textarea is cleared
- New comment appears at the TOP of the comment list (reverse chronological order)
- The comment shows your avatar, name, and current timestamp

---

## TC-5: Submit Comment (Empty Content)

**Steps:**
1. Login as `reader@test.com`
2. Navigate to an article with existing comments
3. Leave the comment textarea empty
4. Try to click "发布评论"

**Expected:**
- Button is disabled and cannot be clicked
- No API call is made

---

## TC-6: Submit Comment (Whitespace Only)

**Steps:**
1. Login as `reader@test.com`
2. Type only spaces "   " in the comment textarea

**Expected:**
- "发布评论" button remains disabled

---

## TC-7: Submit Comment (Not Authenticated)

**Steps:**
1. Stay logged out (or clear localStorage/cookies)
2. Navigate to an article page

**Expected:**
- Comment form area shows: `请 登录 后发表评论` (with "登录" as a clickable link)
- Textarea is NOT visible

---

## TC-8: Delete Comment (Own Comment - Confirm)

**Steps:**
1. Login as `reader@test.com`
2. Post a new comment
3. Verify the comment appears with a "删除" button
4. Click "删除" button
5. In the confirmation dialog, click "确定"

**Expected:**
- Comment is immediately removed from the list (optimistic update)
- API call: `DELETE /api/articles/:id/comments/:commentId`
- No error toast appears (if your app has one)

---

## TC-9: Delete Comment (Own Comment - Cancel)

**Steps:**
1. Login as `reader@test.com`
2. Navigate to an article where you have a comment
3. Click "删除" button
4. In the confirmation dialog, click "取消"

**Expected:**
- Comment remains in the list
- No API call is made

---

## TC-10: Delete Comment (Not Owner - Button Hidden)

**Steps:**
1. Login as `reader@test.com`
2. Navigate to an article with comments from other users

**Expected:**
- No "删除" button is visible on any comment

---

## TC-11: Pagination - Load More

**Steps:**
1. Navigate to an article that has more than 10 comments
2. Verify only the first page (up to 10) is displayed
3. Click "加载更多" button

**Expected:**
- New comments are appended to the bottom of the list
- First page comments remain at the top
- "加载更多" button may disappear if all pages are loaded

---

## TC-12: Pagination - No More Pages

**Steps:**
1. Load comments, scroll to bottom
2. If "加载更多" button exists, keep clicking until it disappears

**Expected:**
- After reaching the last page, "加载更多" button is no longer visible

---

## TC-13: Error Handling - Create Comment Failure

**Steps:**
1. Login as `reader@test.com`
2. Type a comment
3. Submit the comment
4. Simulate network failure (disconnect network or use DevTools to block the request)

**Expected:**
- Error message appears (check if there's an error display)
- Comment is NOT added to the list (no optimistic update on create)
- Textarea retains the content for retry

---

## TC-14: Error Handling - Delete Comment Failure

**Steps:**
1. Login as `reader@test.com`
2. Post a new comment
3. Click "删除" and confirm
4. Before the delete API returns, simulate network failure

**Expected:**
- Comment disappears from the list immediately (optimistic update)
- If there's no rollback mechanism, the comment remains deleted even on failure (known limitation - no toast shown)
- If you refresh the page, the comment reappears (proving it wasn't actually deleted)

---

## TC-15: Switching Article - Comments Reset

**Steps:**
1. Login as `reader@test.com`
2. Navigate to article A and observe its comments
3. Navigate to article B

**Expected:**
- Comment list updates to show article B's comments
- Old comments from article A are not visible
- Comment form is still functional

---

## TC-16: Submit Rapidly - Prevent Double Submit

**Steps:**
1. Login as `reader@test.com`
2. Type a comment
3. Click "发布评论"
4. Immediately try to click again before the first submission completes

**Expected:**
- "发布中..." is shown and the button is disabled
- Only one comment is created (no duplicates)

---

## TC-17: Long Comment Content

**Steps:**
1. Login as `reader@test.com`
2. Type a very long comment (接近 2000 characters)
3. Submit

**Expected:**
- Comment is posted successfully
- Full content is displayed without truncation (assuming backend allows 2000 chars)

---

## TC-18: Special Characters in Comment

**Steps:**
1. Login as `reader@test.com`
2. Type: `测试 <script>alert('xss')</script> 还有 "双引号" 和 '单引号' 和 & 符号`
3. Submit

**Expected:**
- Comment displays correctly without executing the script
- Special characters are properly escaped or preserved

---

## Test Coverage Summary

| Test Case | Feature | User State |
|-----------|---------|------------|
| TC-1 | View comments | Unauthenticated |
| TC-2 | View + non-owner | Authenticated non-owner |
| TC-3 | View + owner | Authenticated owner |
| TC-4 | Create comment (success) | Authenticated |
| TC-5 | Create (empty) | Authenticated |
| TC-6 | Create (whitespace) | Authenticated |
| TC-7 | Auth gate | Not authenticated |
| TC-8 | Delete (confirm) | Owner |
| TC-9 | Delete (cancel) | Owner |
| TC-10 | Delete hidden | Non-owner |
| TC-11 | Pagination - load more | Any |
| TC-12 | Pagination - end | Any |
| TC-13 | Error - create failure | Authenticated |
| TC-14 | Error - delete failure | Owner |
| TC-15 | Switch article | Authenticated |
| TC-16 | Double submit prevention | Authenticated |
| TC-17 | Long content | Authenticated |
| TC-18 | XSS/special chars | Authenticated |

**Priority:**
- P0 (Must Test): TC-1, TC-3, TC-4, TC-8, TC-11
- P1 (Should Test): TC-2, TC-5, TC-7, TC-9, TC-12, TC-16
- P2 (Nice to Test): TC-6, TC-10, TC-13, TC-14, TC-15, TC-17, TC-18