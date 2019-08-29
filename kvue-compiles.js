/**
 * compile 编译
 */
class Compile {
    constructor(el, vm) {

        this.$vm = vm;

        this.$el = document.querySelector(el);

        this.$fragment = this.createFragment(this.$el);

        //文档预编译 对象引用类型 直接通过方法直接改变数据源
        this.compileElement(this.$fragment)

        this.$el.appendChild(this.$fragment)

    }

    //文档节点碎片化
    createFragment(el) {
        let fragment = document.createDocumentFragment();
        let children
        while (children = el.firstChild) {
            fragment.appendChild(children)
        }
        return fragment;
    }
    compileElement(fragment) {
        let childNodes = fragment.childNodes;
        Array.from(childNodes).forEach(node => {
            let nodeContent = node.textContent;
            let reg = /\{\{(.*)\}\}/
            if (this.isElementNode(node)) {
                //如果是元素节点
                this.compile(node);
            } else if (this.isTextNode(node) && reg.test(nodeContent)) {
                //文本节点
                //$1 表示 reg 里面的(.*)  这段匹配
                this.compileText(node, RegExp.$1)
            }

            //如果节点还包含子节点 递归调用
            if (node.childNodes && node.childNodes.length) {
                this.compileElement(node);
            }
        })
    }

    //需要判断标签上面的 各种属性是否vue 所有
    //vue 事件等等
    compile(node) {
        //遍历所有的标签属性
        let attrs = node.attributes;

        Array.from(attrs).forEach(attr => {
            //属性名
            let attrName = attr.name;
            //vue 属性名对应的变量名 eg. k-text 的对应的变量名就是 name
            let key = attr.value;
            if (this.isVueAtrr(attrName)) {
                // console.log('vue 属性', attrName)

                //处理页面初始化数据
                //k-model ==> model
                //k-html ==> html
                //k-text ==> text
                let dir = attrName.slice(2)
                if (this[dir]) this[dir](node, this.$vm, key)

            } else if (this.isVueEvent(attrName)) {
                // console.log('vue 的事件', attrName)

                // @click => click
                let action = attrName.substring(1);
                this.eventListener(node, action, this.$vm, key)
            }
        })

    }

    //直接替换
    compileText(node, key) {
        // console.log('nodeText--', node, key)
        this.text(node, this.$vm, key)
    }

    eventListener(node, action, vm, key) {
        const fn = vm.$option.methods[key];
        //或者 fn.bind(vm) 这个只是声明作用于 并没有执行函数，执行需要 fn.bind(vm)()
        // fn.call(vm) 是直接执行该函数
        node.addEventListener(action, () => {
            fn.call(vm)
        }, false)
    }

    text(node, vm, key) {
        this.update(node, vm, key, 'text')
    }
    html(node, vm, key) {
        this.update(node, vm, key, 'html')
    }
    model(node, vm, key) {
        this.update(node, vm, key, 'model')

        node.addEventListener('input', e => {
            let val = e.target.value;
            vm[key] = val
        })
    }
    update(node, vm, key, dir) {
        let fn = this[dir + 'Updater'];
        fn && fn(node, vm, key)
            //设置依赖搜集 并且耦合监听器
        new Watcher(vm, key, value => {
            fn && fn(node, vm, key)
        })
    }
    textUpdater(node, vm, key) {
        //vm[key] 相当于 vm.$data[key]
        //vm[key] 相当于执行了vm.$data的get，这一步实现了依赖收集
        node.textContent = vm[key]
    }
    htmlUpdater(node, vm, key) {
        node.innerHTML = vm[key]
    }
    modelUpdater(node, vm, key) {
        node.value = vm[key]
    }

    //判断是kvue的属性
    isVueAtrr(attrName) {
        return attrName.indexOf('k-') === 0;
    }

    //判断是kvue事件
    isVueEvent(attrName) {
        return attrName.indexOf('@') === 0
    }

    //nodeType 1 代表元素节点 3代表文本节点
    isElementNode(node) {
        return node.nodeType === 1;
    }
    isTextNode(node) {
        return node.nodeType === 3
    }
}