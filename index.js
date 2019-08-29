

class MyVue{
    constructor(option){
        
        this.$el = document.querySelector(option.el);
        this.$data = option.data;
        this.$methods = option.methods;

        this.binding = {}

        this.obverse(this.$data);

        this.compile(this.$el)

    }
    obverse(data){
        let val
        for(let key in data){
            //不能是原型上的数据，只能是自己实例数据
            if(data.hasOwnProperty(key)){
                val = data[key]
                //确定绑定的data数据需要执行的回调函数
                this.binding[key] = {
                    directives:[]
                }
                
                if(typeof data[key] === 'object'){
                    this.obverse(data[key])
                }

                this.defineReactive(data,key,val)

                
            }
        }
        console.log(data);
    }
    defineReactive(data,key,val){
        let binding = this.binding[key];
        Object.defineProperty(data,key,{
            get(){
                console.log(`获取${key}值`)
                return val;
            },
            set(newVal){
                console.log(`设置${key}的值`)
                if(val != newVal){
                    val = newVal;
                    //item new Watcher 实例
                    binding.directives.forEach(item=>{
                        item.update();
                    })
                }
            }
        })
    }
    compile(rootEl){
        let _this = this;
        let nodes = rootEl.children;
        for(let i=0;i<nodes.length;i++){
            let node = nodes[i]
            if(node.children.length){
                _this.compile(node);
            }
            //vue 指令监听
            if(node.hasAttribute('v-click')){
                node.addEventListener('click',((node)=>{
                    //v-click上面绑定的直接就是methods里面的函数名字
                    let attrName = node.getAttribute('v-click');
                    return e=>{
                        _this.$methods[attrName].call(_this.$data);
                    }
                })(node),false)
            }

            if(node.hasAttribute('v-model') && node.tagName === 'INPUT'){
                
                node.addEventListener('input',((key)=>{
                    let attrName = node.getAttribute('v-model');
                    _this.binding[attrName].directives.push(new Watcher(
                        node,
                        _this,
                        attrName,
                        'value'
                    ))
                    return ()=>{
                        this.$data[attrName] = nodes[key].value;
                    }
                })(i))
            }
            if(node.hasAttribute('v-bind')){
                let attrName = node.getAttribute('v-bind');
                _this.binding[attrName].directives.push(new Watcher(node,_this,attrName,'innerHTML'))
            }
        }
    }
}

class Watcher{
    /**
     * 
     * @param {node} el  需要更新的元素
     * @param {string} vm 该元素需要绑定的数据对应的vue 实例
     * @param {*} exp 需要更新的字段
     * @param {*} attr 需要更新的el的属性
     */
    constructor(el,vm,exp,attr){
        this.el =  el;
        this.vm = vm;
        this.exp = exp;
        this.attr = attr;

        this.update();
    }
    update(){
        this.el[this.attr] = this.vm.$data[this.exp];
    }
}



new MyVue({
    el:'#app',
    data:{
        name:'luffy',
        age:10
    },
    methods:{
        add(){
            this.age++;
        }
    }

})