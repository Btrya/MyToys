const vm=new Vue({
   el:'#app',
   data:{
       todos:[{isSelected:false,title:'睡觉'},
           {isSelected:false,title:'打王者'}],
       title:'',
       cur:'',
       hash:''
   },
   methods:{
       addTitle(){
           this.todos.push({isSelected:false,title:this.title})
           this.title="";
       },
       removeTitle(val){
           this.todos=this.todos.filter(item=>item!==val);
       },
       remember(val){
           this.cur=val;
       },
       cancel(){
           this.cur='';
       },
       returnBack(){
           this.todos.forEach(item=>{
               item.isSelected=false;
           })
       },
       finishAll(){
           this.todos.forEach(item=>{
               item.isSelected=true;
           })
       },
       backChoose(){
           this.todos.forEach(item=>{
               item.isSelected=!item.isSelected;
           })
       }
   },
   computed:{
       totalItem(){
           return this.todos.filter(item=>!item.isSelected).length;
       },
       filterTodos(){
           if(this.hash==='all') return this.todos;
           if(this.hash==='finish') return this.todos.filter(item=>item.isSelected);
           if(this.hash==='unfinish') return this.todos.filter(item=>!item.isSelected);
           return this.todos;
       }
   },
   directives:{
        focus(el,bindings){
            if(bindings.value){
                el.focus();
            }
        }
   },
   watch:{
       todos:{
           handler(){
               localStorage.setItem('data',JSON.stringify(this.todos));
           },deep:true
       }
   },
   created(){
       this.todos=JSON.parse(localStorage.getItem('data'))||this.todos;
       this.hash=window.location.hash.slice(2) || 'all';
       window.addEventListener('hashchange',()=>{
            this.hash=window.location.hash.slice(2);
       },false);
   }
});