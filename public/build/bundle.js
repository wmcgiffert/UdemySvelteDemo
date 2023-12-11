
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/ContactCard.svelte generated by Svelte v3.59.2 */

    const file$1 = "src/ContactCard.svelte";

    function create_fragment$1(ctx) {
    	let div3;
    	let header;
    	let div0;
    	let img;
    	let img_src_value;
    	let div0_class_value;
    	let t0;
    	let div1;
    	let h1;
    	let t1;
    	let t2;
    	let h2;
    	let t3;
    	let t4;
    	let div2;
    	let p;
    	let t5;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			header = element("header");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			t1 = text(/*userName*/ ctx[0]);
    			t2 = space();
    			h2 = element("h2");
    			t3 = text(/*jobTitle*/ ctx[1]);
    			t4 = space();
    			div2 = element("div");
    			p = element("p");
    			t5 = text(/*jobDescription*/ ctx[3]);
    			if (!src_url_equal(img.src, img_src_value = /*profPic*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Profile");
    			attr_dev(img, "class", "svelte-1qr1iil");
    			add_location(img, file$1, 10, 6, 224);
    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(/*profPic*/ ctx[2] ? 'thumb' : 'thumb thumb-palceHolder') + " svelte-1qr1iil"));
    			add_location(div0, file$1, 9, 4, 159);
    			attr_dev(h1, "class", "svelte-1qr1iil");
    			add_location(h1, file$1, 13, 6, 305);
    			attr_dev(h2, "class", "svelte-1qr1iil");
    			add_location(h2, file$1, 14, 6, 331);
    			attr_dev(div1, "class", "user-data svelte-1qr1iil");
    			add_location(div1, file$1, 12, 4, 275);
    			attr_dev(header, "class", "svelte-1qr1iil");
    			add_location(header, file$1, 8, 2, 146);
    			add_location(p, file$1, 18, 4, 406);
    			attr_dev(div2, "class", "description svelte-1qr1iil");
    			add_location(div2, file$1, 17, 2, 376);
    			attr_dev(div3, "class", "contact-card svelte-1qr1iil");
    			add_location(div3, file$1, 7, 0, 117);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, header);
    			append_dev(header, div0);
    			append_dev(div0, img);
    			append_dev(header, t0);
    			append_dev(header, div1);
    			append_dev(div1, h1);
    			append_dev(h1, t1);
    			append_dev(div1, t2);
    			append_dev(div1, h2);
    			append_dev(h2, t3);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, p);
    			append_dev(p, t5);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*profPic*/ 4 && !src_url_equal(img.src, img_src_value = /*profPic*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*profPic*/ 4 && div0_class_value !== (div0_class_value = "" + (null_to_empty(/*profPic*/ ctx[2] ? 'thumb' : 'thumb thumb-palceHolder') + " svelte-1qr1iil"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (dirty & /*userName*/ 1) set_data_dev(t1, /*userName*/ ctx[0]);
    			if (dirty & /*jobTitle*/ 2) set_data_dev(t3, /*jobTitle*/ ctx[1]);
    			if (dirty & /*jobDescription*/ 8) set_data_dev(t5, /*jobDescription*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ContactCard', slots, []);
    	let { userName } = $$props;
    	let { jobTitle } = $$props;
    	let { profPic } = $$props;
    	let { jobDescription } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (userName === undefined && !('userName' in $$props || $$self.$$.bound[$$self.$$.props['userName']])) {
    			console.warn("<ContactCard> was created without expected prop 'userName'");
    		}

    		if (jobTitle === undefined && !('jobTitle' in $$props || $$self.$$.bound[$$self.$$.props['jobTitle']])) {
    			console.warn("<ContactCard> was created without expected prop 'jobTitle'");
    		}

    		if (profPic === undefined && !('profPic' in $$props || $$self.$$.bound[$$self.$$.props['profPic']])) {
    			console.warn("<ContactCard> was created without expected prop 'profPic'");
    		}

    		if (jobDescription === undefined && !('jobDescription' in $$props || $$self.$$.bound[$$self.$$.props['jobDescription']])) {
    			console.warn("<ContactCard> was created without expected prop 'jobDescription'");
    		}
    	});

    	const writable_props = ['userName', 'jobTitle', 'profPic', 'jobDescription'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ContactCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('userName' in $$props) $$invalidate(0, userName = $$props.userName);
    		if ('jobTitle' in $$props) $$invalidate(1, jobTitle = $$props.jobTitle);
    		if ('profPic' in $$props) $$invalidate(2, profPic = $$props.profPic);
    		if ('jobDescription' in $$props) $$invalidate(3, jobDescription = $$props.jobDescription);
    	};

    	$$self.$capture_state = () => ({
    		userName,
    		jobTitle,
    		profPic,
    		jobDescription
    	});

    	$$self.$inject_state = $$props => {
    		if ('userName' in $$props) $$invalidate(0, userName = $$props.userName);
    		if ('jobTitle' in $$props) $$invalidate(1, jobTitle = $$props.jobTitle);
    		if ('profPic' in $$props) $$invalidate(2, profPic = $$props.profPic);
    		if ('jobDescription' in $$props) $$invalidate(3, jobDescription = $$props.jobDescription);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [userName, jobTitle, profPic, jobDescription];
    }

    class ContactCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			userName: 0,
    			jobTitle: 1,
    			profPic: 2,
    			jobDescription: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ContactCard",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get userName() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userName(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get jobTitle() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set jobTitle(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get profPic() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set profPic(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get jobDescription() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set jobDescription(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let button;
    	let t7;
    	let div0;
    	let span0;
    	let t9;
    	let input0;
    	let t10;
    	let div1;
    	let span1;
    	let t12;
    	let input1;
    	let t13;
    	let div2;
    	let span2;
    	let t15;
    	let input2;
    	let t16;
    	let div3;
    	let span3;
    	let t18;
    	let textarea;
    	let t19;
    	let contactcard;
    	let current;
    	let mounted;
    	let dispose;

    	contactcard = new ContactCard({
    			props: {
    				userName: /*name*/ ctx[0],
    				jobTitle: /*jobTitle*/ ctx[2],
    				profPic: /*profPic*/ ctx[3],
    				jobDescription: /*jobDescription*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("Hello I am ");
    			t1 = text(/*upppercaseName*/ ctx[5]);
    			t2 = text(", and I ");
    			t3 = text(/*age*/ ctx[1]);
    			t4 = text(" years old!");
    			t5 = space();
    			button = element("button");
    			button.textContent = "Change age";
    			t7 = space();
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Name:";
    			t9 = space();
    			input0 = element("input");
    			t10 = space();
    			div1 = element("div");
    			span1 = element("span");
    			span1.textContent = "Job Title:";
    			t12 = space();
    			input1 = element("input");
    			t13 = space();
    			div2 = element("div");
    			span2 = element("span");
    			span2.textContent = "Profile Picture URL:";
    			t15 = space();
    			input2 = element("input");
    			t16 = space();
    			div3 = element("div");
    			span3 = element("span");
    			span3.textContent = "Job Description:";
    			t18 = space();
    			textarea = element("textarea");
    			t19 = space();
    			create_component(contactcard.$$.fragment);
    			attr_dev(h1, "class", "svelte-1o13wxz");
    			add_location(h1, file, 27, 0, 896);
    			add_location(button, file, 28, 0, 957);
    			attr_dev(span0, "class", "svelte-1o13wxz");
    			add_location(span0, file, 31, 2, 1018);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file, 32, 2, 1040);
    			attr_dev(div0, "class", "svelte-1o13wxz");
    			add_location(div0, file, 30, 0, 1010);
    			attr_dev(span1, "class", "svelte-1o13wxz");
    			add_location(span1, file, 35, 2, 1104);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file, 36, 2, 1131);
    			attr_dev(div1, "class", "svelte-1o13wxz");
    			add_location(div1, file, 34, 0, 1096);
    			attr_dev(span2, "class", "svelte-1o13wxz");
    			add_location(span2, file, 39, 2, 1199);
    			attr_dev(input2, "type", "text");
    			add_location(input2, file, 40, 2, 1236);
    			attr_dev(div2, "class", "svelte-1o13wxz");
    			add_location(div2, file, 38, 0, 1191);
    			attr_dev(span3, "class", "svelte-1o13wxz");
    			add_location(span3, file, 43, 2, 1303);
    			attr_dev(textarea, "rows", "5");
    			attr_dev(textarea, "cols", "50");
    			add_location(textarea, file, 44, 2, 1336);
    			attr_dev(div3, "class", "svelte-1o13wxz");
    			add_location(div3, file, 42, 0, 1295);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(h1, t3);
    			append_dev(h1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, button, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, span0);
    			append_dev(div0, t9);
    			append_dev(div0, input0);
    			set_input_value(input0, /*name*/ ctx[0]);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span1);
    			append_dev(div1, t12);
    			append_dev(div1, input1);
    			set_input_value(input1, /*jobTitle*/ ctx[2]);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, span2);
    			append_dev(div2, t15);
    			append_dev(div2, input2);
    			set_input_value(input2, /*profPic*/ ctx[3]);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, span3);
    			append_dev(div3, t18);
    			append_dev(div3, textarea);
    			set_input_value(textarea, /*jobDescription*/ ctx[4]);
    			insert_dev(target, t19, anchor);
    			mount_component(contactcard, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*incrementAge*/ ctx[6], false, false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[10]),
    					listen_dev(input0, "input", /*input_handler*/ ctx[9], false, false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[11]),
    					listen_dev(input1, "input", /*input_handler_1*/ ctx[8], false, false, false, false),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[12]),
    					listen_dev(input2, "input", /*input_handler_2*/ ctx[7], false, false, false, false),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[13])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*upppercaseName*/ 32) set_data_dev(t1, /*upppercaseName*/ ctx[5]);
    			if (!current || dirty & /*age*/ 2) set_data_dev(t3, /*age*/ ctx[1]);

    			if (dirty & /*name*/ 1 && input0.value !== /*name*/ ctx[0]) {
    				set_input_value(input0, /*name*/ ctx[0]);
    			}

    			if (dirty & /*jobTitle*/ 4 && input1.value !== /*jobTitle*/ ctx[2]) {
    				set_input_value(input1, /*jobTitle*/ ctx[2]);
    			}

    			if (dirty & /*profPic*/ 8 && input2.value !== /*profPic*/ ctx[3]) {
    				set_input_value(input2, /*profPic*/ ctx[3]);
    			}

    			if (dirty & /*jobDescription*/ 16) {
    				set_input_value(textarea, /*jobDescription*/ ctx[4]);
    			}

    			const contactcard_changes = {};
    			if (dirty & /*name*/ 1) contactcard_changes.userName = /*name*/ ctx[0];
    			if (dirty & /*jobTitle*/ 4) contactcard_changes.jobTitle = /*jobTitle*/ ctx[2];
    			if (dirty & /*profPic*/ 8) contactcard_changes.profPic = /*profPic*/ ctx[3];
    			if (dirty & /*jobDescription*/ 16) contactcard_changes.jobDescription = /*jobDescription*/ ctx[4];
    			contactcard.$set(contactcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contactcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contactcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t19);
    			destroy_component(contactcard, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let upppercaseName;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let name = "Garrett";
    	let age = 33;
    	let jobTitle = "Software Dev";
    	let profPic = "https://resize.betalist.com/?dpr=2&fit=cover&format=auto&height=300&image=https%3A%2F%2Fcdn.betalist.com%2Fxuulgvf5hmtho0aent23szhnm9hj&signature=c0a1d28b02e9d47b8316a8750e97fbf025467e5e7f6801564cf7c5ec983aa67b";
    	let jobDescription = "Fullstack engineer with 5 years experience and 5 years experience in public accounting. Graduated the University of Alabama (2014 & 2021) in Accounting and Management Information Systems. Also has a Master of Accountancy from Belmont University (2016)";

    	function incrementAge() {
    		$$invalidate(1, age += 1);
    	}

    	function changeName() {
    		$$invalidate(0, name = "William");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	function input1_input_handler() {
    		jobTitle = this.value;
    		$$invalidate(2, jobTitle);
    	}

    	function input2_input_handler() {
    		profPic = this.value;
    		$$invalidate(3, profPic);
    	}

    	function textarea_input_handler() {
    		jobDescription = this.value;
    		$$invalidate(4, jobDescription);
    	}

    	$$self.$capture_state = () => ({
    		ContactCard,
    		name,
    		age,
    		jobTitle,
    		profPic,
    		jobDescription,
    		incrementAge,
    		changeName,
    		upppercaseName
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('age' in $$props) $$invalidate(1, age = $$props.age);
    		if ('jobTitle' in $$props) $$invalidate(2, jobTitle = $$props.jobTitle);
    		if ('profPic' in $$props) $$invalidate(3, profPic = $$props.profPic);
    		if ('jobDescription' in $$props) $$invalidate(4, jobDescription = $$props.jobDescription);
    		if ('upppercaseName' in $$props) $$invalidate(5, upppercaseName = $$props.upppercaseName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*name*/ 1) {
    			$$invalidate(5, upppercaseName = name.toUpperCase());
    		}

    		if ($$self.$$.dirty & /*name*/ 1) {
    			console.log(name);
    		}

    		if ($$self.$$.dirty & /*name*/ 1) {
    			if (name.toLocaleLowerCase() === "william") {
    				$$invalidate(1, age = 33);
    			}
    		}
    	};

    	return [
    		name,
    		age,
    		jobTitle,
    		profPic,
    		jobDescription,
    		upppercaseName,
    		incrementAge,
    		input_handler_2,
    		input_handler_1,
    		input_handler,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		textarea_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
