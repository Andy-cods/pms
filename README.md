# PMS - Hệ thống Quản lý Dự án

Hệ thống quản lý dự án toàn diện giúp theo dõi tasks, team members và tiến độ công việc.

## Tính năng chính

- Quản lý dự án (CRUD projects)
- Quản lý tasks/công việc
- Quản lý thành viên team
- Theo dõi tiến độ (Kanban board, Gantt chart)
- Báo cáo và thống kê
- Thông báo và nhắc nhở

## Cài đặt

```bash
# Clone project
git clone <repo-url>
cd Pms-quan-li-du-an

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

## Cấu trúc thư mục

```
├── src/                    # Source code
│   ├── components/         # UI components
│   ├── pages/              # Pages/Routes
│   ├── services/           # Business logic
│   ├── utils/              # Utilities
│   └── types/              # TypeScript types
├── docs/                   # Documentation
├── plans/                  # Implementation plans
├── tests/                  # Tests
└── .claude/                # Claude Code config
```

## Phát triển với Claude Code

Project này được tích hợp ClaudeKit Engineer. Sử dụng các commands:

```bash
claude                      # Mở Claude Code
/plan "feature mới"         # Lập kế hoạch
/cook "implement"           # Triển khai
/test                       # Chạy tests
```

## License

MIT
