// jest.config.js
export default {
    preset: 'ts-jest', // 使用 ts-jest 预处理 TypeScript 文件
    testEnvironment: 'node', // 如果你的代码运行在 Node.js 环境
    // testEnvironment: 'jsdom', // 如果你的代码涉及 DOM 操作，可以改为 'jsdom'
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    // 告诉 Jest 去哪里找测试文件
    testMatch: ['**/test/**/*.test.ts', '**/test/**/*.spec.ts', "**/test/*.test.ts"],
};
//# sourceMappingURL=jest.config.js.map