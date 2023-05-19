function newReporter(obj){
	if(!obj) obj = {};

	let reporter = {};
	obj.reporter = reporter;
	reporter.obj = obj;
	reporter.dict = new Map();

	reporter.set = function(o, prop, val){
		let handler = reporter.dict.get(prop);
		if(handler){
			if(typeof handler == "function"){
				handler(val, obj[prop], prop);
			}else{
				for(let i = 0; i < handler.length; i++){
					handler[i](val, obj[prop], prop);
				}
			}
		}
		o[prop] = val;
		return true;
	};
	obj.on = function(prop, handler){	//	Handler args: (newValue, oldValue, property)
		let handlers = reporter.dict.get(prop);
		if(handlers){
			if(typeof handlers == "function"){
				handlers = [handlers, handler];
				reporter.dict.set(prop, handlers);
			}else{
				handlers.push(handler);
			}
		}else{
			reporter.dict.set(prop, handler);
		}
	};
	obj.onChangeUpdateText = function(prop, elem, transformer){	//	Transformer args: (newValue, oldValue), returns the new text of the text element
		if(typeof elem == "string") elem = document.getElementById(elem);
		obj.on(prop, (val, _)=>{
			let text = val;
			if(transformer) text = transformer(val, obj[prop]);
			elem.innerText = text;
		});
	};

	return new Proxy(obj, reporter);
}