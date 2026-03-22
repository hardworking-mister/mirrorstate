import { createStore } from '../src/index';
import { globalSignal, stateStore, middleware } from '../src/core';

const COMPONENT_ID = 'test-component-1';
const STORE_NAME = 'testStore';

describe('createStore 核心功能测试', () => {
  // 每个测试前清理，避免测试间相互影响
  beforeEach(() => {
    // 清理 stateStore
    if (stateStore.isStoreName(STORE_NAME)) {
      stateStore.delete(STORE_NAME);
    }

    // 这里可能需要清理 component Map
    // 由于 component 没有导出，可能需要其他清理方式
  });

  describe('store初始化测试', () => {
    test('第一次创建store应该初始化stateStore', () => {
      expect(stateStore.isStoreName(STORE_NAME)).toBe(false);
      let count = 100;
      let name = 'initial';

      const setCount = (value: number) => {
        count = value;
      };

      const setName = (value: string) => {
        name = value;
      };

      createStore({
        storeName: STORE_NAME,
        setMethod: {
          count: (v) => v ? setCount : count,
          name: (v) => v ? setName : name
        },
        componentId: COMPONENT_ID
      });

      expect(stateStore.isStoreName(STORE_NAME)).toBe(true);
      const store = stateStore.getStore(STORE_NAME);
      expect(store).toEqual({
        count: 100,
        name: 'initial'
      });
    });
  });

  describe('基础功能测试', () => {
    test('应该能创建store并正确获取/设置值', () => {
      let count = 0;
      let name = 'test';

      const setCount = (value: number) => {
        count = value;
      };

      const setName = (value: string) => {
        name = value;
      };

      const store = createStore({
        componentId: COMPONENT_ID,
        storeName: STORE_NAME,
        setMethod: {
          count: (v?: number) => v ? setCount : count,
          name: (v?: string) => v ? setName : name
        }
      });

      // 测试获取值
      expect(store.count()).toBe(0);
      expect(store.name()).toBe('test');

      // 测试设置值
      store.count(() => 100);
      store.name(() => 'updated');

      expect(store.count()).toBe(100);
      expect(store.name()).toBe('updated');

    });

    test('返回的对象应该包含batch和cleanup方法', () => {
      let count = 0;
      let name = 'test';

      const store = createStore({
        componentId: COMPONENT_ID,
        storeName: STORE_NAME,
        setMethod: {
          count: (v?: number) => v ? () => { } : count,
          name: (v?: string) => v ? () => { } : name
        }
      });

      expect(store.batch).toBeDefined();
      expect(store.cleanup).toBeDefined();
      expect(typeof store.batch).toBe('function');
      expect(typeof store.cleanup).toBe('function');
    });
  });

  describe('参数验证测试', () => {
    test('storeName不是字符串时应该抛出错误', () => {
      expect(() => {
        createStore({
          storeName: 123 as any,
          setMethod: {
            count: (v?: number) => v ? (value: number) => { } : 0
          },
          componentId: COMPONENT_ID
        });
      }).toThrow('storeName must be a string');
    });

  });


  describe('组件订阅管理测试', () => {
    test('同一组件多次调用应该返回相同的proxy', () => {
      let count = 0;

      const setCount = (value) => {
        count = value
      }
      const setMethod = {
        count: (v?: number) => v ? setCount : count
      };

      const store1 = createStore({
        storeName: STORE_NAME,
        setMethod,
        componentId: COMPONENT_ID
      });

      const store2 = createStore({
        storeName: STORE_NAME,
        setMethod,
        componentId: COMPONENT_ID
      });

      expect(store1).toBe(store2);

      // 验证通过store2设置的值，store1能获取到
      store2.count(() => 100);
      expect(store1.count()).toBe(100);
    });

    test('不同组件调用应该返回不同的proxy', () => {
      let count1 = 0;
      let count2 = 0;

      const setCount1 = (value) => {
        count1 = value
      }

      const setCount2 = (value) => {
        count2 = value
      }

      const store1 = createStore({
        storeName: STORE_NAME,
        setMethod: {
          count: (v?: number) => v ? setCount1 : count1
        },
        componentId: 'component-1'
      });

      const store2 = createStore({
        storeName: STORE_NAME,
        setMethod: {
          count: (v?: number) => v ? setCount2 : count2
        },
        componentId: 'component-2'
      });

      expect(store1).not.toBe(store2);

      // 组件2 修改仓库 组件一 应该也要改变
      store2.count(() => 200);

      expect(store1.count()).toBe(200);
      expect(store2.count()).toBe(200);
    });

    test('组件清理后重新创建应该返回新的proxy', () => {
      let count = 0;
      const setCount = (value) => {
        count = value
      }

      const setMethod = {
        count: (v?: number) => v ? setCount : count
      };

      // 第一次创建
      const store1 = createStore({
        storeName: STORE_NAME,
        setMethod,
        componentId: COMPONENT_ID
      });

      store1.count(() => 100);
      expect(store1.count()).toBe(100);

      // 调用cleanup清理
      store1.cleanup();

      // 重新创建
      const store2 = createStore({
        storeName: STORE_NAME,
        setMethod,
        componentId: COMPONENT_ID
      });

      expect(store1).not.toBe(store2);
      expect(store2.count()).toBe(100);
    });
  });

  describe('批量更新测试', () => {
    test('batch方法应该能批量更新多个状态', () => {
      let count = 0;
      let name = 'test';

      const setCount = (value) => {
        count = value
      }

      const setName = (value) => {
        name = value
      }

      const store = createStore({
        componentId: COMPONENT_ID,
        storeName: STORE_NAME,
        setMethod: {
          count: (v?: number) => v ? setCount : count,
          name: (v?: string) => v ? setName : name
        }
      });

      store.batch({
        count: 100,
        name: 'updated'
      });

      expect(store.count()).toBe(100);
      expect(store.name()).toBe('updated');
      store.cleanup()
    });
  });

  describe('中间件测试', () => {
    test('应该能正确应用中间件', () => {
      let count = 0;

      const setCount = (value) => {
        count = value
      }
      const middlewareFn = jest.fn();

      const midd = (ctx, next) => {
        console.log(ctx);

        middlewareFn()
        next()
      }

      const store = createStore({
        componentId: COMPONENT_ID,
        storeName: STORE_NAME,
        setMethod: {
          count: (v?: number) => v ? setCount : count
        },
        middlewares: [middlewareFn]
      });

      store.count(() => 100);

      expect(middlewareFn).toHaveBeenCalled();
    });
  });
});
