"use strict";
/**
 * applyAll applies the given object to all parts in the grammer.
 * The returned values of the parts are discarded.
 */
export function apply() {
    return new GrammarApply(...arguments);
}

/**
 * applyOne applies the given object to the parts in the grammar.
 * It stops when the first part matches and returns that result.
 */
export function one() {
    return new GrammarOne(...arguments);
}

/**
 * collect applies the given object to all parts in the grammar.
 * The returned values of those parts are collected and returned.
 */
export function collect() {
    return new GrammarCollect(...arguments);
}

/**
 * some applies the given object to the given part at least one times.
 */
export function some(part) {
    return new GrammarSome(part, false);
}

/**
 * maybeSome applies the given object to the given part any number of times.
 */
export function maybeSome(part) {
    return new GrammarSome(part, true);
}

export function attr(attrName, part) {
    return new GrammarAttr(attrName, part);
}

export function ignore(regex) {
    return new GrammarIgnore(regex);
}

export function optional(part) {
    return new GrammarOptional(part);
}

export function csl(part, separator) {
    return collect(part, maybeSome(collect(ignore(separator), part)));
}

export function parse(clazz, text) {
    let obj = new clazz();
    let [res, remainingText] = clazz.grammar.match(obj, text);
    return res;
}

class GrammarPartBase {
    match(obj, part, text) {
        let res = [obj];

        if (part instanceof RegExp) {
            let m = text.match(part);

            if (m === null || m.index != 0) {
                throw {
                    type: 'match_fail',
                    regex: part,
                    obj: obj.constructor.name,
                    text: text,
                }
            }

            return [m[0], text.slice(m[0].length)];
        } else if (part instanceof GrammarPartBase) {
            return part.match(obj, text);
        } else if (part.grammar !== undefined) {
            return part.grammar.match(new part(), text);
        } else {
            throw {
                type: 'unknown_part',
                part: part,
            }
        }
    }
}

class GrammarApply extends GrammarPartBase {
    constructor() {
        super();
        this.parts = [...arguments];
    }

    match(obj, _text) {
        let text = _text;

        for (const part of this.parts) {
            let [obj2, newText] = super.match(obj, part, text);
            text = newText;
        }

        return [obj, text];
    }
}


class GrammarCollect extends GrammarPartBase {
    constructor() {
        super();
        this.parts = [...arguments];
    }

    match(obj, _text) {
        let text = _text;

        let res = [];
        for (const part of this.parts) {

            let [obj2, newText] = super.match(obj, part, text);
            text = newText;

            if (Array.isArray(obj2)) {
                res.push(...obj2);
            } else if (typeof obj2 === 'string') {
                if (obj2.length > 0) {
                    res.push(obj2);
                }
            } else {
                res.push(obj2);
            }
        }

        return [res, text];
    }
}


class GrammarOne extends GrammarPartBase {
    constructor() {
        super();
        this.parts = [...arguments];
    }

    match(obj, _text) {
        let text = _text;

        for (const part of this.parts) {

            try {
                return super.match(obj, part, text);
            } catch (e) {
                continue;
            }
        }

        throw {
            type: 'or_fail',
            expected: this.parts,
            text: text,
        }
    }

}

class GrammarAttr extends GrammarPartBase {
    constructor(attrName, part) {
        super();
        this.attrName = attrName;
        this.part = part;
    }

    match(obj, text) {
        let [obj2, newText] = super.match(obj, this.part, text)
        obj[this.attrName] = obj2;

        return [obj, newText];
    }
}

class GrammarIgnore extends GrammarPartBase {
    constructor(part) {
        super();
        this.part = part;
    }

    match(obj, text) {
        let [obj2, newText] = super.match(obj, this.part, text);
        return [[], newText];
    }
}


class GrammarOptional extends GrammarPartBase {
    constructor(part) {
        super();
        this.part = part;
    }

    match(obj, text) {
        try {
            return super.match(obj, this.part, text);
        } catch(e) {
            return [[], text];
        }
    }
}

class GrammarSome extends GrammarPartBase {
    constructor(part, allowZero) {
        super();
        this.part = part;
        this.allowZero = allowZero;
    }

    match(obj, _text) {
        let text = _text;

        let res = [];
        try {
            while (text.length > 0) {
                let [obj2, newText] = super.match(obj, this.part, text)

                if (Array.isArray(obj2)) {
                    res.push(...obj2);
                } else if (typeof obj2 === 'string') {
                    if (obj2.length > 0) {
                        res.push(obj2);
                    }
                } else {
                    res.push(obj2);
                }

                text = newText;
            }
        } catch(e) { }

        if (this.allowZero == false && res.length == 0) {
            throw {
                type: 'some_fail',
                expected: this.parts,
                text: text,
            }
        }

        return [res, text];
    }
}
