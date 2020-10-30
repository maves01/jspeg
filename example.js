"use strict";

import { 
    parse,
    attr,
    some,
    one,
    ignore,
} from './src/index.js'


class Word {}
Word.grammar = attr('content', /\w+/);

class Sentence {}
Sentence.grammar = attr('content', some(one(ignore(/ +/), Word)));


console.dir(parse(Sentence, 'This is a test'), {depth: null});
