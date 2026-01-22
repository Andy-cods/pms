# CLAUDE.md

File này cung cấp hướng dẫn cho Claude Code khi làm việc với project này.

## Thông tin Project

- **Tên:** PMS - Hệ thống Quản lý Dự án
- **Mục đích:** Quản lý dự án, tasks, team members và tiến độ công việc

## Workflows

- Primary workflow: `./.claude/workflows/primary-workflow.md`
- Development rules: `./.claude/workflows/development-rules.md`

**QUAN TRỌNG:** Luôn đọc file `./README.md` trước khi thực hiện bất kỳ task nào.

## Cấu trúc Project

```
├── src/                    # Source code chính
├── docs/                   # Tài liệu dự án
├── plans/                  # Kế hoạch triển khai
├── tests/                  # Unit tests & integration tests
├── .claude/                # Cấu hình Claude Code
└── CLAUDE.md              # File này
```

## Tech Stack (đề xuất)

- **Frontend:** React/Next.js + TypeScript
- **Backend:** Node.js/Express hoặc NestJS
- **Database:** PostgreSQL/MongoDB
- **Auth:** JWT/OAuth2

## Commands thường dùng

```bash
/plan "mô tả feature"      # Lập kế hoạch
/cook "implement feature"  # Triển khai code
/debug "mô tả lỗi"         # Debug
/test                      # Chạy tests
/review                    # Code review
```

## Quy tắc phát triển

1. Viết code clean, có comment khi cần
2. Luôn viết tests cho features mới
3. Follow conventional commits
4. Review code trước khi merge
