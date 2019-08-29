/**
 * 依赖收集
 */

/**
 * WT:
 * 1 两个name 收集的依赖 不应该都是一样的
 *      为什么this.deps.indexOf(dep)不能找到相同项
 * 2 
 */
class Dep {
    constructor() {
        this.deps = [];
    }
    addDep(dep) {
        console.log(dep)
        if (this.deps.indexOf(dep) === -1) this.deps.push(dep);
    }
    //通知依赖更新视图
    notify() {
        this.deps.forEach(dep => {
            dep.update();
        })
    }
}
Dep.target = null;
/**
 * 监听器
 */
class Watcher {
    constructor(vm, key, cb) {
        this.vm = vm;
        this.key = key;
        this.cb = cb;
        //每次执行watcher 都要先搜集（get） 然后再
        this.value = this.get()

    }
    get() {
        Dep.target = this;
        let value = this.vm[this.key];
        Dep.target = null
        return value;
    }
    update() {
        this.value = this.get();
        this.cb.call(this.vm, this.value)

        ////依赖收到指令==>准备更新
        // console.log('依赖收到指令==>准备更新')
    }
}


class Kvue {
    constructor(options) {
        this.$option = options;
        this.$data = options.data;
        this.$el = options.el;
        //监听对象里面的每一项
        this.observer(this.$data);

        //编译 需要在监听数据之后 执行
        this.$compile = new Compile(this.$el, this)

    }

    //针对 传入 data数据 遍历监控
    observer(data) {
        Object.keys(data).forEach(key => {
            this.proxyData(key)
            this.defineReactive(data, key, data[key])
        })
    }

    //监控data 数据 
    /**
     * 1 get 收集依赖
     * 2 set 通知依赖项
     */
    defineReactive(obj, key, val) {
        const deps = new Dep();
        Object.defineProperty(obj, key, {
            get() {
                if (Dep.target) deps.addDep(Dep.target);
                return val;
            },
            set(newVal) {
                val = newVal;
                // console.log('这里设置值的时候就可通知依赖了')
                deps.notify()
            }
        })
    }

    //类似 vue 里面处理把所有数据都代理到 this之上  目前只能通过this.$data 来访问
    proxyData(key) {
        Object.defineProperty(this, key, {
            get() {
                return this.$data[key]
            },
            set(newVal) {
                this.$data[key] = newVal
            }
        })
    }
}