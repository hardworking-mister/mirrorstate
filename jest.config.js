// jest.config.js
export default {
    preset: 'ts-jest', // 使用 ts-jest 预处理 TypeScript 文件
    testEnvironment: 'node', // 如果你的代码运行在 Node.js 环境
    // testEnvironment: 'jsdom', // 如果你的代码涉及 DOM 操作，可以改为 'jsdom'
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    // 告诉 Jest 去哪里找测试文件
    testMatch: ['**/test/**/*.test.ts', '**/test/**/*.spec.ts', "**/test/*.test.ts"],

    transformIgnorePatterns: [
        '/node_modules/'
    ],
    // 报告收集
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.{js,ts}',
        '!src/types/**/*',
    ],
    coverageDirectory: "coverage",

    coverageReporters: [
        'html',          // HTML 报告（方便浏览器查看）
        'lcov',          // lcov 格式（用于 CI 集成）
        'text',          // 控制台文本输出
    ],

    reporters: [
        'default',  // 默认的控制台报告器
    ],

};
//# sourceMappingURL=jest.config.js.map
